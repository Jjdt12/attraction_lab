import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingUp,
  Layers,
  Filter,
  Eye,
  Lock,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FirewallRuleEditor, type FirewallRule } from './FirewallRuleEditor';
import { ProtocolFilterBuilder, type ProtocolFilter } from './ProtocolFilterBuilder';
import { IDSSignatureBuilder, type IDSSignature } from './IDSSignatureBuilder';
import { ACLEditor, type AccessControlEntry } from './ACLEditor';

interface SecurityScore {
  totalScore: number;
  networkScore: number;
  firewallScore: number;
  protocolScore: number;
  authScore: number;
  idsScore: number;
}

function ScoreGauge({ score, maxScore, label, color }: {
  score: number;
  maxScore: number;
  label: string;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeDasharray={`${percentage * 1.76} 176`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 mt-1">{label}</span>
      <span className="text-[9px] text-slate-500">/ {maxScore}</span>
    </div>
  );
}

function AttackTestPanel({
  firewallRules,
  protocolFilters,
  idsSignatures,
  aclEntries,
}: {
  firewallRules: FirewallRule[];
  protocolFilters: ProtocolFilter[];
  idsSignatures: IDSSignature[];
  aclEntries: AccessControlEntry[];
}) {
  const [testResults, setTestResults] = useState<{
    attack: string;
    blocked: boolean;
    blockedBy: string;
    layer: string;
  }[]>([]);
  const [running, setRunning] = useState(false);

  const attacks = [
    { id: 'scan', name: 'Register Scan', layer: 'IDS', description: 'Rapid enumeration of register values' },
    { id: 'write_safety', name: 'Safety Override Write', layer: 'Protocol', description: 'Attempt to write FC5 to safety coil 100' },
    { id: 'enterprise_access', name: 'Enterprise Zone Access', layer: 'Firewall', description: 'Direct Modbus from enterprise to control' },
    { id: 'anon_write', name: 'Unauthenticated Write', layer: 'ACL', description: 'Write without authentication' },
    { id: 'replay', name: 'Command Replay', layer: 'IDS', description: 'Repeated identical write commands' },
  ];

  const runTests = async () => {
    setRunning(true);
    setTestResults([]);

    for (const attack of attacks) {
      await new Promise(resolve => setTimeout(resolve, 500));

      let blocked = false;
      let blockedBy = 'None';

      if (attack.id === 'scan') {
        const sig = idsSignatures.find(s =>
          s.enabled &&
          s.detectionType === 'threshold' &&
          s.threshold?.metric === 'requests_per_second'
        );
        if (sig) {
          blocked = true;
          blockedBy = sig.name;
        }
      } else if (attack.id === 'write_safety') {
        const filter = protocolFilters.find(f =>
          f.enabled &&
          (f.blockedFunctionCodes.includes(5) ||
           (f.allowedFunctionCodes.length > 0 && !f.allowedFunctionCodes.includes(5)))
        );
        if (filter) {
          blocked = true;
          blockedBy = filter.name;
        }
      } else if (attack.id === 'enterprise_access') {
        const rule = firewallRules.find(r =>
          r.enabled &&
          r.action === 'deny' &&
          (r.sourceZone === 'enterprise' || r.sourceIp?.includes('10.0.'))
        );
        if (rule) {
          blocked = true;
          blockedBy = rule.name;
        }
      } else if (attack.id === 'anon_write') {
        const acl = aclEntries.find(a =>
          a.enabled &&
          a.permission === 'deny' &&
          a.operations.includes('write') &&
          a.conditions.authLevelRequired !== 'none'
        );
        const allowAcl = aclEntries.find(a =>
          a.enabled &&
          a.permission === 'allow' &&
          a.operations.includes('write') &&
          a.conditions.authLevelRequired !== 'none'
        );
        if (acl || allowAcl) {
          blocked = true;
          blockedBy = acl?.name || allowAcl?.name || 'ACL';
        }
      } else if (attack.id === 'replay') {
        const sig = idsSignatures.find(s =>
          s.enabled &&
          (s.detectionType === 'sequence' || s.detectionType === 'anomaly')
        );
        if (sig) {
          blocked = true;
          blockedBy = sig.name;
        }
      }

      setTestResults(prev => [...prev, {
        attack: attack.name,
        blocked,
        blockedBy,
        layer: attack.layer,
      }]);
    }

    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="text-amber-400" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">Test Your Defenses</h3>
            <p className="text-xs text-slate-400">
              Simulate attacks against your current security configuration
            </p>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 rounded-lg text-sm text-white font-medium transition-colors"
        >
          <Play size={16} />
          {running ? 'Running...' : 'Run Attack Tests'}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {attacks.map((attack) => {
          const result = testResults.find(r => r.attack === attack.name);
          return (
            <div
              key={attack.id}
              className={`p-3 rounded-lg border transition-all ${
                result
                  ? result.blocked
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result ? (
                  result.blocked ? (
                    <CheckCircle size={14} className="text-emerald-400" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className="text-xs font-medium text-white">{attack.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">{attack.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Layer: {attack.layer}</span>
                {result && (
                  <span className={`text-[10px] ${result.blocked ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.blocked ? 'Blocked' : 'Allowed'}
                  </span>
                )}
              </div>
              {result?.blocked && (
                <div className="mt-1 text-[10px] text-slate-400 truncate">
                  By: {result.blockedBy}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {testResults.length > 0 && (
        <div className={`p-3 rounded-lg border ${
          testResults.every(r => r.blocked)
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : testResults.some(r => r.blocked)
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-2">
            {testResults.every(r => r.blocked) ? (
              <ShieldCheck size={16} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={16} className={testResults.some(r => r.blocked) ? 'text-amber-400' : 'text-red-400'} />
            )}
            <span className={
              testResults.every(r => r.blocked)
                ? 'text-emerald-300'
                : testResults.some(r => r.blocked)
                  ? 'text-amber-300'
                  : 'text-red-300'
            }>
              {testResults.filter(r => r.blocked).length} / {testResults.length} attacks blocked
              {testResults.every(r => r.blocked)
                ? ' - Excellent defense!'
                : ' - Review your security configuration'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SecurityTrainingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'firewall' | 'protocol' | 'ids' | 'acl'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);

  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [protocolFilters, setProtocolFilters] = useState<ProtocolFilter[]>([]);
  const [idsSignatures, setIdsSignatures] = useState<IDSSignature[]>([]);
  const [aclEntries, setAclEntries] = useState<AccessControlEntry[]>([]);

  const [score, setScore] = useState<SecurityScore>({
    totalScore: 0,
    networkScore: 0,
    firewallScore: 0,
    protocolScore: 0,
    authScore: 0,
    idsScore: 0,
  });

  const calculateScore = useCallback(() => {
    const enabledFirewall = firewallRules.filter(r => r.enabled).length;
    const enabledFilters = protocolFilters.filter(f => f.enabled).length;
    const enabledIDS = idsSignatures.filter(s => s.enabled).length;
    const enabledACL = aclEntries.filter(a => a.enabled).length;

    const firewallScore = Math.min(25, enabledFirewall * 8);
    const protocolScore = Math.min(25, enabledFilters * 8);
    const idsScore = Math.min(10, enabledIDS * 3);
    const authScore = Math.min(15, enabledACL * 5);
    const networkScore = Math.min(25, Math.floor((firewallScore + protocolScore) / 2));

    const totalScore = Math.min(100, networkScore + firewallScore + protocolScore + authScore + idsScore);

    setScore({ totalScore, networkScore, firewallScore, protocolScore, authScore, idsScore });
  }, [firewallRules, protocolFilters, idsSignatures, aclEntries]);

  const loadConfiguration = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: configData } = await supabase
        .from('security_configurations')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      let cId = configData?.id;
      if (!configData) {
        const { data: newConfig } = await supabase
          .from('security_configurations')
          .insert({
            name: 'Training Configuration',
            is_active: true,
            security_score: 0,
          })
          .select()
          .single();
        cId = newConfig?.id;
      }
      setConfigId(cId);

      if (cId) {
        const { data: rules } = await supabase
          .from('user_firewall_rules')
          .select('*')
          .eq('config_id', cId)
          .order('priority');

        if (rules) {
          setFirewallRules(rules.map(r => ({
            id: r.id,
            name: r.name,
            enabled: r.enabled,
            priority: r.priority,
            sourceIp: r.source_ip || '',
            sourcePort: r.source_port || 'any',
            destinationIp: r.destination_ip || '',
            destinationPort: r.destination_port || '',
            protocol: r.protocol || 'tcp',
            action: r.action || 'deny',
            direction: r.direction || 'inbound',
            description: r.description || '',
            sourceZone: r.source_zone || 'any',
            destinationZone: r.destination_zone || 'control',
          })));
        }

        const { data: filters } = await supabase
          .from('user_protocol_filters')
          .select('*')
          .eq('config_id', cId);

        if (filters) {
          setProtocolFilters(filters.map(f => ({
            id: f.id,
            name: f.name,
            enabled: f.enabled,
            sourceZone: f.source_zone || 'any',
            allowedFunctionCodes: f.allowed_function_codes || [],
            blockedFunctionCodes: f.blocked_function_codes || [],
            addressRanges: f.address_ranges || [],
            rateLimit: f.rate_limit,
            description: f.description || '',
          })));
        }

        const { data: sigs } = await supabase
          .from('user_ids_signatures')
          .select('*')
          .eq('config_id', cId);

        if (sigs) {
          setIdsSignatures(sigs.map(s => ({
            id: s.id,
            name: s.name,
            enabled: s.enabled,
            severity: s.severity || 'medium',
            detectionType: s.detection_type || 'threshold',
            action: s.action || 'alert',
            pattern: s.pattern_config,
            threshold: s.threshold_config,
            anomaly: s.anomaly_config,
            sequence: s.sequence_config,
            description: s.description || '',
            mitreTactic: s.mitre_tactic || '',
            mitreId: s.mitre_id || '',
          })));
        }

        const { data: acls } = await supabase
          .from('user_acl_entries')
          .select('*')
          .eq('config_id', cId)
          .order('priority');

        if (acls) {
          setAclEntries(acls.map(a => ({
            id: a.id,
            name: a.name,
            enabled: a.enabled,
            priority: a.priority,
            subjectType: a.subject_type || 'role',
            subjectValue: a.subject_value || '',
            resourceType: a.resource_type || 'all',
            resourceValue: a.resource_value || '',
            permission: a.permission || 'deny',
            operations: a.operations || [],
            conditions: a.conditions || {
              timeRestriction: null,
              authLevelRequired: 'basic',
              requireEncryption: false,
              maxSessionDuration: null,
              sourceVerification: 'none',
            },
            description: a.description || '',
          })));
        }
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    calculateScore();
  }, [calculateScore]);

  const saveFirewallRules = async (rules: FirewallRule[]) => {
    if (!configId) return;

    await supabase.from('user_firewall_rules').delete().eq('config_id', configId);

    const toInsert = rules.map(r => ({
      config_id: configId,
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      priority: r.priority,
      source_ip: r.sourceIp,
      source_port: r.sourcePort,
      destination_ip: r.destinationIp,
      destination_port: r.destinationPort,
      protocol: r.protocol,
      action: r.action,
      direction: r.direction,
      description: r.description,
      source_zone: r.sourceZone,
      destination_zone: r.destinationZone,
    }));

    if (toInsert.length > 0) {
      await supabase.from('user_firewall_rules').insert(toInsert);
    }

    setFirewallRules(rules);
  };

  const saveProtocolFilters = async (filters: ProtocolFilter[]) => {
    if (!configId) return;

    await supabase.from('user_protocol_filters').delete().eq('config_id', configId);

    const toInsert = filters.map(f => ({
      config_id: configId,
      id: f.id,
      name: f.name,
      enabled: f.enabled,
      source_zone: f.sourceZone,
      allowed_function_codes: f.allowedFunctionCodes,
      blocked_function_codes: f.blockedFunctionCodes,
      address_ranges: f.addressRanges,
      rate_limit: f.rateLimit,
      description: f.description,
    }));

    if (toInsert.length > 0) {
      await supabase.from('user_protocol_filters').insert(toInsert);
    }

    setProtocolFilters(filters);
  };

  const saveIdsSignatures = async (signatures: IDSSignature[]) => {
    if (!configId) return;

    await supabase.from('user_ids_signatures').delete().eq('config_id', configId);

    const toInsert = signatures.map(s => ({
      config_id: configId,
      id: s.id,
      name: s.name,
      enabled: s.enabled,
      severity: s.severity,
      detection_type: s.detectionType,
      action: s.action,
      pattern_config: s.pattern,
      threshold_config: s.threshold,
      anomaly_config: s.anomaly,
      sequence_config: s.sequence,
      description: s.description,
      mitre_tactic: s.mitreTactic,
      mitre_id: s.mitreId,
    }));

    if (toInsert.length > 0) {
      await supabase.from('user_ids_signatures').insert(toInsert);
    }

    setIdsSignatures(signatures);
  };

  const saveAclEntries = async (entries: AccessControlEntry[]) => {
    if (!configId) return;

    await supabase.from('user_acl_entries').delete().eq('config_id', configId);

    const toInsert = entries.map(a => ({
      config_id: configId,
      id: a.id,
      name: a.name,
      enabled: a.enabled,
      priority: a.priority,
      subject_type: a.subjectType,
      subject_value: a.subjectValue,
      resource_type: a.resourceType,
      resource_value: a.resourceValue,
      permission: a.permission,
      operations: a.operations,
      conditions: a.conditions,
      description: a.description,
    }));

    if (toInsert.length > 0) {
      await supabase.from('user_acl_entries').insert(toInsert);
    }

    setAclEntries(entries);
  };

  const validateConfig = async () => {
    calculateScore();
    return { valid: true, errors: [] };
  };

  const resetToVulnerable = async () => {
    if (!configId) return;

    await supabase.from('user_firewall_rules').delete().eq('config_id', configId);
    await supabase.from('user_protocol_filters').delete().eq('config_id', configId);
    await supabase.from('user_ids_signatures').delete().eq('config_id', configId);
    await supabase.from('user_acl_entries').delete().eq('config_id', configId);

    setFirewallRules([]);
    setProtocolFilters([]);
    setIdsSignatures([]);
    setAclEntries([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isVulnerable = score.totalScore === 0;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'firewall', label: 'Firewall Rules', icon: Layers, count: firewallRules.length },
    { id: 'protocol', label: 'Protocol Filters', icon: Filter, count: protocolFilters.length },
    { id: 'ids', label: 'IDS Signatures', icon: Eye, count: idsSignatures.length },
    { id: 'acl', label: 'Access Control', icon: Lock, count: aclEntries.length },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-cyan-400" />
            Security Training Lab
          </h1>
          <p className="text-slate-400 mt-1">
            Build real security controls. Test them against simulated attacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConfiguration()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            <RefreshCw size={16} />
            Reload
          </button>
          <button
            onClick={resetToVulnerable}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-300 transition-colors"
          >
            <RotateCcw size={16} />
            Reset All
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${
        isVulnerable
          ? 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10'
          : score.totalScore >= 70
            ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10'
            : 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isVulnerable ? (
              <ShieldAlert className="w-10 h-10 text-red-400" />
            ) : score.totalScore >= 70 ? (
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isVulnerable
                  ? 'System Completely Vulnerable'
                  : score.totalScore >= 70
                    ? 'Strong Security Posture'
                    : 'Partial Protection'}
              </h2>
              <p className="text-sm text-slate-400">
                {isVulnerable
                  ? 'No security controls configured. Create rules to protect the system.'
                  : `${firewallRules.filter(r => r.enabled).length} firewall rules, ${protocolFilters.filter(f => f.enabled).length} filters, ${idsSignatures.filter(s => s.enabled).length} IDS signatures, ${aclEntries.filter(a => a.enabled).length} ACLs active`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ScoreGauge score={score.networkScore} maxScore={25} label="Network" color="#22c55e" />
            <ScoreGauge score={score.firewallScore} maxScore={25} label="Firewall" color="#f97316" />
            <ScoreGauge score={score.protocolScore} maxScore={25} label="Protocol" color="#3b82f6" />
            <ScoreGauge score={score.authScore} maxScore={15} label="Auth" color="#a855f7" />
            <ScoreGauge score={score.idsScore} maxScore={10} label="IDS" color="#ec4899" />

            <div className="pl-4 border-l border-slate-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{score.totalScore}</div>
                <div className="text-[10px] text-slate-400">/ 100</div>
                <div className="text-xs text-slate-300 mt-1">Security Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === tab.id ? 'bg-cyan-500/20' : 'bg-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AttackTestPanel
            firewallRules={firewallRules}
            protocolFilters={protocolFilters}
            idsSignatures={idsSignatures}
            aclEntries={aclEntries}
          />

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              Implementation Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-400">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={14} className="text-orange-400" />
                  <span className="font-medium text-white">1. Firewall Rules</span>
                </div>
                <p>Define network access policies. Block enterprise zone from directly accessing control systems.</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={14} className="text-blue-400" />
                  <span className="font-medium text-white">2. Protocol Filters</span>
                </div>
                <p>Control Modbus function codes. Restrict write operations to authorized sources only.</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={14} className="text-purple-400" />
                  <span className="font-medium text-white">3. IDS Signatures</span>
                </div>
                <p>Detect attack patterns. Create rules for scanning, safety override attempts, and anomalies.</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={14} className="text-green-400" />
                  <span className="font-medium text-white">4. Access Control</span>
                </div>
                <p>Define who can do what. Require authentication for writes, limit access by role.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'firewall' && (
        <FirewallRuleEditor
          rules={firewallRules}
          onSaveRules={saveFirewallRules}
          onValidate={validateConfig}
        />
      )}

      {activeTab === 'protocol' && (
        <ProtocolFilterBuilder
          filters={protocolFilters}
          onSaveFilters={saveProtocolFilters}
          onValidate={validateConfig}
        />
      )}

      {activeTab === 'ids' && (
        <IDSSignatureBuilder
          signatures={idsSignatures}
          onSaveSignatures={saveIdsSignatures}
          onValidate={validateConfig}
        />
      )}

      {activeTab === 'acl' && (
        <ACLEditor
          entries={aclEntries}
          onSaveEntries={saveAclEntries}
          onValidate={validateConfig}
        />
      )}
    </div>
  );
}
