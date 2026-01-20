import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Play,
  RotateCcw,
  Zap,
  Lock,
  Eye,
  Activity,
  Target,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useSecurity, DefenseRule, SecurityScore } from '../../contexts/SecurityContext';

function ScoreGauge({ score, maxScore, label, color }: {
  score: number;
  maxScore: number;
  label: string;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${percentage * 2.2} 220`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
      <span className="text-[10px] text-slate-500">/ {maxScore}</span>
    </div>
  );
}

function RuleToggle({ rule, onToggle }: {
  rule: DefenseRule;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors: Record<string, string> = {
    firewall: 'text-orange-400 bg-orange-500/10',
    protocol_filter: 'text-blue-400 bg-blue-500/10',
    ids_signature: 'text-purple-400 bg-purple-500/10',
    acl: 'text-green-400 bg-green-500/10',
    rate_limit: 'text-yellow-400 bg-yellow-500/10',
  };

  const typeLabels: Record<string, string> = {
    firewall: 'Firewall',
    protocol_filter: 'Protocol',
    ids_signature: 'IDS',
    acl: 'ACL',
    rate_limit: 'Rate Limit',
  };

  return (
    <div className={`border rounded-lg transition-all ${
      rule.enabled
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-slate-700 bg-slate-800/50'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onToggle(rule.id, !rule.enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            rule.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            rule.enabled ? 'left-7' : 'left-1'
          }`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColors[rule.ruleType]}`}>
              {typeLabels[rule.ruleType]}
            </span>
            <span className="text-sm font-medium text-white truncate">{rule.name}</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">{rule.description}</p>

          {rule.blocksChallenges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-slate-500">Blocks:</span>
              {rule.blocksChallenges.map((c) => (
                <span key={c} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                  {c.replace('challenge_', 'Ch. ')}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 p-2 bg-slate-900 rounded text-[10px] font-mono text-slate-400 overflow-x-auto">
            {JSON.stringify(rule.ruleDefinition, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityLayerCard({
  title,
  enabled,
  onToggle,
  icon,
  description,
  rulesCount,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  description: string;
  rulesCount: number;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      enabled
        ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
        : 'border-slate-700 bg-slate-800/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
          {icon}
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            enabled ? 'left-7' : 'left-1'
          }`} />
        </button>
      </div>

      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-2">{description}</p>

      <div className="flex items-center gap-1 text-xs">
        {enabled ? (
          <CheckCircle size={12} className="text-emerald-400" />
        ) : (
          <XCircle size={12} className="text-slate-500" />
        )}
        <span className={enabled ? 'text-emerald-400' : 'text-slate-500'}>
          {rulesCount} rule{rulesCount !== 1 ? 's' : ''} {enabled ? 'active' : 'available'}
        </span>
      </div>
    </div>
  );
}

function AttackLogItem({ log }: { log: {
  timestamp: string;
  attackType: string;
  sourceIp: string;
  targetAddress?: number;
  functionCode?: number;
  blocked: boolean;
  blockedBy?: string;
  defenseLayer?: string;
} }) {
  return (
    <div className={`p-3 rounded-lg border ${
      log.blocked
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-red-500/30 bg-red-500/5'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {log.blocked ? (
            <ShieldCheck size={16} className="text-emerald-400" />
          ) : (
            <ShieldX size={16} className="text-red-400" />
          )}
          <div>
            <span className="text-sm font-medium text-white">{log.attackType}</span>
            {log.targetAddress !== undefined && (
              <span className="text-xs text-slate-400 ml-2">
                @ address {log.targetAddress}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300">
          Source: {log.sourceIp}
        </span>
        {log.functionCode && (
          <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300">
            FC{log.functionCode}
          </span>
        )}
        {log.blocked && log.blockedBy && (
          <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-300">
            Blocked by: {log.blockedBy}
          </span>
        )}
      </div>
    </div>
  );
}

export function SecurityTrainingDashboard() {
  const {
    config,
    rules,
    attackLogs,
    score,
    isLoading,
    toggleRule,
    updateConfigFlag,
    recalculateScore,
    resetToVulnerable,
    loadConfiguration,
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'logs'>('overview');
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');

  const handleToggleLayer = async (
    flag: 'networkSegmentationEnabled' | 'protocolFilteringEnabled' |
          'authenticationEnabled' | 'idsEnabled' | 'firewallEnabled',
    currentValue: boolean
  ) => {
    await updateConfigFlag(flag, !currentValue);
    await recalculateScore();
  };

  const filteredRules = selectedRuleType === 'all'
    ? rules
    : rules.filter(r => r.ruleType === selectedRuleType);

  const ruleTypes = [
    { id: 'all', label: 'All Rules' },
    { id: 'firewall', label: 'Firewall' },
    { id: 'protocol_filter', label: 'Protocol Filter' },
    { id: 'ids_signature', label: 'IDS Signatures' },
    { id: 'acl', label: 'Access Control' },
    { id: 'rate_limit', label: 'Rate Limits' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isVulnerable = score.totalScore === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-cyan-400" />
            Security Training
          </h1>
          <p className="text-slate-400 mt-1">
            Harden the system by enabling security controls. Test your defenses against attacks.
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
            Reset to Vulnerable
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${
        isVulnerable
          ? 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10'
          : 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isVulnerable ? (
              <ShieldAlert className="w-10 h-10 text-red-400" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isVulnerable ? 'System Vulnerable' : 'Security Controls Active'}
              </h2>
              <p className="text-sm text-slate-400">
                {isVulnerable
                  ? 'No security controls are enabled. The system is completely open to attacks.'
                  : `${rules.filter(r => r.enabled).length} defense rules active, protecting against attacks.`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ScoreGauge score={score.networkScore} maxScore={25} label="Network" color="#22c55e" />
            <ScoreGauge score={score.firewallScore} maxScore={25} label="Firewall" color="#f97316" />
            <ScoreGauge score={score.protocolScore} maxScore={25} label="Protocol" color="#3b82f6" />
            <ScoreGauge score={score.authScore} maxScore={15} label="Auth" color="#a855f7" />
            <ScoreGauge score={score.idsScore} maxScore={10} label="IDS" color="#ec4899" />

            <div className="pl-6 border-l border-slate-700">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{score.totalScore}</div>
                <div className="text-xs text-slate-400">/ 100</div>
                <div className="text-sm text-slate-300 mt-1">Security Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'overview', label: 'Security Layers', icon: Shield },
          { id: 'rules', label: 'Defense Rules', icon: Lock },
          { id: 'logs', label: 'Attack Logs', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SecurityLayerCard
            title="Network Segmentation"
            enabled={config?.networkSegmentationEnabled ?? false}
            onToggle={() => handleToggleLayer('networkSegmentationEnabled', config?.networkSegmentationEnabled ?? false)}
            icon={<Layers size={20} />}
            description="Isolate network zones based on Purdue model levels"
            rulesCount={rules.filter(r => r.ruleType === 'firewall').length}
          />
          <SecurityLayerCard
            title="Firewall"
            enabled={config?.firewallEnabled ?? false}
            onToggle={() => handleToggleLayer('firewallEnabled', config?.firewallEnabled ?? false)}
            icon={<Shield size={20} />}
            description="Block unauthorized traffic between zones"
            rulesCount={rules.filter(r => r.ruleType === 'firewall').length}
          />
          <SecurityLayerCard
            title="Protocol Filtering"
            enabled={config?.protocolFilteringEnabled ?? false}
            onToggle={() => handleToggleLayer('protocolFilteringEnabled', config?.protocolFilteringEnabled ?? false)}
            icon={<Lock size={20} />}
            description="Filter Modbus function codes by source"
            rulesCount={rules.filter(r => r.ruleType === 'protocol_filter').length}
          />
          <SecurityLayerCard
            title="Authentication"
            enabled={config?.authenticationEnabled ?? false}
            onToggle={() => handleToggleLayer('authenticationEnabled', config?.authenticationEnabled ?? false)}
            icon={<Eye size={20} />}
            description="Require authentication for write operations"
            rulesCount={rules.filter(r => r.ruleType === 'acl').length}
          />
          <SecurityLayerCard
            title="Intrusion Detection"
            enabled={config?.idsEnabled ?? false}
            onToggle={() => handleToggleLayer('idsEnabled', config?.idsEnabled ?? false)}
            icon={<Target size={20} />}
            description="Detect and alert on suspicious activity"
            rulesCount={rules.filter(r => r.ruleType === 'ids_signature').length}
          />
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {ruleTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedRuleType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedRuleType === type.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {type.label}
                <span className="ml-2 px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                  {type.id === 'all'
                    ? rules.length
                    : rules.filter(r => r.ruleType === type.id).length
                  }
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredRules.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No rules found. Rules are loaded from the database.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <RuleToggle
                  key={rule.id}
                  rule={rule}
                  onToggle={async (id, enabled) => {
                    await toggleRule(id, enabled);
                    await recalculateScore();
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Attack Attempts</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-slate-400">
                  Blocked: {attackLogs.filter(l => l.blocked).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldX size={14} className="text-red-400" />
                <span className="text-slate-400">
                  Allowed: {attackLogs.filter(l => !l.blocked).length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {attackLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No attack attempts recorded yet. Run an attack script to see logs here.
              </div>
            ) : (
              attackLogs.map((log) => (
                <AttackLogItem key={log.id} log={log} />
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" />
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex gap-2">
            <span className="text-cyan-400 font-bold">1.</span>
            <p>Enable security layers above to activate defense categories</p>
          </div>
          <div className="flex gap-2">
            <span className="text-cyan-400 font-bold">2.</span>
            <p>Toggle individual defense rules to configure what gets blocked</p>
          </div>
          <div className="flex gap-2">
            <span className="text-cyan-400 font-bold">3.</span>
            <p>Run CTF attack scripts - they'll be blocked by your active defenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
