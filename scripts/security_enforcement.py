"""
Security Enforcement Module for ICS Security Training Simulator

This module enforces security rules configured in the database:
- Protocol filtering (Modbus function code allowlists)
- Rate limiting
- IDS-style detection and alerting
- Access control lists
- Attack logging

The system starts VULNERABLE by default. As users enable rules,
the defenses become active and block attacks.
"""

import os
import time
import json
import asyncio
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
load_dotenv(PROJECT_DIR / '.env')

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

MODBUS_FUNCTION_CODES = {
    1: "READ_COILS",
    2: "READ_DISCRETE_INPUTS",
    3: "READ_HOLDING_REGISTERS",
    4: "READ_INPUT_REGISTERS",
    5: "WRITE_SINGLE_COIL",
    6: "WRITE_SINGLE_REGISTER",
    15: "WRITE_MULTIPLE_COILS",
    16: "WRITE_MULTIPLE_REGISTERS",
}

WRITE_FUNCTION_CODES = [5, 6, 15, 16]
READ_FUNCTION_CODES = [1, 2, 3, 4]

SAFETY_CRITICAL_ADDRESSES = list(range(0, 11))


@dataclass
class SecurityConfig:
    id: str = ""
    network_segmentation_enabled: bool = False
    protocol_filtering_enabled: bool = False
    authentication_enabled: bool = False
    ids_enabled: bool = False
    firewall_enabled: bool = False
    security_score: int = 0


@dataclass
class DefenseRule:
    id: str
    rule_type: str
    name: str
    description: str
    rule_definition: dict
    enabled: bool
    order_priority: int
    blocks_challenges: list


@dataclass
class ProtocolPolicy:
    id: str
    name: str
    source_zone: str
    function_codes_allowed: list
    address_ranges_allowed: dict
    rate_limit_per_second: int
    requires_auth: bool
    enabled: bool
    order_priority: int


@dataclass
class SecurityAlert:
    timestamp: str
    alert_type: str
    severity: str
    source_ip: str
    function_code: Optional[int]
    address: Optional[int]
    rule_name: str
    message: str
    blocked: bool


@dataclass
class EnforcementResult:
    allowed: bool
    blocked_by: Optional[str] = None
    defense_layer: Optional[str] = None
    alerts: list = field(default_factory=list)
    log_id: Optional[str] = None


class RateLimiter:
    def __init__(self):
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.window_seconds = 1.0

    def check_rate(self, source_ip: str, max_requests: int) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds

        self.requests[source_ip] = [
            t for t in self.requests[source_ip] if t > cutoff
        ]

        if len(self.requests[source_ip]) >= max_requests:
            return False

        self.requests[source_ip].append(now)
        return True

    def get_request_count(self, source_ip: str) -> int:
        now = time.time()
        cutoff = now - self.window_seconds
        self.requests[source_ip] = [
            t for t in self.requests[source_ip] if t > cutoff
        ]
        return len(self.requests[source_ip])


class SecurityEnforcement:
    def __init__(self):
        self.config = SecurityConfig()
        self.rules: list[DefenseRule] = []
        self.policies: list[ProtocolPolicy] = []
        self.rate_limiter = RateLimiter()
        self.alerts: list[SecurityAlert] = []
        self.alert_callbacks: list = []
        self._last_config_load = 0
        self._config_ttl = 5
        self._supabase_client = None

    def _get_supabase(self):
        if self._supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
            try:
                from supabase import create_client
                self._supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            except ImportError:
                print("⚠️ [SECURITY] supabase-py not installed, using in-memory config only")
            except Exception as e:
                print(f"⚠️ [SECURITY] Failed to create Supabase client: {e}")
        return self._supabase_client

    async def load_config_from_db(self) -> bool:
        now = time.time()
        if now - self._last_config_load < self._config_ttl:
            return True

        client = self._get_supabase()
        if not client:
            return False

        try:
            config_result = client.table('security_configurations')\
                .select('*')\
                .eq('is_active', True)\
                .limit(1)\
                .execute()

            if config_result.data:
                row = config_result.data[0]
                self.config = SecurityConfig(
                    id=row['id'],
                    network_segmentation_enabled=row.get('network_segmentation_enabled', False),
                    protocol_filtering_enabled=row.get('protocol_filtering_enabled', False),
                    authentication_enabled=row.get('authentication_enabled', False),
                    ids_enabled=row.get('ids_enabled', False),
                    firewall_enabled=row.get('firewall_enabled', False),
                    security_score=row.get('security_score', 0),
                )

                rules_result = client.table('defense_rules')\
                    .select('*')\
                    .eq('config_id', self.config.id)\
                    .eq('enabled', True)\
                    .order('order_priority')\
                    .execute()

                self.rules = [
                    DefenseRule(
                        id=r['id'],
                        rule_type=r['rule_type'],
                        name=r['name'],
                        description=r.get('description', ''),
                        rule_definition=r.get('rule_definition', {}),
                        enabled=r['enabled'],
                        order_priority=r.get('order_priority', 100),
                        blocks_challenges=r.get('blocks_challenges', []),
                    )
                    for r in rules_result.data
                ]

                policies_result = client.table('protocol_policies')\
                    .select('*')\
                    .eq('config_id', self.config.id)\
                    .eq('enabled', True)\
                    .order('order_priority')\
                    .execute()

                self.policies = [
                    ProtocolPolicy(
                        id=p['id'],
                        name=p['name'],
                        source_zone=p.get('source_zone', '*'),
                        function_codes_allowed=p.get('function_codes_allowed', []),
                        address_ranges_allowed=p.get('address_ranges_allowed', {}),
                        rate_limit_per_second=p.get('rate_limit_per_second', 0),
                        requires_auth=p.get('requires_auth', False),
                        enabled=p['enabled'],
                        order_priority=p.get('order_priority', 100),
                    )
                    for p in policies_result.data
                ]

                self._last_config_load = now
                return True

        except Exception as e:
            print(f"⚠️ [SECURITY] Error loading config from DB: {e}")

        return False

    def _log_attack_to_db(
        self,
        attack_type: str,
        source_ip: str,
        target_address: Optional[int],
        function_code: Optional[int],
        blocked: bool,
        blocked_by: Optional[str],
        defense_layer: Optional[str],
        details: dict
    ) -> Optional[str]:
        client = self._get_supabase()
        if not client or not self.config.id:
            return None

        try:
            result = client.table('attack_logs').insert({
                'config_id': self.config.id,
                'attack_type': attack_type,
                'source_ip': source_ip,
                'target_address': target_address,
                'function_code': function_code,
                'blocked': blocked,
                'blocked_by': blocked_by,
                'defense_layer': defense_layer,
                'details': details,
            }).execute()

            if result.data:
                return result.data[0]['id']
        except Exception as e:
            print(f"⚠️ [SECURITY] Error logging attack: {e}")

        return None

    def _create_alert(
        self,
        alert_type: str,
        severity: str,
        source_ip: str,
        function_code: Optional[int],
        address: Optional[int],
        rule_name: str,
        message: str,
        blocked: bool
    ) -> SecurityAlert:
        alert = SecurityAlert(
            timestamp=datetime.now().isoformat(),
            alert_type=alert_type,
            severity=severity,
            source_ip=source_ip,
            function_code=function_code,
            address=address,
            rule_name=rule_name,
            message=message,
            blocked=blocked,
        )

        self.alerts.append(alert)
        if len(self.alerts) > 1000:
            self.alerts = self.alerts[-500:]

        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                print(f"⚠️ [SECURITY] Alert callback error: {e}")

        return alert

    def _check_firewall_rules(
        self,
        source_ip: str,
        function_code: int,
        address: int
    ) -> tuple[bool, Optional[str]]:
        if not self.config.firewall_enabled:
            return True, None

        firewall_rules = [r for r in self.rules if r.rule_type == 'firewall']

        for rule in firewall_rules:
            definition = rule.rule_definition
            action = definition.get('action', 'allow')

            if action == 'deny':
                source_match = definition.get('source', '*')
                if source_match == 'external' or source_match == '*':
                    return False, rule.name
                if source_ip.startswith(source_match.replace('/24', '').replace('/16', '')):
                    continue
                return False, rule.name

        return True, None

    def _check_protocol_filters(
        self,
        source_ip: str,
        function_code: int,
        address: int
    ) -> tuple[bool, Optional[str]]:
        if not self.config.protocol_filtering_enabled:
            return True, None

        protocol_rules = [r for r in self.rules if r.rule_type == 'protocol_filter']

        for rule in protocol_rules:
            definition = rule.rule_definition
            action = definition.get('action', 'allow')

            rule_fc = definition.get('function_code')
            rule_fcs = definition.get('function_codes', [])

            fc_match = False
            if rule_fc is not None and rule_fc == function_code:
                fc_match = True
            if function_code in rule_fcs:
                fc_match = True

            if not fc_match:
                continue

            except_sources = definition.get('except_sources', [])
            source_exempt = False
            for exempt in except_sources:
                if exempt == '*':
                    source_exempt = True
                    break
                exempt_prefix = exempt.replace('/24', '').replace('/16', '').rstrip('.')
                if source_ip.startswith(exempt_prefix):
                    source_exempt = True
                    break

            if action == 'deny' and not source_exempt:
                return False, rule.name

        return True, None

    def _check_rate_limits(
        self,
        source_ip: str,
        function_code: int
    ) -> tuple[bool, Optional[str]]:
        rate_rules = [r for r in self.rules if r.rule_type == 'rate_limit']

        for rule in rate_rules:
            definition = rule.rule_definition
            max_requests = definition.get('max_requests', 100)
            rule_fcs = definition.get('function_codes', [])

            if rule_fcs and function_code not in rule_fcs:
                continue

            if not self.rate_limiter.check_rate(source_ip, max_requests):
                return False, rule.name

        return True, None

    def _check_ids_rules(
        self,
        source_ip: str,
        function_code: int,
        address: int,
        value: Optional[any] = None
    ) -> list[SecurityAlert]:
        alerts = []

        if not self.config.ids_enabled:
            return alerts

        ids_rules = [r for r in self.rules if r.rule_type == 'ids_signature']

        for rule in ids_rules:
            definition = rule.rule_definition
            rule_type = definition.get('type', '')
            severity = definition.get('alert_severity', 'medium')

            triggered = False
            message = ""

            if rule_type == 'modbus_write':
                monitored_addresses = definition.get('addresses', [])
                if address in monitored_addresses and function_code in WRITE_FUNCTION_CODES:
                    triggered = True
                    message = f"Write attempt to monitored address {address}"

            elif rule_type == 'address_monitor':
                addr_range = definition.get('address_range', [])
                if len(addr_range) == 2 and addr_range[0] <= address <= addr_range[1]:
                    triggered = True
                    message = f"Access to monitored address range [{addr_range[0]}-{addr_range[1]}]"

            elif rule_type == 'rate_anomaly':
                threshold = definition.get('threshold', 10)
                rule_fcs = definition.get('function_codes', WRITE_FUNCTION_CODES)
                if function_code in rule_fcs:
                    request_count = self.rate_limiter.get_request_count(source_ip)
                    if request_count >= threshold:
                        triggered = True
                        message = f"Rate anomaly detected: {request_count} requests in 1 second"

            elif rule_type == 'connection_monitor':
                allowed_sources = definition.get('allowed_sources', [])
                is_allowed = False
                for allowed in allowed_sources:
                    if allowed == '*':
                        is_allowed = True
                        break
                    prefix = allowed.replace('/24', '').replace('/16', '').rstrip('.')
                    if source_ip.startswith(prefix):
                        is_allowed = True
                        break
                if not is_allowed:
                    triggered = True
                    message = f"Connection from unauthorized source: {source_ip}"

            if triggered:
                action = definition.get('action', 'alert')
                blocked = action == 'alert_and_block'

                alert = self._create_alert(
                    alert_type=rule_type,
                    severity=severity,
                    source_ip=source_ip,
                    function_code=function_code,
                    address=address,
                    rule_name=rule.name,
                    message=message,
                    blocked=blocked,
                )
                alerts.append(alert)

                print(f"🚨 [IDS] {severity.upper()}: {rule.name} - {message}")

        return alerts

    async def enforce(
        self,
        operation: str,
        source_ip: str,
        function_code: int,
        address: int,
        value: Optional[any] = None,
        authenticated: bool = False
    ) -> EnforcementResult:
        await self.load_config_from_db()

        result = EnforcementResult(allowed=True)

        is_write = function_code in WRITE_FUNCTION_CODES
        is_safety_critical = address in SAFETY_CRITICAL_ADDRESSES

        allowed, blocked_by = self._check_firewall_rules(source_ip, function_code, address)
        if not allowed:
            result.allowed = False
            result.blocked_by = blocked_by
            result.defense_layer = 'firewall'
            print(f"🛡️ [FIREWALL] Blocked {operation} from {source_ip}: {blocked_by}")

        if result.allowed:
            allowed, blocked_by = self._check_protocol_filters(source_ip, function_code, address)
            if not allowed:
                result.allowed = False
                result.blocked_by = blocked_by
                result.defense_layer = 'protocol_filter'
                fc_name = MODBUS_FUNCTION_CODES.get(function_code, f"FC{function_code}")
                print(f"🛡️ [PROTOCOL] Blocked {fc_name} from {source_ip}: {blocked_by}")

        if result.allowed:
            allowed, blocked_by = self._check_rate_limits(source_ip, function_code)
            if not allowed:
                result.allowed = False
                result.blocked_by = blocked_by
                result.defense_layer = 'rate_limit'
                print(f"🛡️ [RATE LIMIT] Blocked from {source_ip}: {blocked_by}")

        ids_alerts = self._check_ids_rules(source_ip, function_code, address, value)
        result.alerts = ids_alerts

        if result.allowed:
            for alert in ids_alerts:
                if alert.blocked:
                    result.allowed = False
                    result.blocked_by = alert.rule_name
                    result.defense_layer = 'ids'
                    print(f"🛡️ [IDS] Blocked by signature: {alert.rule_name}")
                    break

        if is_write or not result.allowed or ids_alerts:
            attack_type = "write_attempt" if is_write else "read_attempt"
            if is_safety_critical:
                attack_type = f"safety_critical_{attack_type}"

            log_id = self._log_attack_to_db(
                attack_type=attack_type,
                source_ip=source_ip,
                target_address=address,
                function_code=function_code,
                blocked=not result.allowed,
                blocked_by=result.blocked_by,
                defense_layer=result.defense_layer,
                details={
                    "value": str(value) if value is not None else None,
                    "authenticated": authenticated,
                    "alerts": [a.message for a in ids_alerts],
                }
            )
            result.log_id = log_id

        return result

    def get_security_status(self) -> dict:
        return {
            "config": {
                "network_segmentation": self.config.network_segmentation_enabled,
                "protocol_filtering": self.config.protocol_filtering_enabled,
                "authentication": self.config.authentication_enabled,
                "ids": self.config.ids_enabled,
                "firewall": self.config.firewall_enabled,
                "score": self.config.security_score,
            },
            "active_rules": len(self.rules),
            "active_policies": len(self.policies),
            "recent_alerts": len([a for a in self.alerts if
                (datetime.now() - datetime.fromisoformat(a.timestamp)).seconds < 60
            ]),
        }

    def register_alert_callback(self, callback):
        self.alert_callbacks.append(callback)

    def get_recent_alerts(self, limit: int = 50) -> list[dict]:
        return [
            {
                "timestamp": a.timestamp,
                "type": a.alert_type,
                "severity": a.severity,
                "source_ip": a.source_ip,
                "function_code": a.function_code,
                "address": a.address,
                "rule": a.rule_name,
                "message": a.message,
                "blocked": a.blocked,
            }
            for a in self.alerts[-limit:]
        ]


security_enforcer = SecurityEnforcement()


async def check_modbus_operation(
    operation: str,
    source_ip: str,
    function_code: int,
    address: int,
    value: any = None,
    authenticated: bool = False
) -> EnforcementResult:
    return await security_enforcer.enforce(
        operation=operation,
        source_ip=source_ip,
        function_code=function_code,
        address=address,
        value=value,
        authenticated=authenticated,
    )


def get_security_status() -> dict:
    return security_enforcer.get_security_status()


def get_recent_alerts(limit: int = 50) -> list[dict]:
    return security_enforcer.get_recent_alerts(limit)
