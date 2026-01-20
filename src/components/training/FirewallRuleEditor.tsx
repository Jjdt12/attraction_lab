import { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
} from 'lucide-react';

export interface FirewallRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  protocol: 'tcp' | 'udp' | 'any';
  action: 'allow' | 'deny' | 'log';
  direction: 'inbound' | 'outbound' | 'both';
  description: string;
  sourceZone: string;
  destinationZone: string;
}

interface FirewallRuleEditorProps {
  rules: FirewallRule[];
  onSaveRules: (rules: FirewallRule[]) => Promise<void>;
  onValidate: () => Promise<{ valid: boolean; errors: string[] }>;
}

const ZONES = [
  { id: 'enterprise', name: 'Enterprise Zone (Level 4-5)', cidr: '10.0.0.0/16' },
  { id: 'dmz', name: 'IDMZ (Level 3.5)', cidr: '10.1.0.0/24' },
  { id: 'operations', name: 'Operations Zone (Level 3)', cidr: '10.2.0.0/24' },
  { id: 'control', name: 'Control Zone (Level 2)', cidr: '10.3.0.0/24' },
  { id: 'field', name: 'Field Zone (Level 1)', cidr: '10.4.0.0/24' },
  { id: 'safety', name: 'Safety Zone (Level 0-1)', cidr: '10.5.0.0/24' },
  { id: 'any', name: 'Any', cidr: '0.0.0.0/0' },
];

const COMMON_PORTS = [
  { port: '502', name: 'Modbus TCP' },
  { port: '44818', name: 'EtherNet/IP' },
  { port: '102', name: 'S7comm' },
  { port: '20000', name: 'DNP3' },
  { port: '4840', name: 'OPC UA' },
  { port: '22', name: 'SSH' },
  { port: '443', name: 'HTTPS' },
  { port: '80', name: 'HTTP' },
];

function createEmptyRule(): FirewallRule {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    priority: 100,
    sourceIp: '',
    sourcePort: 'any',
    destinationIp: '',
    destinationPort: '',
    protocol: 'tcp',
    action: 'deny',
    direction: 'inbound',
    description: '',
    sourceZone: 'any',
    destinationZone: 'control',
  };
}

function validateIpCidr(value: string): boolean {
  if (value === 'any' || value === '') return true;
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  if (!cidrRegex.test(value)) return false;
  const parts = value.split('/')[0].split('.');
  return parts.every(p => parseInt(p) >= 0 && parseInt(p) <= 255);
}

function validatePort(value: string): boolean {
  if (value === 'any' || value === '') return true;
  if (value.includes('-')) {
    const [start, end] = value.split('-').map(Number);
    return start >= 1 && end <= 65535 && start < end;
  }
  if (value.includes(',')) {
    return value.split(',').every(p => {
      const num = parseInt(p.trim());
      return num >= 1 && num <= 65535;
    });
  }
  const num = parseInt(value);
  return num >= 1 && num <= 65535;
}

function RuleRow({
  rule,
  index,
  expanded,
  onToggleExpand,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  validationErrors,
}: {
  rule: FirewallRule;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (updates: Partial<FirewallRule>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  validationErrors: string[];
}) {
  const hasErrors = validationErrors.length > 0;

  return (
    <div className={`border rounded-lg transition-all ${
      hasErrors
        ? 'border-red-500/50 bg-red-500/5'
        : rule.enabled
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-slate-800 bg-slate-900/50 opacity-60'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30"
          >
            <ChevronUp size={12} className="text-slate-400" />
          </button>
          <GripVertical size={14} className="text-slate-600" />
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30"
          >
            <ChevronDown size={12} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-6">{rule.priority}</span>
          <button
            onClick={() => onChange({ enabled: !rule.enabled })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              rule.enabled ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
              rule.enabled ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              rule.action === 'allow'
                ? 'bg-emerald-500/20 text-emerald-300'
                : rule.action === 'deny'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-amber-500/20 text-amber-300'
            }`}>
              {rule.action.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {rule.name || 'Unnamed Rule'}
            </span>
            {hasErrors && (
              <AlertCircle size={14} className="text-red-400 shrink-0" />
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            {rule.sourceIp || 'any'} : {rule.sourcePort || 'any'} → {rule.destinationIp || 'any'} : {rule.destinationPort || 'any'} ({rule.protocol})
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            title="Duplicate rule"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
            title="Delete rule"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 space-y-4">
          {hasErrors && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
              {validationErrors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rule Name *</label>
              <input
                type="text"
                value={rule.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g., Block HMI to Safety PLC"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Priority (lower = first)</label>
              <input
                type="number"
                value={rule.priority}
                onChange={(e) => onChange({ priority: parseInt(e.target.value) || 100 })}
                min={1}
                max={9999}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Source</h4>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Zone</label>
                <select
                  value={rule.sourceZone}
                  onChange={(e) => {
                    const zone = ZONES.find(z => z.id === e.target.value);
                    onChange({
                      sourceZone: e.target.value,
                      sourceIp: zone?.id === 'any' ? '' : zone?.cidr || ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {ZONES.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  IP/CIDR
                  <span className="text-slate-500 ml-1">(e.g., 10.3.0.0/24 or 10.3.0.50)</span>
                </label>
                <input
                  type="text"
                  value={rule.sourceIp}
                  onChange={(e) => onChange({ sourceIp: e.target.value })}
                  placeholder="any"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded text-sm text-white placeholder-slate-500 focus:outline-none ${
                    rule.sourceIp && !validateIpCidr(rule.sourceIp)
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-700 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Port
                  <span className="text-slate-500 ml-1">(e.g., 502, 80-443, any)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rule.sourcePort}
                    onChange={(e) => onChange({ sourcePort: e.target.value })}
                    placeholder="any"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Destination</h4>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Zone</label>
                <select
                  value={rule.destinationZone}
                  onChange={(e) => {
                    const zone = ZONES.find(z => z.id === e.target.value);
                    onChange({
                      destinationZone: e.target.value,
                      destinationIp: zone?.id === 'any' ? '' : zone?.cidr || ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {ZONES.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  IP/CIDR
                </label>
                <input
                  type="text"
                  value={rule.destinationIp}
                  onChange={(e) => onChange({ destinationIp: e.target.value })}
                  placeholder="any"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded text-sm text-white placeholder-slate-500 focus:outline-none ${
                    rule.destinationIp && !validateIpCidr(rule.destinationIp)
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-700 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Port *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rule.destinationPort}
                    onChange={(e) => onChange({ destinationPort: e.target.value })}
                    placeholder="502"
                    className={`flex-1 px-3 py-2 bg-slate-900 border rounded text-sm text-white placeholder-slate-500 focus:outline-none ${
                      rule.destinationPort && !validatePort(rule.destinationPort)
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-700 focus:border-cyan-500'
                    }`}
                  />
                  <select
                    onChange={(e) => onChange({ destinationPort: e.target.value })}
                    className="px-2 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Common...</option>
                    {COMMON_PORTS.map(p => (
                      <option key={p.port} value={p.port}>{p.name} ({p.port})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Protocol</label>
              <select
                value={rule.protocol}
                onChange={(e) => onChange({ protocol: e.target.value as FirewallRule['protocol'] })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Action *</label>
              <select
                value={rule.action}
                onChange={(e) => onChange({ action: e.target.value as FirewallRule['action'] })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="deny">DENY - Block traffic</option>
                <option value="allow">ALLOW - Permit traffic</option>
                <option value="log">LOG - Allow but log</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Direction</label>
              <select
                value={rule.direction}
                onChange={(e) => onChange({ direction: e.target.value as FirewallRule['direction'] })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description / Justification</label>
            <textarea
              value={rule.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Document why this rule exists and what threat it mitigates..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function FirewallRuleEditor({ rules: initialRules, onSaveRules, onValidate }: FirewallRuleEditorProps) {
  const [rules, setRules] = useState<FirewallRule[]>(initialRules);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validateRule = (rule: FirewallRule): string[] => {
    const errors: string[] = [];
    if (!rule.name.trim()) errors.push('Rule name is required');
    if (rule.sourceIp && !validateIpCidr(rule.sourceIp)) errors.push('Invalid source IP/CIDR format');
    if (rule.destinationIp && !validateIpCidr(rule.destinationIp)) errors.push('Invalid destination IP/CIDR format');
    if (!rule.destinationPort && rule.destinationPort !== 'any') errors.push('Destination port is required');
    if (rule.destinationPort && !validatePort(rule.destinationPort)) errors.push('Invalid destination port format');
    if (rule.sourcePort && rule.sourcePort !== 'any' && !validatePort(rule.sourcePort)) errors.push('Invalid source port format');
    return errors;
  };

  const handleAddRule = () => {
    const newRule = createEmptyRule();
    setRules([...rules, newRule]);
    setExpandedRules(new Set([...expandedRules, newRule.id]));
    setHasUnsavedChanges(true);
  };

  const handleUpdateRule = (id: string, updates: Partial<FirewallRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
    setHasUnsavedChanges(true);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleDuplicateRule = (rule: FirewallRule) => {
    const newRule = { ...rule, id: crypto.randomUUID(), name: `${rule.name} (copy)` };
    const index = rules.findIndex(r => r.id === rule.id);
    const newRules = [...rules];
    newRules.splice(index + 1, 0, newRule);
    setRules(newRules);
    setExpandedRules(new Set([...expandedRules, newRule.id]));
    setHasUnsavedChanges(true);
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    setRules(newRules);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveRules(rules);
      setHasUnsavedChanges(false);
      const result = await onValidate();
      setValidationResult(result);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRules(newExpanded);
  };

  const allErrors = rules.flatMap(r => validateRule(r));
  const hasValidationErrors = allErrors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-orange-400" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">Firewall Rules</h3>
            <p className="text-xs text-slate-400">
              Define network access control between zones. Rules evaluated top to bottom.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          <button
            onClick={handleAddRule}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            <Plus size={16} />
            Add Rule
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasValidationErrors}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm text-white font-medium transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save & Validate'}
          </button>
        </div>
      </div>

      {validationResult && (
        <div className={`p-3 rounded-lg border ${
          validationResult.valid
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="text-red-400" />
            )}
            <span className={validationResult.valid ? 'text-emerald-300' : 'text-red-300'}>
              {validationResult.valid
                ? 'Configuration valid! Firewall rules will block specified attacks.'
                : `Configuration has issues: ${validationResult.errors.join(', ')}`
              }
            </span>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Shield size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">No firewall rules configured</p>
          <p className="text-sm text-slate-500 mb-4">
            Add rules to control traffic between network zones
          </p>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              index={index}
              expanded={expandedRules.has(rule.id)}
              onToggleExpand={() => toggleExpand(rule.id)}
              onChange={(updates) => handleUpdateRule(rule.id, updates)}
              onDelete={() => handleDeleteRule(rule.id)}
              onDuplicate={() => handleDuplicateRule(rule)}
              onMoveUp={() => handleMoveRule(index, 'up')}
              onMoveDown={() => handleMoveRule(index, 'down')}
              isFirst={index === 0}
              isLast={index === rules.length - 1}
              validationErrors={validateRule(rule)}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-2">Rule Order Matters</h4>
        <p className="text-xs text-slate-400">
          Rules are evaluated from top to bottom. The first matching rule determines the action.
          Place more specific rules above general rules. For example, if you want to allow
          Modbus from the HMI but block all other traffic to the Control zone, create the
          ALLOW rule for HMI first, then a DENY rule for everything else.
        </p>
      </div>
    </div>
  );
}
