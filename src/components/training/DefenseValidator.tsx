import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
  AlertTriangle,
  Zap,
  Target,
  Lock,
  Eye,
  Layers,
} from 'lucide-react';
import { useSecurity, DefenseValidationResult } from '../../contexts/SecurityContext';
import { supabase } from '../../lib/supabase';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  orderIndex: number;
}

interface DefenseRecommendation {
  ruleId: string;
  name: string;
  description: string;
  ruleType: string;
  enabled: boolean;
}

interface ValidationDisplayResult extends DefenseValidationResult {
  challengeTitle?: string;
  challengeDescription?: string;
  challengeDifficulty?: string;
  recommendedDefenses?: DefenseRecommendation[];
}

function DefenseLayerIndicator({
  label,
  checked,
  blocked,
  detected,
  icon,
}: {
  label: string;
  checked: boolean;
  blocked: boolean;
  detected?: boolean;
  icon: React.ReactNode;
}) {
  let status: 'blocked' | 'passed' | 'unchecked' | 'detected' = 'unchecked';
  if (checked) {
    if (blocked) {
      status = 'blocked';
    } else if (detected) {
      status = 'detected';
    } else {
      status = 'passed';
    }
  }

  const colors = {
    blocked: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    detected: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    passed: 'border-red-500/30 bg-red-500/5 text-red-400',
    unchecked: 'border-slate-700 bg-slate-800/50 text-slate-500',
  };

  const statusIcons = {
    blocked: <ShieldCheck size={14} className="text-emerald-400" />,
    detected: <Eye size={14} className="text-yellow-400" />,
    passed: <ShieldX size={14} className="text-red-400" />,
    unchecked: <MinusCircle size={14} className="text-slate-500" />,
  };

  const statusText = {
    blocked: 'BLOCKED',
    detected: 'DETECTED',
    passed: 'BYPASSED',
    unchecked: 'NOT CHECKED',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colors[status]}`}>
      <div className="p-2 rounded-lg bg-slate-800/50">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-70">{statusText[status]}</div>
      </div>
      {statusIcons[status]}
    </div>
  );
}

const ruleTypeLabels: Record<string, string> = {
  firewall: 'Firewall Rule',
  protocol_filter: 'Protocol Filter',
  ids_signature: 'IDS Signature',
  acl: 'Access Control',
  rate_limit: 'Rate Limit',
};

const ruleTypeColors: Record<string, string> = {
  firewall: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  protocol_filter: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  ids_signature: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  acl: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  rate_limit: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
};

function ChallengeCard({
  challenge,
  onValidate,
  validationResult,
  isValidating,
  onEnableRule,
}: {
  challenge: Challenge;
  onValidate: () => void;
  validationResult?: ValidationDisplayResult;
  isValidating: boolean;
  onEnableRule: (ruleId: string) => void;
}) {
  const difficultyColors: Record<string, string> = {
    easy: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    hard: 'text-orange-400 bg-orange-500/10',
    expert: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 bg-slate-800/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                difficultyColors[challenge.difficulty] || difficultyColors.medium
              }`}>
                {challenge.difficulty}
              </span>
              <span className="text-xs text-slate-500">{challenge.points} pts</span>
            </div>
            <h3 className="font-semibold text-white">{challenge.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{challenge.description}</p>
          </div>

          <button
            onClick={onValidate}
            disabled={isValidating}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-sm text-cyan-300 transition-colors disabled:opacity-50"
          >
            {isValidating ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Test Defense
          </button>
        </div>
      </div>

      {validationResult && (
        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            validationResult.blocked
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {validationResult.blocked ? (
              <>
                <ShieldCheck className="text-emerald-400" size={20} />
                <div>
                  <div className="font-semibold text-emerald-300">Attack Blocked</div>
                  <div className="text-sm text-emerald-400/70">
                    Stopped by: {validationResult.blockedBy} ({validationResult.defenseLayer})
                  </div>
                </div>
              </>
            ) : (
              <>
                <ShieldX className="text-red-400" size={20} />
                <div>
                  <div className="font-semibold text-red-300">Attack Would Succeed</div>
                  <div className="text-sm text-red-400/70">
                    No active defense blocked this attack
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-slate-400 mb-2">Defense Layer Analysis:</div>
          <div className="grid grid-cols-5 gap-2">
            <DefenseLayerIndicator
              label="Network"
              checked={validationResult.defenseLayers.network.checked}
              blocked={validationResult.defenseLayers.network.blocked}
              icon={<Layers size={16} />}
            />
            <DefenseLayerIndicator
              label="Firewall"
              checked={validationResult.defenseLayers.firewall.checked}
              blocked={validationResult.defenseLayers.firewall.blocked}
              icon={<Shield size={16} />}
            />
            <DefenseLayerIndicator
              label="Protocol"
              checked={validationResult.defenseLayers.protocolFilter.checked}
              blocked={validationResult.defenseLayers.protocolFilter.blocked}
              icon={<Lock size={16} />}
            />
            <DefenseLayerIndicator
              label="Auth"
              checked={validationResult.defenseLayers.authentication.checked}
              blocked={validationResult.defenseLayers.authentication.blocked}
              icon={<Eye size={16} />}
            />
            <DefenseLayerIndicator
              label="IDS"
              checked={validationResult.defenseLayers.ids.checked}
              blocked={validationResult.defenseLayers.ids.blocked}
              detected={validationResult.defenseLayers.ids.detected}
              icon={<Target size={16} />}
            />
          </div>

          {!validationResult.blocked && validationResult.recommendedDefenses && validationResult.recommendedDefenses.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800/70 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Recommended Defenses</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Enable any of these rules to block this attack:
              </p>
              <div className="space-y-2">
                {validationResult.recommendedDefenses.map((defense) => (
                  <div
                    key={defense.ruleId}
                    className={`flex items-center justify-between p-2 rounded-lg border ${ruleTypeColors[defense.ruleType] || 'bg-slate-700'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium opacity-70">
                          {ruleTypeLabels[defense.ruleType] || defense.ruleType}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{defense.name}</p>
                      <p className="text-xs opacity-60 truncate">{defense.description}</p>
                    </div>
                    {defense.enabled ? (
                      <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                        Enabled
                      </span>
                    ) : (
                      <button
                        onClick={() => onEnableRule(defense.ruleId)}
                        className="ml-2 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs rounded transition-colors"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DefenseValidator() {
  const { validateDefenses, score, config, rules, toggleRule, loadConfiguration } = useSecurity();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationDisplayResult>>({});
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allDefenseRules, setAllDefenseRules] = useState<DefenseRecommendation[]>([]);
  const [ruleBlocksChallenge, setRuleBlocksChallenge] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadChallenges();
    loadDefenseRules();
  }, []);

  useEffect(() => {
    setAllDefenseRules(rules.map(r => ({
      ruleId: r.id,
      name: r.name,
      description: r.description,
      ruleType: r.ruleType,
      enabled: r.enabled,
    })));
  }, [rules]);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('order_index');

      if (error) throw error;

      setChallenges(data?.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        points: c.points,
        orderIndex: c.order_index,
      })) || []);
    } catch (err) {
      console.error('Error loading challenges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefenseRules = async () => {
    try {
      const { data, error } = await supabase
        .from('defense_rules')
        .select('id, name, description, rule_type, enabled, blocks_challenges');

      if (error) throw error;

      const blocksMapping: Record<string, string[]> = {};
      data?.forEach(rule => {
        if (rule.blocks_challenges) {
          rule.blocks_challenges.forEach((challengeKey: string) => {
            if (!blocksMapping[challengeKey]) {
              blocksMapping[challengeKey] = [];
            }
            blocksMapping[challengeKey].push(rule.id);
          });
        }
      });
      setRuleBlocksChallenge(blocksMapping);
    } catch (err) {
      console.error('Error loading defense rules:', err);
    }
  };

  const getRecommendedDefenses = (challengeKey: string): DefenseRecommendation[] => {
    const blockingRuleIds = ruleBlocksChallenge[challengeKey] || [];
    return allDefenseRules.filter(r => blockingRuleIds.includes(r.ruleId));
  };

  const handleValidate = async (challenge: Challenge) => {
    setValidatingId(challenge.id);
    try {
      const challengeKey = `challenge_${String(challenge.orderIndex).padStart(2, '0')}`;
      const result = await validateDefenses(challengeKey);
      const recommendedDefenses = getRecommendedDefenses(challengeKey);

      setValidationResults(prev => ({
        ...prev,
        [challenge.id]: {
          ...result,
          challengeTitle: challenge.title,
          challengeDescription: challenge.description,
          challengeDifficulty: challenge.difficulty,
          recommendedDefenses,
        },
      }));
    } catch (err) {
      console.error('Error validating defense:', err);
    } finally {
      setValidatingId(null);
    }
  };

  const handleEnableRule = async (ruleId: string) => {
    try {
      await toggleRule(ruleId, true);
      setAllDefenseRules(prev => prev.map(r =>
        r.ruleId === ruleId ? { ...r, enabled: true } : r
      ));
      Object.keys(validationResults).forEach(challengeId => {
        const result = validationResults[challengeId];
        if (result.recommendedDefenses) {
          setValidationResults(prev => ({
            ...prev,
            [challengeId]: {
              ...prev[challengeId],
              recommendedDefenses: prev[challengeId].recommendedDefenses?.map(d =>
                d.ruleId === ruleId ? { ...d, enabled: true } : d
              ),
            },
          }));
        }
      });
    } catch (err) {
      console.error('Error enabling rule:', err);
    }
  };

  const handleValidateAll = async () => {
    for (const challenge of challenges) {
      await handleValidate(challenge);
    }
  };

  const blockedCount = Object.values(validationResults).filter(r => r.blocked).length;
  const bypassedCount = Object.values(validationResults).filter(r => !r.blocked).length;
  const testedCount = Object.keys(validationResults).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="text-cyan-400" />
            Defense Validator
          </h1>
          <p className="text-slate-400 mt-1">
            Test your security configuration against CTF attack patterns
          </p>
        </div>

        <button
          onClick={handleValidateAll}
          disabled={validatingId !== null}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50"
        >
          <Zap size={16} />
          Test All Challenges
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="text-3xl font-bold text-white">{score.totalScore}</div>
          <div className="text-sm text-slate-400">Security Score</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="text-3xl font-bold text-cyan-400">{testedCount}</div>
          <div className="text-sm text-slate-400">Challenges Tested</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-3xl font-bold text-emerald-400">{blockedCount}</div>
          <div className="text-sm text-emerald-400/70">Attacks Blocked</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="text-3xl font-bold text-red-400">{bypassedCount}</div>
          <div className="text-sm text-red-400/70">Attacks Bypassed</div>
        </div>
      </div>

      {testedCount > 0 && bypassedCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-semibold text-amber-300">Security Gaps Detected</div>
            <p className="text-sm text-amber-400/70 mt-1">
              {bypassedCount} attack{bypassedCount !== 1 ? 's' : ''} would bypass your current defenses.
              Enable more security rules in the Training Dashboard to improve protection.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">CTF Challenges</h2>

        {challenges.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No challenges found. Make sure the database is populated with CTF challenges.
          </div>
        ) : (
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onValidate={() => handleValidate(challenge)}
                validationResult={validationResults[challenge.id]}
                isValidating={validatingId === challenge.id}
                onEnableRule={handleEnableRule}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3">Active Defense Rules</h3>
        <div className="flex flex-wrap gap-2">
          {rules.filter(r => r.enabled).length === 0 ? (
            <span className="text-sm text-slate-400">No defense rules are currently enabled</span>
          ) : (
            rules.filter(r => r.enabled).map(rule => (
              <span
                key={rule.id}
                className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300"
              >
                {rule.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
