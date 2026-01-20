import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface SecurityConfiguration {
  id: string;
  sessionId?: string;
  name: string;
  isActive: boolean;
  securityScore: number;
  networkSegmentationEnabled: boolean;
  protocolFilteringEnabled: boolean;
  authenticationEnabled: boolean;
  idsEnabled: boolean;
  firewallEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DefenseRule {
  id: string;
  configId: string;
  ruleType: 'firewall' | 'protocol_filter' | 'ids_signature' | 'acl' | 'rate_limit';
  name: string;
  description: string;
  ruleDefinition: Record<string, unknown>;
  enabled: boolean;
  orderPriority: number;
  blocksChallenges: string[];
  createdAt: string;
}

export interface ProtocolPolicy {
  id: string;
  configId: string;
  name: string;
  sourceZone: string;
  functionCodesAllowed: number[];
  addressRangesAllowed: Record<string, unknown>;
  rateLimitPerSecond: number;
  requiresAuth: boolean;
  enabled: boolean;
  orderPriority: number;
  createdAt: string;
}

export interface AttackLog {
  id: string;
  configId?: string;
  challengeId?: string;
  timestamp: string;
  attackType: string;
  sourceIp: string;
  targetAddress?: number;
  functionCode?: number;
  blocked: boolean;
  blockedBy?: string;
  defenseLayer?: string;
  details: Record<string, unknown>;
}

export interface SecurityScore {
  totalScore: number;
  networkScore: number;
  firewallScore: number;
  protocolScore: number;
  authScore: number;
  idsScore: number;
}

export interface DefenseValidationResult {
  challengeId: string;
  challengeName: string;
  blocked: boolean;
  blockedBy?: string;
  defenseLayer?: string;
  defenseLayers: {
    network: { checked: boolean; blocked: boolean };
    firewall: { checked: boolean; blocked: boolean };
    protocolFilter: { checked: boolean; blocked: boolean };
    authentication: { checked: boolean; blocked: boolean };
    ids: { checked: boolean; blocked: boolean; detected: boolean };
  };
}

interface SecurityContextType {
  config: SecurityConfiguration | null;
  rules: DefenseRule[];
  policies: ProtocolPolicy[];
  attackLogs: AttackLog[];
  score: SecurityScore;
  isLoading: boolean;
  error: string | null;

  loadConfiguration: () => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  togglePolicy: (policyId: string, enabled: boolean) => Promise<void>;
  updateConfigFlag: (flag: keyof Pick<SecurityConfiguration,
    'networkSegmentationEnabled' | 'protocolFilteringEnabled' |
    'authenticationEnabled' | 'idsEnabled' | 'firewallEnabled'>,
    value: boolean) => Promise<void>;
  recalculateScore: () => Promise<SecurityScore>;
  logAttack: (attack: Omit<AttackLog, 'id' | 'timestamp' | 'configId'>) => Promise<AttackLog | null>;
  validateDefenses: (challengeId: string) => Promise<DefenseValidationResult>;
  getActiveRulesByType: (type: DefenseRule['ruleType']) => DefenseRule[];
  resetToVulnerable: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const MODBUS_FUNCTION_CODES = {
  READ_COILS: 1,
  READ_DISCRETE_INPUTS: 2,
  READ_HOLDING_REGISTERS: 3,
  READ_INPUT_REGISTERS: 4,
  WRITE_SINGLE_COIL: 5,
  WRITE_SINGLE_REGISTER: 6,
  WRITE_MULTIPLE_COILS: 15,
  WRITE_MULTIPLE_REGISTERS: 16,
};

const WRITE_FUNCTION_CODES = [
  MODBUS_FUNCTION_CODES.WRITE_SINGLE_COIL,
  MODBUS_FUNCTION_CODES.WRITE_SINGLE_REGISTER,
  MODBUS_FUNCTION_CODES.WRITE_MULTIPLE_COILS,
  MODBUS_FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS,
];

function mapDbToConfig(row: Record<string, unknown>): SecurityConfiguration {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | undefined,
    name: row.name as string,
    isActive: row.is_active as boolean,
    securityScore: row.security_score as number,
    networkSegmentationEnabled: row.network_segmentation_enabled as boolean,
    protocolFilteringEnabled: row.protocol_filtering_enabled as boolean,
    authenticationEnabled: row.authentication_enabled as boolean,
    idsEnabled: row.ids_enabled as boolean,
    firewallEnabled: row.firewall_enabled as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapDbToRule(row: Record<string, unknown>): DefenseRule {
  return {
    id: row.id as string,
    configId: row.config_id as string,
    ruleType: row.rule_type as DefenseRule['ruleType'],
    name: row.name as string,
    description: row.description as string || '',
    ruleDefinition: row.rule_definition as Record<string, unknown>,
    enabled: row.enabled as boolean,
    orderPriority: row.order_priority as number,
    blocksChallenges: row.blocks_challenges as string[] || [],
    createdAt: row.created_at as string,
  };
}

function mapDbToPolicy(row: Record<string, unknown>): ProtocolPolicy {
  return {
    id: row.id as string,
    configId: row.config_id as string,
    name: row.name as string,
    sourceZone: row.source_zone as string,
    functionCodesAllowed: row.function_codes_allowed as number[],
    addressRangesAllowed: row.address_ranges_allowed as Record<string, unknown>,
    rateLimitPerSecond: row.rate_limit_per_second as number,
    requiresAuth: row.requires_auth as boolean,
    enabled: row.enabled as boolean,
    orderPriority: row.order_priority as number,
    createdAt: row.created_at as string,
  };
}

function mapDbToAttackLog(row: Record<string, unknown>): AttackLog {
  return {
    id: row.id as string,
    configId: row.config_id as string | undefined,
    challengeId: row.challenge_id as string | undefined,
    timestamp: row.timestamp as string,
    attackType: row.attack_type as string,
    sourceIp: row.source_ip as string,
    targetAddress: row.target_address as number | undefined,
    functionCode: row.function_code as number | undefined,
    blocked: row.blocked as boolean,
    blockedBy: row.blocked_by as string | undefined,
    defenseLayer: row.defense_layer as string | undefined,
    details: row.details as Record<string, unknown>,
  };
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SecurityConfiguration | null>(null);
  const [rules, setRules] = useState<DefenseRule[]>([]);
  const [policies, setPolicies] = useState<ProtocolPolicy[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLog[]>([]);
  const [score, setScore] = useState<SecurityScore>({
    totalScore: 0,
    networkScore: 0,
    firewallScore: 0,
    protocolScore: 0,
    authScore: 0,
    idsScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: configData, error: configError } = await supabase
        .from('security_configurations')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (configError) throw configError;

      if (!configData) {
        const { data: newConfig, error: insertError } = await supabase
          .from('security_configurations')
          .insert({
            name: 'Default Vulnerable',
            is_active: true,
            security_score: 0,
            network_segmentation_enabled: false,
            protocol_filtering_enabled: false,
            authentication_enabled: false,
            ids_enabled: false,
            firewall_enabled: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(mapDbToConfig(newConfig));
        setRules([]);
        setPolicies([]);
      } else {
        setConfig(mapDbToConfig(configData));

        const { data: rulesData, error: rulesError } = await supabase
          .from('defense_rules')
          .select('*')
          .eq('config_id', configData.id)
          .order('order_priority');

        if (rulesError) throw rulesError;
        setRules((rulesData || []).map(mapDbToRule));

        const { data: policiesData, error: policiesError } = await supabase
          .from('protocol_policies')
          .select('*')
          .eq('config_id', configData.id)
          .order('order_priority');

        if (policiesError) throw policiesError;
        setPolicies((policiesData || []).map(mapDbToPolicy));
      }

      const { data: logsData } = await supabase
        .from('attack_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      setAttackLogs((logsData || []).map(mapDbToAttackLog));

    } catch (err) {
      console.error('Error loading security configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('defense_rules')
        .update({ enabled })
        .eq('id', ruleId);

      if (updateError) throw updateError;

      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, enabled } : r
      ));
    } catch (err) {
      console.error('Error toggling rule:', err);
      throw err;
    }
  }, []);

  const togglePolicy = useCallback(async (policyId: string, enabled: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('protocol_policies')
        .update({ enabled })
        .eq('id', policyId);

      if (updateError) throw updateError;

      setPolicies(prev => prev.map(p =>
        p.id === policyId ? { ...p, enabled } : p
      ));
    } catch (err) {
      console.error('Error toggling policy:', err);
      throw err;
    }
  }, []);

  const updateConfigFlag = useCallback(async (
    flag: keyof Pick<SecurityConfiguration,
      'networkSegmentationEnabled' | 'protocolFilteringEnabled' |
      'authenticationEnabled' | 'idsEnabled' | 'firewallEnabled'>,
    value: boolean
  ) => {
    if (!config) return;

    const dbField = flag.replace(/([A-Z])/g, '_$1').toLowerCase();

    try {
      const { error: updateError } = await supabase
        .from('security_configurations')
        .update({ [dbField]: value, updated_at: new Date().toISOString() })
        .eq('id', config.id);

      if (updateError) throw updateError;

      setConfig(prev => prev ? { ...prev, [flag]: value } : prev);
    } catch (err) {
      console.error('Error updating config flag:', err);
      throw err;
    }
  }, [config]);

  const recalculateScore = useCallback(async (): Promise<SecurityScore> => {
    if (!config) {
      return { totalScore: 0, networkScore: 0, firewallScore: 0, protocolScore: 0, authScore: 0, idsScore: 0 };
    }

    const enabledFirewallRules = rules.filter(r => r.ruleType === 'firewall' && r.enabled).length;
    const enabledProtocolRules = rules.filter(r => r.ruleType === 'protocol_filter' && r.enabled).length;
    const enabledIdsRules = rules.filter(r => r.ruleType === 'ids_signature' && r.enabled).length;
    const enabledAclRules = rules.filter(r => r.ruleType === 'acl' && r.enabled).length;
    const enabledRateLimits = rules.filter(r => r.ruleType === 'rate_limit' && r.enabled).length;

    const networkScore = Math.min(25,
      (config.networkSegmentationEnabled ? 15 : 0) +
      enabledFirewallRules * 3
    );

    const firewallScore = Math.min(25,
      (config.firewallEnabled ? 5 : 0) +
      enabledFirewallRules * 7
    );

    const protocolScore = Math.min(25,
      (config.protocolFilteringEnabled ? 5 : 0) +
      enabledProtocolRules * 5 +
      enabledRateLimits * 3
    );

    const authScore = Math.min(15,
      (config.authenticationEnabled ? 8 : 0) +
      enabledAclRules * 2
    );

    const idsScore = Math.min(10,
      (config.idsEnabled ? 2 : 0) +
      enabledIdsRules * 2
    );

    const totalScore = networkScore + firewallScore + protocolScore + authScore + idsScore;

    const newScore = { totalScore, networkScore, firewallScore, protocolScore, authScore, idsScore };
    setScore(newScore);

    await supabase
      .from('security_configurations')
      .update({ security_score: totalScore })
      .eq('id', config.id);

    await supabase
      .from('security_scores')
      .insert({
        config_id: config.id,
        total_score: totalScore,
        network_score: networkScore,
        firewall_score: firewallScore,
        protocol_score: protocolScore,
        auth_score: authScore,
        ids_score: idsScore,
      });

    return newScore;
  }, [config, rules]);

  const logAttack = useCallback(async (
    attack: Omit<AttackLog, 'id' | 'timestamp' | 'configId'>
  ): Promise<AttackLog | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('attack_logs')
        .insert({
          config_id: config?.id,
          attack_type: attack.attackType,
          source_ip: attack.sourceIp,
          target_address: attack.targetAddress,
          function_code: attack.functionCode,
          blocked: attack.blocked,
          blocked_by: attack.blockedBy,
          defense_layer: attack.defenseLayer,
          details: attack.details,
          challenge_id: attack.challengeId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newLog = mapDbToAttackLog(data);
      setAttackLogs(prev => [newLog, ...prev].slice(0, 100));
      return newLog;
    } catch (err) {
      console.error('Error logging attack:', err);
      return null;
    }
  }, [config?.id]);

  const validateDefenses = useCallback(async (challengeId: string): Promise<DefenseValidationResult> => {
    const result: DefenseValidationResult = {
      challengeId,
      challengeName: challengeId,
      blocked: false,
      defenseLayers: {
        network: { checked: false, blocked: false },
        firewall: { checked: false, blocked: false },
        protocolFilter: { checked: false, blocked: false },
        authentication: { checked: false, blocked: false },
        ids: { checked: false, blocked: false, detected: false },
      },
    };

    if (config?.networkSegmentationEnabled) {
      result.defenseLayers.network.checked = true;
      const networkRules = rules.filter(r =>
        r.ruleType === 'firewall' &&
        r.enabled &&
        r.blocksChallenges.includes(challengeId)
      );
      if (networkRules.length > 0) {
        result.defenseLayers.network.blocked = true;
        result.blocked = true;
        result.blockedBy = networkRules[0].name;
        result.defenseLayer = 'network';
      }
    }

    if (!result.blocked && config?.firewallEnabled) {
      result.defenseLayers.firewall.checked = true;
      const firewallRules = rules.filter(r =>
        r.ruleType === 'firewall' &&
        r.enabled &&
        r.blocksChallenges.includes(challengeId)
      );
      if (firewallRules.length > 0) {
        result.defenseLayers.firewall.blocked = true;
        result.blocked = true;
        result.blockedBy = firewallRules[0].name;
        result.defenseLayer = 'firewall';
      }
    }

    if (!result.blocked && config?.protocolFilteringEnabled) {
      result.defenseLayers.protocolFilter.checked = true;
      const protocolRules = rules.filter(r =>
        r.ruleType === 'protocol_filter' &&
        r.enabled &&
        r.blocksChallenges.includes(challengeId)
      );
      if (protocolRules.length > 0) {
        result.defenseLayers.protocolFilter.blocked = true;
        result.blocked = true;
        result.blockedBy = protocolRules[0].name;
        result.defenseLayer = 'protocol_filter';
      }
    }

    if (!result.blocked && config?.authenticationEnabled) {
      result.defenseLayers.authentication.checked = true;
      const aclRules = rules.filter(r =>
        r.ruleType === 'acl' &&
        r.enabled &&
        r.blocksChallenges.includes(challengeId)
      );
      if (aclRules.length > 0) {
        result.defenseLayers.authentication.blocked = true;
        result.blocked = true;
        result.blockedBy = aclRules[0].name;
        result.defenseLayer = 'authentication';
      }
    }

    if (config?.idsEnabled) {
      result.defenseLayers.ids.checked = true;
      const idsRules = rules.filter(r =>
        r.ruleType === 'ids_signature' &&
        r.enabled &&
        r.blocksChallenges.includes(challengeId)
      );
      if (idsRules.length > 0) {
        result.defenseLayers.ids.detected = true;
        const blockingIdsRule = idsRules.find(r =>
          r.ruleDefinition.action === 'alert_and_block'
        );
        if (blockingIdsRule && !result.blocked) {
          result.defenseLayers.ids.blocked = true;
          result.blocked = true;
          result.blockedBy = blockingIdsRule.name;
          result.defenseLayer = 'ids';
        }
      }
    }

    return result;
  }, [config, rules]);

  const getActiveRulesByType = useCallback((type: DefenseRule['ruleType']): DefenseRule[] => {
    return rules.filter(r => r.ruleType === type && r.enabled);
  }, [rules]);

  const resetToVulnerable = useCallback(async () => {
    if (!config) return;

    try {
      await supabase
        .from('security_configurations')
        .update({
          network_segmentation_enabled: false,
          protocol_filtering_enabled: false,
          authentication_enabled: false,
          ids_enabled: false,
          firewall_enabled: false,
          security_score: 0,
        })
        .eq('id', config.id);

      await supabase
        .from('defense_rules')
        .update({ enabled: false })
        .eq('config_id', config.id);

      await supabase
        .from('protocol_policies')
        .update({ enabled: false })
        .eq('config_id', config.id);

      await loadConfiguration();
    } catch (err) {
      console.error('Error resetting to vulnerable:', err);
      throw err;
    }
  }, [config, loadConfiguration]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    if (config && !isLoading) {
      recalculateScore();
    }
  }, [config?.id, rules, isLoading]);

  return (
    <SecurityContext.Provider
      value={{
        config,
        rules,
        policies,
        attackLogs,
        score,
        isLoading,
        error,
        loadConfiguration,
        toggleRule,
        togglePolicy,
        updateConfigFlag,
        recalculateScore,
        logAttack,
        validateDefenses,
        getActiveRulesByType,
        resetToVulnerable,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}

export { MODBUS_FUNCTION_CODES, WRITE_FUNCTION_CODES };
