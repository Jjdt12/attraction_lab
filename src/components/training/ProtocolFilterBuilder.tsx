import { useState } from 'react';
import {
  Filter,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from 'lucide-react';

export interface ProtocolFilter {
  id: string;
  name: string;
  enabled: boolean;
  sourceZone: string;
  allowedFunctionCodes: number[];
  blockedFunctionCodes: number[];
  addressRanges: AddressRange[];
  rateLimit: RateLimit | null;
  description: string;
}

interface AddressRange {
  type: 'coils' | 'discrete_inputs' | 'holding_registers' | 'input_registers';
  startAddress: number;
  endAddress: number;
  access: 'read' | 'write' | 'both' | 'none';
}

interface RateLimit {
  maxRequestsPerSecond: number;
  maxWritesPerSecond: number;
  burstAllowance: number;
}

interface ProtocolFilterBuilderProps {
  filters: ProtocolFilter[];
  onSaveFilters: (filters: ProtocolFilter[]) => Promise<void>;
  onValidate: () => Promise<{ valid: boolean; errors: string[] }>;
}

const MODBUS_FUNCTION_CODES = [
  { code: 1, name: 'Read Coils', type: 'read', dataType: 'coils' },
  { code: 2, name: 'Read Discrete Inputs', type: 'read', dataType: 'discrete_inputs' },
  { code: 3, name: 'Read Holding Registers', type: 'read', dataType: 'holding_registers' },
  { code: 4, name: 'Read Input Registers', type: 'read', dataType: 'input_registers' },
  { code: 5, name: 'Write Single Coil', type: 'write', dataType: 'coils' },
  { code: 6, name: 'Write Single Register', type: 'write', dataType: 'holding_registers' },
  { code: 15, name: 'Write Multiple Coils', type: 'write', dataType: 'coils' },
  { code: 16, name: 'Write Multiple Registers', type: 'write', dataType: 'holding_registers' },
  { code: 22, name: 'Mask Write Register', type: 'write', dataType: 'holding_registers' },
  { code: 23, name: 'Read/Write Multiple Registers', type: 'both', dataType: 'holding_registers' },
  { code: 43, name: 'Read Device Identification', type: 'read', dataType: 'device_info' },
];

const ZONES = [
  { id: 'enterprise', name: 'Enterprise Zone' },
  { id: 'dmz', name: 'IDMZ' },
  { id: 'operations', name: 'Operations Zone' },
  { id: 'control', name: 'Control Zone' },
  { id: 'hmi', name: 'HMI Stations' },
  { id: 'engineering', name: 'Engineering Workstations' },
  { id: 'any', name: 'Any Source' },
];

const ATTRACTION_REGISTERS = {
  main_plc: [
    { name: 'System Mode', start: 0, end: 0, type: 'holding_registers' as const },
    { name: 'Attraction State', start: 1, end: 1, type: 'holding_registers' as const },
    { name: 'Vehicle Position', start: 2, end: 5, type: 'holding_registers' as const },
    { name: 'Motor Speeds', start: 10, end: 19, type: 'holding_registers' as const },
    { name: 'Zone Occupancy', start: 20, end: 29, type: 'holding_registers' as const },
    { name: 'Dispatch Control', start: 100, end: 109, type: 'holding_registers' as const },
  ],
  safety_plc: [
    { name: 'E-Stop Status', start: 0, end: 3, type: 'coils' as const },
    { name: 'Safety Interlocks', start: 10, end: 29, type: 'coils' as const },
    { name: 'Door Sensors', start: 30, end: 49, type: 'discrete_inputs' as const },
    { name: 'Safety Override', start: 100, end: 100, type: 'coils' as const },
  ],
  effects_plc: [
    { name: 'Lighting Scenes', start: 0, end: 9, type: 'holding_registers' as const },
    { name: 'Audio Channels', start: 10, end: 19, type: 'holding_registers' as const },
    { name: 'Fog/Smoke', start: 20, end: 24, type: 'coils' as const },
    { name: 'Animatronics', start: 30, end: 49, type: 'holding_registers' as const },
  ],
};

function createEmptyFilter(): ProtocolFilter {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    sourceZone: 'any',
    allowedFunctionCodes: [],
    blockedFunctionCodes: [],
    addressRanges: [],
    rateLimit: null,
    description: '',
  };
}

function FunctionCodeSelector({
  selected,
  onChange,
  mode,
}: {
  selected: number[];
  onChange: (codes: number[]) => void;
  mode: 'allow' | 'block';
}) {
  const toggleCode = (code: number) => {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const selectReadOnly = () => {
    onChange(MODBUS_FUNCTION_CODES.filter(fc => fc.type === 'read').map(fc => fc.code));
  };

  const selectWriteOnly = () => {
    onChange(MODBUS_FUNCTION_CODES.filter(fc => fc.type === 'write' || fc.type === 'both').map(fc => fc.code));
  };

  const selectAll = () => {
    onChange(MODBUS_FUNCTION_CODES.map(fc => fc.code));
  };

  const selectNone = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">
          {mode === 'allow' ? 'Allowed Function Codes' : 'Blocked Function Codes'}
        </label>
        <div className="flex gap-1">
          <button onClick={selectReadOnly} className="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
            Read Only
          </button>
          <button onClick={selectWriteOnly} className="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
            Write Only
          </button>
          <button onClick={selectAll} className="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
            All
          </button>
          <button onClick={selectNone} className="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MODBUS_FUNCTION_CODES.map((fc) => (
          <button
            key={fc.code}
            onClick={() => toggleCode(fc.code)}
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
              selected.includes(fc.code)
                ? mode === 'allow'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/50 bg-red-500/10 text-red-300'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
              fc.type === 'read'
                ? 'bg-blue-500/20 text-blue-400'
                : fc.type === 'write'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-purple-500/20 text-purple-400'
            }`}>
              {fc.code}
            </span>
            <div className="flex-1 min-w-0">
              <div className="truncate">{fc.name}</div>
              <div className="text-[10px] text-slate-500">{fc.type}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddressRangeEditor({
  ranges,
  onChange,
}: {
  ranges: AddressRange[];
  onChange: (ranges: AddressRange[]) => void;
}) {
  const addRange = () => {
    onChange([...ranges, {
      type: 'holding_registers',
      startAddress: 0,
      endAddress: 100,
      access: 'read',
    }]);
  };

  const updateRange = (index: number, updates: Partial<AddressRange>) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], ...updates };
    onChange(newRanges);
  };

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: keyof typeof ATTRACTION_REGISTERS) => {
    const newRanges: AddressRange[] = ATTRACTION_REGISTERS[preset].map(r => ({
      type: r.type,
      startAddress: r.start,
      endAddress: r.end,
      access: 'read' as const,
    }));
    onChange([...ranges, ...newRanges]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">Address Range Restrictions</label>
        <div className="flex gap-1">
          <select
            onChange={(e) => e.target.value && applyPreset(e.target.value as keyof typeof ATTRACTION_REGISTERS)}
            className="px-2 py-0.5 text-[10px] bg-slate-700 rounded text-slate-300 border-none"
          >
            <option value="">Apply preset...</option>
            <option value="main_plc">Main PLC Registers</option>
            <option value="safety_plc">Safety PLC Registers</option>
            <option value="effects_plc">Effects PLC Registers</option>
          </select>
          <button
            onClick={addRange}
            className="px-2 py-0.5 text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-cyan-300"
          >
            + Add Range
          </button>
        </div>
      </div>

      {ranges.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500">No address restrictions</p>
          <p className="text-[10px] text-slate-600 mt-1">All addresses accessible with allowed function codes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranges.map((range, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <select
                value={range.type}
                onChange={(e) => updateRange(index, { type: e.target.value as AddressRange['type'] })}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
              >
                <option value="coils">Coils (0x)</option>
                <option value="discrete_inputs">Discrete Inputs (1x)</option>
                <option value="holding_registers">Holding Registers (4x)</option>
                <option value="input_registers">Input Registers (3x)</option>
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={range.startAddress}
                  onChange={(e) => updateRange(index, { startAddress: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
                  min={0}
                  max={65535}
                />
                <span className="text-slate-500">to</span>
                <input
                  type="number"
                  value={range.endAddress}
                  onChange={(e) => updateRange(index, { endAddress: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
                  min={0}
                  max={65535}
                />
              </div>

              <select
                value={range.access}
                onChange={(e) => updateRange(index, { access: e.target.value as AddressRange['access'] })}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
              >
                <option value="read">Read Only</option>
                <option value="write">Write Only</option>
                <option value="both">Read/Write</option>
                <option value="none">Block All</option>
              </select>

              <button
                onClick={() => removeRange(index)}
                className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RateLimitEditor({
  rateLimit,
  onChange,
}: {
  rateLimit: RateLimit | null;
  onChange: (limit: RateLimit | null) => void;
}) {
  const enabled = rateLimit !== null;

  const toggleEnabled = () => {
    if (enabled) {
      onChange(null);
    } else {
      onChange({
        maxRequestsPerSecond: 100,
        maxWritesPerSecond: 10,
        burstAllowance: 20,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">Rate Limiting</label>
        <button
          onClick={toggleEnabled}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            enabled ? 'bg-cyan-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            enabled ? 'left-5' : 'left-0.5'
          }`} />
        </button>
      </div>

      {enabled && rateLimit && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Max Requests/sec</label>
            <input
              type="number"
              value={rateLimit.maxRequestsPerSecond}
              onChange={(e) => onChange({ ...rateLimit, maxRequestsPerSecond: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
              min={1}
              max={1000}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Max Writes/sec</label>
            <input
              type="number"
              value={rateLimit.maxWritesPerSecond}
              onChange={(e) => onChange({ ...rateLimit, maxWritesPerSecond: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
              min={1}
              max={100}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Burst Allowance</label>
            <input
              type="number"
              value={rateLimit.burstAllowance}
              onChange={(e) => onChange({ ...rateLimit, burstAllowance: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
              min={1}
              max={100}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterCard({
  filter,
  expanded,
  onToggleExpand,
  onChange,
  onDelete,
  validationErrors,
}: {
  filter: ProtocolFilter;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (updates: Partial<ProtocolFilter>) => void;
  onDelete: () => void;
  validationErrors: string[];
}) {
  const hasErrors = validationErrors.length > 0;
  const [filterMode, setFilterMode] = useState<'allowlist' | 'blocklist'>('allowlist');

  return (
    <div className={`border rounded-lg transition-all ${
      hasErrors
        ? 'border-red-500/50 bg-red-500/5'
        : filter.enabled
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-slate-800 bg-slate-900/50 opacity-60'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onChange({ enabled: !filter.enabled })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            filter.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            filter.enabled ? 'left-5' : 'left-0.5'
          }`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {filter.name || 'Unnamed Filter'}
            </span>
            {hasErrors && <AlertCircle size={14} className="text-red-400 shrink-0" />}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {filter.sourceZone} → {filter.allowedFunctionCodes.length} allowed FC, {filter.addressRanges.length} address rules
          </div>
        </div>

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

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Filter Name *</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g., HMI Read-Only Access"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Source Zone</label>
              <select
                value={filter.sourceZone}
                onChange={(e) => onChange({ sourceZone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-700 pb-2">
            <button
              onClick={() => setFilterMode('allowlist')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filterMode === 'allowlist'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Allowlist Mode (safer)
            </button>
            <button
              onClick={() => setFilterMode('blocklist')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filterMode === 'blocklist'
                  ? 'bg-red-500/20 text-red-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Blocklist Mode
            </button>
          </div>

          {filterMode === 'allowlist' ? (
            <FunctionCodeSelector
              selected={filter.allowedFunctionCodes}
              onChange={(codes) => onChange({ allowedFunctionCodes: codes, blockedFunctionCodes: [] })}
              mode="allow"
            />
          ) : (
            <FunctionCodeSelector
              selected={filter.blockedFunctionCodes}
              onChange={(codes) => onChange({ blockedFunctionCodes: codes, allowedFunctionCodes: [] })}
              mode="block"
            />
          )}

          <AddressRangeEditor
            ranges={filter.addressRanges}
            onChange={(ranges) => onChange({ addressRanges: ranges })}
          />

          <RateLimitEditor
            rateLimit={filter.rateLimit}
            onChange={(limit) => onChange({ rateLimit: limit })}
          />

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={filter.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Document the purpose of this filter and what attacks it prevents..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProtocolFilterBuilder({ filters: initialFilters, onSaveFilters, onValidate }: ProtocolFilterBuilderProps) {
  const [filters, setFilters] = useState<ProtocolFilter[]>(initialFilters);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validateFilter = (filter: ProtocolFilter): string[] => {
    const errors: string[] = [];
    if (!filter.name.trim()) errors.push('Filter name is required');
    if (filter.allowedFunctionCodes.length === 0 && filter.blockedFunctionCodes.length === 0) {
      errors.push('Select at least one function code to allow or block');
    }
    filter.addressRanges.forEach((range, i) => {
      if (range.startAddress > range.endAddress) {
        errors.push(`Address range ${i + 1}: start address cannot be greater than end address`);
      }
      if (range.startAddress < 0 || range.endAddress > 65535) {
        errors.push(`Address range ${i + 1}: addresses must be between 0 and 65535`);
      }
    });
    return errors;
  };

  const handleAddFilter = () => {
    const newFilter = createEmptyFilter();
    setFilters([...filters, newFilter]);
    setExpandedFilters(new Set([...expandedFilters, newFilter.id]));
    setHasUnsavedChanges(true);
  };

  const handleUpdateFilter = (id: string, updates: Partial<ProtocolFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    setHasUnsavedChanges(true);
  };

  const handleDeleteFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveFilters(filters);
      setHasUnsavedChanges(false);
      const result = await onValidate();
      setValidationResult(result);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedFilters);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFilters(newExpanded);
  };

  const allErrors = filters.flatMap(f => validateFilter(f));
  const hasValidationErrors = allErrors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="text-blue-400" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">Protocol Filters</h3>
            <p className="text-xs text-slate-400">
              Control which Modbus function codes and addresses are accessible per source.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          <button
            onClick={handleAddFilter}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            <Plus size={16} />
            Add Filter
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
                ? 'Protocol filters configured correctly. Unauthorized function codes will be blocked.'
                : `Configuration issues: ${validationResult.errors.join(', ')}`
              }
            </span>
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300">
            <strong>Modbus Deep Packet Inspection:</strong> These filters examine the application layer
            of Modbus TCP traffic. Function codes determine what operations are allowed (read vs write),
            while address ranges restrict which registers can be accessed. Combine with firewall rules
            for defense in depth.
          </div>
        </div>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Filter size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">No protocol filters configured</p>
          <p className="text-sm text-slate-500 mb-4">
            Without filters, all Modbus function codes and addresses are accessible
          </p>
          <button
            onClick={handleAddFilter}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            Create First Filter
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              expanded={expandedFilters.has(filter.id)}
              onToggleExpand={() => toggleExpand(filter.id)}
              onChange={(updates) => handleUpdateFilter(filter.id, updates)}
              onDelete={() => handleDeleteFilter(filter.id)}
              validationErrors={validateFilter(filter)}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          Attack Prevention
        </h4>
        <p className="text-xs text-slate-400">
          Protocol filtering prevents attacks that bypass firewall rules. An attacker with network
          access could still send malicious Modbus commands without proper DPI. Block write function
          codes (5, 6, 15, 16) from untrusted sources, restrict access to safety-critical registers
          (addresses 0-99 on Safety PLC), and implement rate limiting to prevent DoS attacks.
        </p>
      </div>
    </div>
  );
}
