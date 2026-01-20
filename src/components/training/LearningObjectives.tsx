import { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle,
  Circle,
  ChevronRight,
  Trophy,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Shield,
  Layers,
  Filter,
  Eye,
  Lock,
  Zap,
  Award,
} from 'lucide-react';
import type { FirewallRule } from './FirewallRuleEditor';
import type { ProtocolFilter } from './ProtocolFilterBuilder';
import type { IDSSignature } from './IDSSignatureBuilder';
import type { AccessControlEntry } from './ACLEditor';

interface Objective {
  id: string;
  category: 'firewall' | 'protocol' | 'ids' | 'acl';
  title: string;
  description: string;
  hint: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  validator: (
    firewallRules: FirewallRule[],
    protocolFilters: ProtocolFilter[],
    idsSignatures: IDSSignature[],
    aclEntries: AccessControlEntry[]
  ) => { completed: boolean; feedback: string };
}

const LEARNING_OBJECTIVES: Objective[] = [
  {
    id: 'fw-1',
    category: 'firewall',
    title: 'Block Enterprise Zone Access',
    description: 'Create a firewall rule that blocks all direct traffic from the Enterprise Zone (10.0.0.0/16) to the Control Zone (10.3.0.0/24).',
    hint: 'Use the source zone selector to choose Enterprise, destination zone as Control, and set action to DENY.',
    difficulty: 'beginner',
    points: 10,
    validator: (fw) => {
      const rule = fw.find(r =>
        r.enabled &&
        r.action === 'deny' &&
        (r.sourceZone === 'enterprise' || (r.sourceIp && r.sourceIp.includes('10.0.'))) &&
        (r.destinationZone === 'control' || (r.destinationIp && r.destinationIp.includes('10.3.')))
      );
      return {
        completed: !!rule,
        feedback: rule
          ? 'Correct! Enterprise to Control traffic is now blocked.'
          : 'Need a DENY rule from Enterprise (10.0.0.0/16) to Control zone.',
      };
    },
  },
  {
    id: 'fw-2',
    category: 'firewall',
    title: 'Allow HMI to PLC Communication',
    description: 'Create an ALLOW rule for HMI stations (10.3.0.10-11) to communicate with the Main PLC on port 502 (Modbus TCP).',
    hint: 'Be specific with source IPs and use port 502 for Modbus. This rule should have higher priority (lower number) than block rules.',
    difficulty: 'beginner',
    points: 10,
    validator: (fw) => {
      const rule = fw.find(r =>
        r.enabled &&
        r.action === 'allow' &&
        r.destinationPort === '502'
      );
      return {
        completed: !!rule,
        feedback: rule
          ? 'Good! HMI can now communicate with the PLC on Modbus port.'
          : 'Need an ALLOW rule for port 502 (Modbus) communication.',
      };
    },
  },
  {
    id: 'fw-3',
    category: 'firewall',
    title: 'Protect Safety PLC',
    description: 'Add an extra layer of protection by blocking ALL external access to the Safety PLC (port 503) from any zone except Field.',
    hint: 'Create a high-priority DENY rule targeting port 503 with source zone as any except Field.',
    difficulty: 'intermediate',
    points: 15,
    validator: (fw) => {
      const rule = fw.find(r =>
        r.enabled &&
        r.action === 'deny' &&
        r.destinationPort === '503'
      );
      return {
        completed: !!rule,
        feedback: rule
          ? 'Excellent! Safety PLC is now protected from network access.'
          : 'Need a DENY rule blocking external access to port 503 (Safety PLC).',
      };
    },
  },
  {
    id: 'proto-1',
    category: 'protocol',
    title: 'Read-Only HMI Access',
    description: 'Create a protocol filter that allows HMI stations to only use READ function codes (FC 1, 2, 3, 4). Block all write operations.',
    hint: 'In allowlist mode, select only FC 1-4. This prevents HMIs from accidentally or maliciously writing to PLCs.',
    difficulty: 'beginner',
    points: 10,
    validator: (_, pf) => {
      const filter = pf.find(f =>
        f.enabled &&
        f.allowedFunctionCodes.length > 0 &&
        f.allowedFunctionCodes.every(fc => [1, 2, 3, 4].includes(fc)) &&
        !f.allowedFunctionCodes.some(fc => [5, 6, 15, 16].includes(fc))
      );
      return {
        completed: !!filter,
        feedback: filter
          ? 'Perfect! HMI is now restricted to read-only operations.'
          : 'Create a filter allowing only FC 1, 2, 3, 4 (read operations).',
      };
    },
  },
  {
    id: 'proto-2',
    category: 'protocol',
    title: 'Block Write to Safety Addresses',
    description: 'Create a protocol filter that blocks write operations (FC 5, 6, 15, 16) to safety-critical addresses (coils 0-100).',
    hint: 'Add an address range restriction for coils 0-100 with access set to "none" or "read only".',
    difficulty: 'intermediate',
    points: 15,
    validator: (_, pf) => {
      const filter = pf.find(f =>
        f.enabled &&
        (f.blockedFunctionCodes.some(fc => [5, 6, 15, 16].includes(fc)) ||
         (f.allowedFunctionCodes.length > 0 && !f.allowedFunctionCodes.some(fc => [5, 6, 15, 16].includes(fc)))) &&
        f.addressRanges.length > 0
      );
      return {
        completed: !!filter,
        feedback: filter
          ? 'Great! Safety addresses are now protected from write operations.'
          : 'Need a filter blocking writes (FC 5, 6, 15, 16) with address restrictions.',
      };
    },
  },
  {
    id: 'proto-3',
    category: 'protocol',
    title: 'Enable Rate Limiting',
    description: 'Configure rate limiting to prevent DoS attacks: max 100 requests/sec and max 10 writes/sec.',
    hint: 'Enable rate limiting in a protocol filter and set appropriate thresholds.',
    difficulty: 'intermediate',
    points: 15,
    validator: (_, pf) => {
      const filter = pf.find(f =>
        f.enabled &&
        f.rateLimit &&
        f.rateLimit.maxRequestsPerSecond <= 100 &&
        f.rateLimit.maxWritesPerSecond <= 10
      );
      return {
        completed: !!filter,
        feedback: filter
          ? 'Excellent! Rate limiting will help prevent DoS attacks.'
          : 'Enable rate limiting with max 100 req/s and max 10 writes/s.',
      };
    },
  },
  {
    id: 'ids-1',
    category: 'ids',
    title: 'Detect Register Scanning',
    description: 'Create a threshold-based IDS signature to detect rapid register scanning (>50 requests per second).',
    hint: 'Use threshold detection type with metric "requests_per_second" and value 50.',
    difficulty: 'beginner',
    points: 10,
    validator: (_, __, ids) => {
      const sig = ids.find(s =>
        s.enabled &&
        s.detectionType === 'threshold' &&
        s.threshold &&
        s.threshold.metric === 'requests_per_second' &&
        s.threshold.value <= 50
      );
      return {
        completed: !!sig,
        feedback: sig
          ? 'Good! Rapid scanning attacks will now be detected.'
          : 'Create a threshold signature for >50 requests/second.',
      };
    },
  },
  {
    id: 'ids-2',
    category: 'ids',
    title: 'Detect Safety Override Attempts',
    description: 'Create a pattern-based signature to detect writes to the safety override coil (address 100). Use hex pattern matching.',
    hint: 'The Modbus write command for coil 100 contains bytes "00 64" (100 in hex). Match FC 05 writes to this address.',
    difficulty: 'advanced',
    points: 20,
    validator: (_, __, ids) => {
      const sig = ids.find(s =>
        s.enabled &&
        s.detectionType === 'pattern' &&
        s.pattern &&
        (s.pattern.pattern.toLowerCase().includes('05') ||
         s.pattern.pattern.toLowerCase().includes('64') ||
         s.pattern.pattern.toLowerCase().includes('100'))
      );
      return {
        completed: !!sig,
        feedback: sig
          ? 'Excellent! Safety override attacks will now be detected.'
          : 'Create a pattern signature detecting writes to coil 100 (0x64).',
      };
    },
  },
  {
    id: 'ids-3',
    category: 'ids',
    title: 'Detect Multi-Stage Attack',
    description: 'Create a sequence-based signature to detect read-then-write patterns on E-stop coils (addresses 0-3). This pattern indicates reconnaissance followed by attack.',
    hint: 'Add two events: first a read (FC 1 or 3) to addresses 0-3, then a write (FC 5) to the same range, within 10 seconds.',
    difficulty: 'advanced',
    points: 25,
    validator: (_, __, ids) => {
      const sig = ids.find(s =>
        s.enabled &&
        s.detectionType === 'sequence' &&
        s.sequence &&
        s.sequence.events.length >= 2
      );
      return {
        completed: !!sig,
        feedback: sig
          ? 'Perfect! Multi-stage attacks on E-stops will be detected.'
          : 'Create a sequence signature with at least 2 events for read-then-write detection.',
      };
    },
  },
  {
    id: 'acl-1',
    category: 'acl',
    title: 'Define Operator Role',
    description: 'Create an ACL entry that allows the "Operator" role READ access to all resources with basic authentication.',
    hint: 'Set subject type to Role, select Operator, allow READ operation, require basic auth.',
    difficulty: 'beginner',
    points: 10,
    validator: (_, __, ___, acl) => {
      const entry = acl.find(a =>
        a.enabled &&
        a.permission === 'allow' &&
        a.subjectType === 'role' &&
        a.subjectValue === 'operator' &&
        a.operations.includes('read') &&
        a.conditions.authLevelRequired !== 'none'
      );
      return {
        completed: !!entry,
        feedback: entry
          ? 'Good! Operators now have authenticated read access.'
          : 'Create an ALLOW ACL for Operator role with READ and basic auth.',
      };
    },
  },
  {
    id: 'acl-2',
    category: 'acl',
    title: 'Block Unauthenticated Writes',
    description: 'Create a DENY ACL that blocks write operations for any source without authentication.',
    hint: 'Set permission to DENY, select WRITE operation, and ensure auth level is "none" to match unauthenticated requests.',
    difficulty: 'intermediate',
    points: 15,
    validator: (_, __, ___, acl) => {
      const entry = acl.find(a =>
        a.enabled &&
        ((a.permission === 'deny' && a.operations.includes('write')) ||
         (a.permission === 'allow' && a.operations.includes('write') && a.conditions.authLevelRequired !== 'none'))
      );
      return {
        completed: !!entry,
        feedback: entry
          ? 'Excellent! Unauthenticated write attempts will be blocked.'
          : 'Create a DENY ACL for WRITE operations without authentication.',
      };
    },
  },
  {
    id: 'acl-3',
    category: 'acl',
    title: 'Configure MFA for Engineers',
    description: 'Create an ACL that requires MFA for Control Engineers to have WRITE access, restricted to business hours (6AM-10PM Mon-Fri).',
    hint: 'Set subject to Engineer role, allow WRITE, require MFA auth level, and enable time restrictions.',
    difficulty: 'advanced',
    points: 20,
    validator: (_, __, ___, acl) => {
      const entry = acl.find(a =>
        a.enabled &&
        a.permission === 'allow' &&
        a.subjectValue === 'engineer' &&
        a.operations.includes('write') &&
        a.conditions.authLevelRequired === 'mfa' &&
        a.conditions.timeRestriction !== null
      );
      return {
        completed: !!entry,
        feedback: entry
          ? 'Perfect! Engineers have secure, time-restricted write access.'
          : 'Create an ACL for Engineers with MFA and time restrictions.',
      };
    },
  },
];

interface LearningObjectivesProps {
  firewallRules: FirewallRule[];
  protocolFilters: ProtocolFilter[];
  idsSignatures: IDSSignature[];
  aclEntries: AccessControlEntry[];
  onNavigateToSection: (section: string) => void;
}

export function LearningObjectives({
  firewallRules,
  protocolFilters,
  idsSignatures,
  aclEntries,
  onNavigateToSection,
}: LearningObjectivesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('firewall');
  const [showHints, setShowHints] = useState<Set<string>>(new Set());

  const evaluateObjective = (obj: Objective) => {
    return obj.validator(firewallRules, protocolFilters, idsSignatures, aclEntries);
  };

  const completedCount = LEARNING_OBJECTIVES.filter(obj => evaluateObjective(obj).completed).length;
  const totalPoints = LEARNING_OBJECTIVES
    .filter(obj => evaluateObjective(obj).completed)
    .reduce((sum, obj) => sum + obj.points, 0);
  const maxPoints = LEARNING_OBJECTIVES.reduce((sum, obj) => sum + obj.points, 0);

  const categories = [
    { id: 'firewall', name: 'Firewall Rules', icon: Layers, color: 'orange' },
    { id: 'protocol', name: 'Protocol Filters', icon: Filter, color: 'blue' },
    { id: 'ids', name: 'IDS Signatures', icon: Eye, color: 'purple' },
    { id: 'acl', name: 'Access Control', icon: Lock, color: 'green' },
  ] as const;

  const toggleHint = (objId: string) => {
    const newHints = new Set(showHints);
    if (newHints.has(objId)) {
      newHints.delete(objId);
    } else {
      newHints.add(objId);
    }
    setShowHints(newHints);
  };

  const difficultyColors = {
    beginner: 'bg-emerald-500/20 text-emerald-300',
    intermediate: 'bg-amber-500/20 text-amber-300',
    advanced: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-400" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-white">Learning Objectives</h3>
              <p className="text-sm text-slate-400">
                Complete these challenges to master ICS security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{completedCount}/{LEARNING_OBJECTIVES.length}</div>
              <div className="text-[10px] text-slate-400">Objectives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{totalPoints}</div>
              <div className="text-[10px] text-slate-400">/ {maxPoints} points</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {categories.map((cat) => {
            const catObjectives = LEARNING_OBJECTIVES.filter(o => o.category === cat.id);
            const catCompleted = catObjectives.filter(o => evaluateObjective(o).completed).length;
            return (
              <button
                key={cat.id}
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                className={`p-3 rounded-lg border transition-all ${
                  expandedCategory === cat.id
                    ? `border-${cat.color}-500/50 bg-${cat.color}-500/10`
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon size={16} className={`text-${cat.color}-400`} />
                  <span className="text-sm font-medium text-white">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${cat.color}-500 transition-all`}
                      style={{ width: `${(catCompleted / catObjectives.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{catCompleted}/{catObjectives.length}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {expandedCategory && (
        <div className="space-y-3">
          {LEARNING_OBJECTIVES.filter(obj => obj.category === expandedCategory).map((obj) => {
            const result = evaluateObjective(obj);
            const isCompleted = result.completed;

            return (
              <div
                key={obj.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCompleted ? (
                    <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  ) : (
                    <Circle className="text-slate-600 shrink-0 mt-0.5" size={20} />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{obj.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${difficultyColors[obj.difficulty]}`}>
                        {obj.difficulty}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">
                        {obj.points} pts
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-3">{obj.description}</p>

                    <div className={`p-2 rounded-lg text-xs ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {result.feedback}
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => toggleHint(obj.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                        >
                          <Lightbulb size={12} />
                          {showHints.has(obj.id) ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        <button
                          onClick={() => onNavigateToSection(obj.category)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                        >
                          Go to {obj.category}
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}

                    {showHints.has(obj.id) && !isCompleted && (
                      <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-start gap-2 text-xs text-amber-300">
                          <Lightbulb size={14} className="shrink-0 mt-0.5" />
                          <p>{obj.hint}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completedCount === LEARNING_OBJECTIVES.length && (
        <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/30 text-center">
          <Award className="mx-auto text-amber-400 mb-3" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">All Objectives Complete!</h3>
          <p className="text-slate-300">
            Congratulations! You've successfully implemented a comprehensive ICS security architecture.
            Your system is now protected by multiple layers of defense.
          </p>
        </div>
      )}
    </div>
  );
}
