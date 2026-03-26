import { useState } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Server,
  Clock,
  Key,
} from 'lucide-react';

export interface AccessControlEntry {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  subjectType: 'user' | 'role' | 'device' | 'zone' | 'ip_range';
  subjectValue: string;
  resourceType: 'plc' | 'register_range' | 'function_code' | 'all';
  resourceValue: string;
  permission: 'allow' | 'deny';
  operations: ('read' | 'write' | 'execute')[];
  conditions: ACLConditions;
  description: string;
}

interface ACLConditions {
  timeRestriction: TimeRestriction | null;
  authLevelRequired: 'none' | 'basic' | 'mfa' | 'certificate';
  requireEncryption: boolean;
  maxSessionDuration: number | null;
  sourceVerification: 'none' | 'ip_whitelist' | 'certificate_pinning';
}

interface TimeRestriction {
  allowedDays: number[];
  startHour: number;
  endHour: number;
  timezone: string;
}

interface ACLEditorProps {
  entries: AccessControlEntry[];
  onSaveEntries: (entries: AccessControlEntry[]) => Promise<void>;
  onValidate: () => Promise<{ valid: boolean; errors: string[] }>;
}

const SUBJECTS = {
  roles: [
    { id: 'operator', name: 'Operator', description: 'Day-to-day attraction operations' },
    { id: 'maintenance', name: 'Maintenance Tech', description: 'Scheduled maintenance tasks' },
    { id: 'engineer', name: 'Control Engineer', description: 'PLC programming and tuning' },
    { id: 'supervisor', name: 'Supervisor', description: 'Override and emergency access' },
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
  ],
  devices: [
    { id: 'hmi_main', name: 'Main HMI Panel', ip: '10.3.0.10' },
    { id: 'hmi_backup', name: 'Backup HMI', ip: '10.3.0.11' },
    { id: 'eng_ws_1', name: 'Engineering Workstation 1', ip: '10.2.0.20' },
    { id: 'eng_ws_2', name: 'Engineering Workstation 2', ip: '10.2.0.21' },
    { id: 'show_control', name: 'Show Control Server', ip: '10.2.0.5' },
  ],
  zones: [
    { id: 'enterprise', name: 'Enterprise Zone' },
    { id: 'dmz', name: 'IDMZ' },
    { id: 'operations', name: 'Operations Zone' },
    { id: 'control', name: 'Control Zone' },
    { id: 'field', name: 'Field Zone' },
  ],
};

const RESOURCES = {
  plcs: [
    { id: 'main_plc', name: 'Main PLC', port: 502, description: 'Attraction control logic' },
    { id: 'safety_plc', name: 'Safety PLC', port: 503, description: 'E-stops and interlocks' },
    { id: 'effects_plc', name: 'Effects PLC', port: 504, description: 'Lighting and audio' },
  ],
  registerRanges: [
    { id: 'system_status', name: 'System Status', range: '0-9', type: 'holding' },
    { id: 'motor_control', name: 'Motor Control', range: '10-49', type: 'holding' },
    { id: 'safety_interlocks', name: 'Safety Interlocks', range: '0-29', type: 'coils' },
    { id: 'e_stop', name: 'E-Stop Coils', range: '0-3', type: 'coils' },
    { id: 'override_registers', name: 'Override Registers', range: '100-109', type: 'holding' },
    { id: 'setpoints', name: 'Setpoints', range: '200-299', type: 'holding' },
  ],
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createEmptyEntry(): AccessControlEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    priority: 100,
    subjectType: 'role',
    subjectValue: '',
    resourceType: 'plc',
    resourceValue: '',
    permission: 'deny',
    operations: [],
    conditions: {
      timeRestriction: null,
      authLevelRequired: 'basic',
      requireEncryption: false,
      maxSessionDuration: null,
      sourceVerification: 'none',
    },
    description: '',
  };
}

function ConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: ACLConditions;
  onChange: (conditions: ACLConditions) => void;
}) {
  const [showTimeRestriction, setShowTimeRestriction] = useState(conditions.timeRestriction !== null);

  const toggleTimeRestriction = () => {
    if (showTimeRestriction) {
      onChange({ ...conditions, timeRestriction: null });
    } else {
      onChange({
        ...conditions,
        timeRestriction: {
          allowedDays: [1, 2, 3, 4, 5],
          startHour: 6,
          endHour: 22,
          timezone: 'America/New_York',
        },
      });
    }
    setShowTimeRestriction(!showTimeRestriction);
  };

  return (
    <div className="space-y-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
        <Key size={14} />
        Access Conditions
      </h5>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Authentication Required</label>
          <select
            value={conditions.authLevelRequired}
            onChange={(e) => onChange({ ...conditions, authLevelRequired: e.target.value as ACLConditions['authLevelRequired'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="none">None (Anonymous)</option>
            <option value="basic">Basic (Username/Password)</option>
            <option value="mfa">MFA (Multi-Factor)</option>
            <option value="certificate">Certificate-Based</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Source Verification</label>
          <select
            value={conditions.sourceVerification}
            onChange={(e) => onChange({ ...conditions, sourceVerification: e.target.value as ACLConditions['sourceVerification'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="none">None</option>
            <option value="ip_whitelist">IP Whitelist</option>
            <option value="certificate_pinning">Certificate Pinning</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requireEncryption"
            checked={conditions.requireEncryption}
            onChange={(e) => onChange({ ...conditions, requireEncryption: e.target.checked })}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500"
          />
          <label htmlFor="requireEncryption" className="text-xs text-slate-400">
            Require TLS/Encryption
          </label>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Max Session (minutes)</label>
          <input
            type="number"
            value={conditions.maxSessionDuration || ''}
            onChange={(e) => onChange({ ...conditions, maxSessionDuration: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Unlimited"
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={1}
          />
        </div>
      </div>

      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={14} />
            Time-Based Restrictions
          </label>
          <button
            onClick={toggleTimeRestriction}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showTimeRestriction ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
              showTimeRestriction ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {showTimeRestriction && conditions.timeRestriction && (
          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-2">Allowed Days</label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => {
                      const current = conditions.timeRestriction!.allowedDays;
                      const newDays = current.includes(index)
                        ? current.filter(d => d !== index)
                        : [...current, index];
                      onChange({
                        ...conditions,
                        timeRestriction: { ...conditions.timeRestriction!, allowedDays: newDays },
                      });
                    }}
                    className={`w-10 h-8 rounded text-[10px] font-medium transition-colors ${
                      conditions.timeRestriction.allowedDays.includes(index)
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Start Hour (24h)</label>
                <input
                  type="number"
                  value={conditions.timeRestriction.startHour}
                  onChange={(e) => onChange({
                    ...conditions,
                    timeRestriction: { ...conditions.timeRestriction!, startHour: parseInt(e.target.value) || 0 },
                  })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  min={0}
                  max={23}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">End Hour (24h)</label>
                <input
                  type="number"
                  value={conditions.timeRestriction.endHour}
                  onChange={(e) => onChange({
                    ...conditions,
                    timeRestriction: { ...conditions.timeRestriction!, endHour: parseInt(e.target.value) || 23 },
                  })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  min={0}
                  max={23}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ACLEntryCard({
  entry,
  expanded,
  onToggleExpand,
  onChange,
  onDelete,
  validationErrors,
}: {
  entry: AccessControlEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (updates: Partial<AccessControlEntry>) => void;
  onDelete: () => void;
  validationErrors: string[];
}) {
  const hasErrors = validationErrors.length > 0;

  const subjectIcons = {
    user: User,
    role: Users,
    device: Server,
    zone: Server,
    ip_range: Server,
  };
  const SubjectIcon = subjectIcons[entry.subjectType];

  return (
    <div className={`border rounded-lg transition-all ${
      hasErrors
        ? 'border-red-500/50 bg-red-500/5'
        : entry.enabled
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-slate-800 bg-slate-900/50 opacity-60'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onChange({ enabled: !entry.enabled })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            entry.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            entry.enabled ? 'left-5' : 'left-0.5'
          }`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              entry.permission === 'allow'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              {entry.permission.toUpperCase()}
            </span>
            <SubjectIcon size={12} className="text-slate-400" />
            <span className="text-sm font-medium text-white truncate">
              {entry.name || 'Unnamed ACL'}
            </span>
            {hasErrors && <AlertCircle size={14} className="text-red-400 shrink-0" />}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            {entry.subjectType}: {entry.subjectValue || 'any'} → {entry.resourceType}: {entry.resourceValue || 'all'} [{entry.operations.join(', ') || 'none'}]
          </div>
        </div>

        <span className="text-xs text-slate-500">P{entry.priority}</span>

        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
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

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 space-y-4">
          {hasErrors && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
              {validationErrors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">ACL Name *</label>
              <input
                type="text"
                value={entry.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g., Operator Read-Only"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Priority</label>
              <input
                type="number"
                value={entry.priority}
                onChange={(e) => onChange({ priority: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                min={1}
                max={9999}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Permission *</label>
              <select
                value={entry.permission}
                onChange={(e) => onChange({ permission: e.target.value as AccessControlEntry['permission'] })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="allow">ALLOW</option>
                <option value="deny">DENY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <User size={14} />
                Subject (Who)
              </h5>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Subject Type</label>
                <select
                  value={entry.subjectType}
                  onChange={(e) => onChange({ subjectType: e.target.value as AccessControlEntry['subjectType'], subjectValue: '' })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="role">Role</option>
                  <option value="user">User</option>
                  <option value="device">Device</option>
                  <option value="zone">Zone</option>
                  <option value="ip_range">IP Range</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Subject Value *</label>
                {entry.subjectType === 'role' ? (
                  <select
                    value={entry.subjectValue}
                    onChange={(e) => onChange({ subjectValue: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">Select role...</option>
                    {SUBJECTS.roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                ) : entry.subjectType === 'device' ? (
                  <select
                    value={entry.subjectValue}
                    onChange={(e) => onChange({ subjectValue: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">Select device...</option>
                    {SUBJECTS.devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>
                    ))}
                  </select>
                ) : entry.subjectType === 'zone' ? (
                  <select
                    value={entry.subjectValue}
                    onChange={(e) => onChange({ subjectValue: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">Select zone...</option>
                    {SUBJECTS.zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={entry.subjectValue}
                    onChange={(e) => onChange({ subjectValue: e.target.value })}
                    placeholder={entry.subjectType === 'ip_range' ? '10.3.0.0/24' : 'username'}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Server size={14} />
                Resource (What)
              </h5>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Resource Type</label>
                <select
                  value={entry.resourceType}
                  onChange={(e) => onChange({ resourceType: e.target.value as AccessControlEntry['resourceType'], resourceValue: '' })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="all">All Resources</option>
                  <option value="plc">Specific PLC</option>
                  <option value="register_range">Register Range</option>
                  <option value="function_code">Function Code</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Resource Value</label>
                {entry.resourceType === 'plc' ? (
                  <select
                    value={entry.resourceValue}
                    onChange={(e) => onChange({ resourceValue: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">Select PLC...</option>
                    {RESOURCES.plcs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (:{p.port})</option>
                    ))}
                  </select>
                ) : entry.resourceType === 'register_range' ? (
                  <select
                    value={entry.resourceValue}
                    onChange={(e) => onChange({ resourceValue: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">Select range...</option>
                    {RESOURCES.registerRanges.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.range})</option>
                    ))}
                    <option value="custom">Custom Range...</option>
                  </select>
                ) : entry.resourceType === 'function_code' ? (
                  <input
                    type="text"
                    value={entry.resourceValue}
                    onChange={(e) => onChange({ resourceValue: e.target.value })}
                    placeholder="1,2,3,4 or 1-4"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={entry.resourceValue}
                    onChange={(e) => onChange({ resourceValue: e.target.value })}
                    placeholder="All resources"
                    disabled
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-500"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Operations *</label>
            <div className="flex gap-2">
              {(['read', 'write', 'execute'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => {
                    const newOps = entry.operations.includes(op)
                      ? entry.operations.filter(o => o !== op)
                      : [...entry.operations, op];
                    onChange({ operations: newOps });
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    entry.operations.includes(op)
                      ? op === 'read'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : op === 'write'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {op.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Read = FC 1-4, Write = FC 5,6,15,16, Execute = FC 8 (diagnostics)
            </p>
          </div>

          <ConditionsEditor
            conditions={entry.conditions}
            onChange={(conditions) => onChange({ conditions })}
          />

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description / Justification</label>
            <textarea
              value={entry.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Document why this ACL exists and what it protects..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ACLEditor({ entries: initialEntries, onSaveEntries, onValidate }: ACLEditorProps) {
  const [entries, setEntries] = useState<AccessControlEntry[]>(initialEntries);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validateEntry = (entry: AccessControlEntry): string[] => {
    const errors: string[] = [];
    if (!entry.name.trim()) errors.push('ACL name is required');
    if (!entry.subjectValue && entry.subjectType !== 'ip_range') errors.push('Subject value is required');
    if (entry.operations.length === 0) errors.push('Select at least one operation');
    if (entry.conditions.authLevelRequired === 'none' && entry.permission === 'allow' && entry.operations.includes('write')) {
      errors.push('Write access should require authentication');
    }
    return errors;
  };

  const handleAddEntry = () => {
    const newEntry = createEmptyEntry();
    setEntries([...entries, newEntry]);
    setExpandedEntries(new Set([...expandedEntries, newEntry.id]));
    setHasUnsavedChanges(true);
  };

  const handleAddPreset = (preset: 'operator_readonly' | 'engineer_full' | 'deny_safety_writes') => {
    let newEntry: AccessControlEntry;

    if (preset === 'operator_readonly') {
      newEntry = {
        ...createEmptyEntry(),
        name: 'Operator Read-Only Access',
        subjectType: 'role',
        subjectValue: 'operator',
        resourceType: 'all',
        resourceValue: '',
        permission: 'allow',
        operations: ['read'],
        conditions: {
          timeRestriction: null,
          authLevelRequired: 'basic',
          requireEncryption: false,
          maxSessionDuration: 480,
          sourceVerification: 'none',
        },
        description: 'Operators can view system status but cannot make changes',
      };
    } else if (preset === 'engineer_full') {
      newEntry = {
        ...createEmptyEntry(),
        name: 'Engineering Full Access',
        subjectType: 'role',
        subjectValue: 'engineer',
        resourceType: 'all',
        resourceValue: '',
        permission: 'allow',
        operations: ['read', 'write', 'execute'],
        conditions: {
          timeRestriction: {
            allowedDays: [1, 2, 3, 4, 5],
            startHour: 6,
            endHour: 22,
            timezone: 'America/New_York',
          },
          authLevelRequired: 'mfa',
          requireEncryption: true,
          maxSessionDuration: 60,
          sourceVerification: 'ip_whitelist',
        },
        description: 'Engineers have full access during business hours with MFA',
      };
    } else {
      newEntry = {
        ...createEmptyEntry(),
        name: 'Deny Safety PLC Writes',
        subjectType: 'zone',
        subjectValue: 'enterprise',
        resourceType: 'plc',
        resourceValue: 'safety_plc',
        permission: 'deny',
        operations: ['write'],
        priority: 10,
        conditions: {
          timeRestriction: null,
          authLevelRequired: 'none',
          requireEncryption: false,
          maxSessionDuration: null,
          sourceVerification: 'none',
        },
        description: 'Block all write access to Safety PLC from enterprise zone',
      };
    }

    setEntries([...entries, newEntry]);
    setExpandedEntries(new Set([...expandedEntries, newEntry.id]));
    setHasUnsavedChanges(true);
  };

  const handleUpdateEntry = (id: string, updates: Partial<AccessControlEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
    setHasUnsavedChanges(true);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveEntries(entries);
      setHasUnsavedChanges(false);
      const result = await onValidate();
      setValidationResult(result);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const allErrors = entries.flatMap(e => validateEntry(e));
  const hasValidationErrors = allErrors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="text-green-400" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">Access Control Lists</h3>
            <p className="text-xs text-slate-400">
              Define who can access what resources with which permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddPreset(e.target.value as 'operator_readonly' | 'engineer_full' | 'deny_safety_writes');
                e.target.value = '';
              }
            }}
            className="px-3 py-2 bg-slate-700 rounded-lg text-sm text-white border-none"
          >
            <option value="">Add template...</option>
            <option value="operator_readonly">Operator Read-Only</option>
            <option value="engineer_full">Engineer Full Access</option>
            <option value="deny_safety_writes">Deny Safety Writes</option>
          </select>
          <button
            onClick={handleAddEntry}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            <Plus size={16} />
            Custom
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
                ? `${entries.filter(e => e.enabled).length} ACL entries active. Access control is enforced.`
                : `Configuration issues: ${validationResult.errors.join(', ')}`
              }
            </span>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Lock size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">No access control entries configured</p>
          <p className="text-sm text-slate-500 mb-4">
            Without ACLs, all authenticated users have full access
          </p>
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            Create First ACL
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries
            .sort((a, b) => a.priority - b.priority)
            .map((entry) => (
            <ACLEntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedEntries.has(entry.id)}
              onToggleExpand={() => toggleExpand(entry.id)}
              onChange={(updates) => handleUpdateEntry(entry.id, updates)}
              onDelete={() => handleDeleteEntry(entry.id)}
              validationErrors={validateEntry(entry)}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Lock size={14} className="text-green-400" />
          Principle of Least Privilege
        </h4>
        <p className="text-xs text-slate-400">
          ACLs should follow the principle of least privilege: users and devices should only have
          the minimum access required for their job function. Start with DENY all, then add specific
          ALLOW rules. Always require authentication for write operations, and use MFA for
          safety-critical systems.
        </p>
      </div>
    </div>
  );
}
