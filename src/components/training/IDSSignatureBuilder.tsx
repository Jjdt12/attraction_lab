import { useState } from 'react';
import {
  Eye,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Zap,
  Shield,
} from 'lucide-react';

export interface IDSSignature {
  id: string;
  name: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionType: 'pattern' | 'threshold' | 'anomaly' | 'sequence';
  action: 'alert' | 'alert_and_block' | 'log';
  pattern: PatternConfig | null;
  threshold: ThresholdConfig | null;
  anomaly: AnomalyConfig | null;
  sequence: SequenceConfig | null;
  description: string;
  mitreTactic: string;
  mitreId: string;
}

interface PatternConfig {
  matchType: 'hex' | 'regex' | 'string';
  pattern: string;
  offset: number;
  depth: number;
  caseSensitive: boolean;
}

interface ThresholdConfig {
  metric: 'requests_per_second' | 'writes_per_minute' | 'errors_per_minute' | 'unique_addresses';
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
  timeWindowSeconds: number;
  trackBy: 'source_ip' | 'destination' | 'global';
}

interface AnomalyConfig {
  baseline: 'time_of_day' | 'historical_average' | 'peer_comparison';
  metric: 'request_rate' | 'function_code_distribution' | 'address_access_pattern';
  sensitivity: number;
  learningPeriodHours: number;
}

interface SequenceConfig {
  events: SequenceEvent[];
  maxSpanSeconds: number;
  requireOrdered: boolean;
}

interface SequenceEvent {
  functionCode: number;
  addressRange?: { start: number; end: number };
  valueCondition?: { operator: 'equals' | 'greater_than' | 'less_than'; value: number };
}

interface IDSSignatureBuilderProps {
  signatures: IDSSignature[];
  onSaveSignatures: (signatures: IDSSignature[]) => Promise<void>;
  onValidate: () => Promise<{ valid: boolean; errors: string[] }>;
}

const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0004', name: 'Privilege Escalation' },
  { id: 'TA0005', name: 'Defense Evasion' },
  { id: 'TA0007', name: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement' },
  { id: 'TA0009', name: 'Collection' },
  { id: 'TA0011', name: 'Command and Control' },
  { id: 'TA0040', name: 'Impact' },
];

const KNOWN_ATTACK_PATTERNS = [
  {
    name: 'Rapid Register Scan',
    type: 'threshold' as const,
    config: {
      metric: 'requests_per_second' as const,
      operator: 'greater_than' as const,
      value: 50,
      timeWindowSeconds: 1,
      trackBy: 'source_ip' as const,
    },
    severity: 'medium' as const,
    mitreTactic: 'TA0007',
    mitreId: 'T0846',
    description: 'Detects reconnaissance scanning of Modbus registers',
  },
  {
    name: 'Safety Override Attempt',
    type: 'pattern' as const,
    config: {
      matchType: 'hex' as const,
      pattern: '00 05 00 64 FF 00',
      offset: 7,
      depth: 6,
      caseSensitive: false,
    },
    severity: 'critical' as const,
    mitreTactic: 'TA0040',
    mitreId: 'T0816',
    description: 'Detects write to safety override coil (address 100)',
  },
  {
    name: 'Unusual Write Burst',
    type: 'threshold' as const,
    config: {
      metric: 'writes_per_minute' as const,
      operator: 'greater_than' as const,
      value: 30,
      timeWindowSeconds: 60,
      trackBy: 'source_ip' as const,
    },
    severity: 'high' as const,
    mitreTactic: 'TA0040',
    mitreId: 'T0831',
    description: 'Unusual volume of write operations indicating potential manipulation',
  },
  {
    name: 'E-Stop Manipulation',
    type: 'sequence' as const,
    config: {
      events: [
        { functionCode: 3, addressRange: { start: 0, end: 10 } },
        { functionCode: 5, addressRange: { start: 0, end: 3 } },
      ],
      maxSpanSeconds: 5,
      requireOrdered: true,
    },
    severity: 'critical' as const,
    mitreTactic: 'TA0040',
    mitreId: 'T0816',
    description: 'Read followed by write to E-Stop coils - potential safety system attack',
  },
];

function createEmptySignature(): IDSSignature {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    severity: 'medium',
    detectionType: 'threshold',
    action: 'alert',
    pattern: null,
    threshold: {
      metric: 'requests_per_second',
      operator: 'greater_than',
      value: 100,
      timeWindowSeconds: 1,
      trackBy: 'source_ip',
    },
    anomaly: null,
    sequence: null,
    description: '',
    mitreTactic: '',
    mitreId: '',
  };
}

function PatternEditor({
  config,
  onChange,
}: {
  config: PatternConfig;
  onChange: (config: PatternConfig) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h5 className="text-xs font-semibold text-slate-300">Pattern Matching</h5>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Match Type</label>
          <select
            value={config.matchType}
            onChange={(e) => onChange({ ...config, matchType: e.target.value as PatternConfig['matchType'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="hex">Hex Bytes</option>
            <option value="regex">Regular Expression</option>
            <option value="string">String Literal</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={config.caseSensitive}
              onChange={(e) => onChange({ ...config, caseSensitive: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700"
            />
            Case Sensitive
          </label>
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 mb-1">
          Pattern
          {config.matchType === 'hex' && <span className="text-slate-600 ml-1">(e.g., 00 05 00 64 FF 00)</span>}
        </label>
        <input
          type="text"
          value={config.pattern}
          onChange={(e) => onChange({ ...config, pattern: e.target.value })}
          placeholder={config.matchType === 'hex' ? '00 05 00 64 FF 00' : config.matchType === 'regex' ? '^\\x00\\x05' : 'search string'}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">
            Offset (bytes from start)
          </label>
          <input
            type="number"
            value={config.offset}
            onChange={(e) => onChange({ ...config, offset: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={0}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">
            Search Depth (bytes)
          </label>
          <input
            type="number"
            value={config.depth}
            onChange={(e) => onChange({ ...config, depth: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

function ThresholdEditor({
  config,
  onChange,
}: {
  config: ThresholdConfig;
  onChange: (config: ThresholdConfig) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h5 className="text-xs font-semibold text-slate-300">Threshold Detection</h5>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Metric</label>
          <select
            value={config.metric}
            onChange={(e) => onChange({ ...config, metric: e.target.value as ThresholdConfig['metric'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="requests_per_second">Requests per Second</option>
            <option value="writes_per_minute">Writes per Minute</option>
            <option value="errors_per_minute">Errors per Minute</option>
            <option value="unique_addresses">Unique Addresses Accessed</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Track By</label>
          <select
            value={config.trackBy}
            onChange={(e) => onChange({ ...config, trackBy: e.target.value as ThresholdConfig['trackBy'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="source_ip">Source IP</option>
            <option value="destination">Destination</option>
            <option value="global">Global</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Operator</label>
          <select
            value={config.operator}
            onChange={(e) => onChange({ ...config, operator: e.target.value as ThresholdConfig['operator'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
            <option value="equals">Equals</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Threshold Value</label>
          <input
            type="number"
            value={config.value}
            onChange={(e) => onChange({ ...config, value: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={0}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Time Window (sec)</label>
          <input
            type="number"
            value={config.timeWindowSeconds}
            onChange={(e) => onChange({ ...config, timeWindowSeconds: parseInt(e.target.value) || 1 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={1}
          />
        </div>
      </div>
    </div>
  );
}

function AnomalyEditor({
  config,
  onChange,
}: {
  config: AnomalyConfig;
  onChange: (config: AnomalyConfig) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h5 className="text-xs font-semibold text-slate-300">Anomaly Detection</h5>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Baseline Type</label>
          <select
            value={config.baseline}
            onChange={(e) => onChange({ ...config, baseline: e.target.value as AnomalyConfig['baseline'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="time_of_day">Time of Day Pattern</option>
            <option value="historical_average">Historical Average</option>
            <option value="peer_comparison">Peer Comparison</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Metric to Monitor</label>
          <select
            value={config.metric}
            onChange={(e) => onChange({ ...config, metric: e.target.value as AnomalyConfig['metric'] })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
          >
            <option value="request_rate">Request Rate</option>
            <option value="function_code_distribution">Function Code Distribution</option>
            <option value="address_access_pattern">Address Access Pattern</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">
            Sensitivity (0-100, higher = more alerts)
          </label>
          <input
            type="range"
            value={config.sensitivity}
            onChange={(e) => onChange({ ...config, sensitivity: parseInt(e.target.value) })}
            className="w-full"
            min={0}
            max={100}
          />
          <div className="text-xs text-slate-400 text-center">{config.sensitivity}%</div>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Learning Period (hours)</label>
          <input
            type="number"
            value={config.learningPeriodHours}
            onChange={(e) => onChange({ ...config, learningPeriodHours: parseInt(e.target.value) || 24 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={1}
          />
        </div>
      </div>
    </div>
  );
}

function SequenceEditor({
  config,
  onChange,
}: {
  config: SequenceConfig;
  onChange: (config: SequenceConfig) => void;
}) {
  const addEvent = () => {
    onChange({
      ...config,
      events: [...config.events, { functionCode: 3 }],
    });
  };

  const updateEvent = (index: number, updates: Partial<SequenceEvent>) => {
    const newEvents = [...config.events];
    newEvents[index] = { ...newEvents[index], ...updates };
    onChange({ ...config, events: newEvents });
  };

  const removeEvent = (index: number) => {
    onChange({
      ...config,
      events: config.events.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-slate-300">Sequence Detection</h5>
        <button
          onClick={addEvent}
          className="px-2 py-0.5 text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-cyan-300"
        >
          + Add Event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Max Time Span (seconds)</label>
          <input
            type="number"
            value={config.maxSpanSeconds}
            onChange={(e) => onChange({ ...config, maxSpanSeconds: parseInt(e.target.value) || 5 })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
            min={1}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={config.requireOrdered}
              onChange={(e) => onChange({ ...config, requireOrdered: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700"
            />
            Require Ordered Events
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {config.events.map((event, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-slate-700">
            <span className="text-xs text-slate-500 w-6">{index + 1}.</span>
            <select
              value={event.functionCode}
              onChange={(e) => updateEvent(index, { functionCode: parseInt(e.target.value) })}
              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
            >
              <option value={1}>FC1 - Read Coils</option>
              <option value={2}>FC2 - Read Discrete Inputs</option>
              <option value={3}>FC3 - Read Holding Registers</option>
              <option value={4}>FC4 - Read Input Registers</option>
              <option value={5}>FC5 - Write Single Coil</option>
              <option value={6}>FC6 - Write Single Register</option>
              <option value={15}>FC15 - Write Multiple Coils</option>
              <option value={16}>FC16 - Write Multiple Registers</option>
            </select>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Addr:</span>
              <input
                type="number"
                value={event.addressRange?.start ?? ''}
                onChange={(e) => updateEvent(index, {
                  addressRange: {
                    start: parseInt(e.target.value) || 0,
                    end: event.addressRange?.end ?? (parseInt(e.target.value) || 0),
                  }
                })}
                placeholder="any"
                className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
              />
              <span>-</span>
              <input
                type="number"
                value={event.addressRange?.end ?? ''}
                onChange={(e) => updateEvent(index, {
                  addressRange: {
                    start: event.addressRange?.start ?? 0,
                    end: parseInt(e.target.value) || 0,
                  }
                })}
                placeholder="any"
                className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
              />
            </div>

            <button
              onClick={() => removeEvent(index)}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 ml-auto"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignatureCard({
  signature,
  expanded,
  onToggleExpand,
  onChange,
  onDelete,
  validationErrors,
}: {
  signature: IDSSignature;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (updates: Partial<IDSSignature>) => void;
  onDelete: () => void;
  validationErrors: string[];
}) {
  const hasErrors = validationErrors.length > 0;

  const severityColors = {
    low: 'bg-slate-500/20 text-slate-300',
    medium: 'bg-amber-500/20 text-amber-300',
    high: 'bg-orange-500/20 text-orange-300',
    critical: 'bg-red-500/20 text-red-300',
  };

  const actionColors = {
    log: 'text-slate-400',
    alert: 'text-amber-400',
    alert_and_block: 'text-red-400',
  };

  const handleDetectionTypeChange = (type: IDSSignature['detectionType']) => {
    const updates: Partial<IDSSignature> = { detectionType: type };

    if (type === 'pattern' && !signature.pattern) {
      updates.pattern = { matchType: 'hex', pattern: '', offset: 0, depth: 100, caseSensitive: false };
      updates.threshold = null;
      updates.anomaly = null;
      updates.sequence = null;
    } else if (type === 'threshold' && !signature.threshold) {
      updates.threshold = { metric: 'requests_per_second', operator: 'greater_than', value: 100, timeWindowSeconds: 1, trackBy: 'source_ip' };
      updates.pattern = null;
      updates.anomaly = null;
      updates.sequence = null;
    } else if (type === 'anomaly' && !signature.anomaly) {
      updates.anomaly = { baseline: 'historical_average', metric: 'request_rate', sensitivity: 75, learningPeriodHours: 24 };
      updates.pattern = null;
      updates.threshold = null;
      updates.sequence = null;
    } else if (type === 'sequence' && !signature.sequence) {
      updates.sequence = { events: [], maxSpanSeconds: 10, requireOrdered: true };
      updates.pattern = null;
      updates.threshold = null;
      updates.anomaly = null;
    }

    onChange(updates);
  };

  return (
    <div className={`border rounded-lg transition-all ${
      hasErrors
        ? 'border-red-500/50 bg-red-500/5'
        : signature.enabled
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-slate-800 bg-slate-900/50 opacity-60'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onChange({ enabled: !signature.enabled })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            signature.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            signature.enabled ? 'left-5' : 'left-0.5'
          }`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${severityColors[signature.severity]}`}>
              {signature.severity.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {signature.name || 'Unnamed Signature'}
            </span>
            {hasErrors && <AlertCircle size={14} className="text-red-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span>{signature.detectionType}</span>
            <span className={actionColors[signature.action]}>{signature.action.replace('_', ' ')}</span>
            {signature.mitreId && (
              <span className="text-slate-500">{signature.mitreId}</span>
            )}
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
              <label className="block text-xs text-slate-400 mb-1">Signature Name *</label>
              <input
                type="text"
                value={signature.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g., Safety Override Detection"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Severity</label>
                <select
                  value={signature.severity}
                  onChange={(e) => onChange({ severity: e.target.value as IDSSignature['severity'] })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Action</label>
                <select
                  value={signature.action}
                  onChange={(e) => onChange({ action: e.target.value as IDSSignature['action'] })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="log">Log Only</option>
                  <option value="alert">Alert</option>
                  <option value="alert_and_block">Alert & Block</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Detection Type</label>
            <div className="flex gap-2">
              {(['pattern', 'threshold', 'anomaly', 'sequence'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDetectionTypeChange(type)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    signature.detectionType === type
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {signature.detectionType === 'pattern' && signature.pattern && (
            <PatternEditor
              config={signature.pattern}
              onChange={(config) => onChange({ pattern: config })}
            />
          )}

          {signature.detectionType === 'threshold' && signature.threshold && (
            <ThresholdEditor
              config={signature.threshold}
              onChange={(config) => onChange({ threshold: config })}
            />
          )}

          {signature.detectionType === 'anomaly' && signature.anomaly && (
            <AnomalyEditor
              config={signature.anomaly}
              onChange={(config) => onChange({ anomaly: config })}
            />
          )}

          {signature.detectionType === 'sequence' && signature.sequence && (
            <SequenceEditor
              config={signature.sequence}
              onChange={(config) => onChange({ sequence: config })}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">MITRE ATT&CK Tactic</label>
              <select
                value={signature.mitreTactic}
                onChange={(e) => onChange({ mitreTactic: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select tactic...</option>
                {MITRE_TACTICS.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">MITRE Technique ID</label>
              <input
                type="text"
                value={signature.mitreId}
                onChange={(e) => onChange({ mitreId: e.target.value })}
                placeholder="e.g., T0816"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={signature.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe what this signature detects and why it matters..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function IDSSignatureBuilder({ signatures: initialSignatures, onSaveSignatures, onValidate }: IDSSignatureBuilderProps) {
  const [signatures, setSignatures] = useState<IDSSignature[]>(initialSignatures);
  const [expandedSignatures, setExpandedSignatures] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validateSignature = (sig: IDSSignature): string[] => {
    const errors: string[] = [];
    if (!sig.name.trim()) errors.push('Signature name is required');
    if (sig.detectionType === 'pattern' && sig.pattern && !sig.pattern.pattern.trim()) {
      errors.push('Pattern string is required for pattern-based detection');
    }
    if (sig.detectionType === 'threshold' && sig.threshold && sig.threshold.value <= 0) {
      errors.push('Threshold value must be greater than 0');
    }
    if (sig.detectionType === 'sequence' && sig.sequence && sig.sequence.events.length < 2) {
      errors.push('Sequence detection requires at least 2 events');
    }
    return errors;
  };

  const handleAddSignature = () => {
    const newSig = createEmptySignature();
    setSignatures([...signatures, newSig]);
    setExpandedSignatures(new Set([...expandedSignatures, newSig.id]));
    setHasUnsavedChanges(true);
  };

  const handleAddPreset = (preset: typeof KNOWN_ATTACK_PATTERNS[number]) => {
    const newSig: IDSSignature = {
      id: crypto.randomUUID(),
      name: preset.name,
      enabled: true,
      severity: preset.severity,
      detectionType: preset.type,
      action: preset.severity === 'critical' ? 'alert_and_block' : 'alert',
      pattern: preset.type === 'pattern' ? preset.config as PatternConfig : null,
      threshold: preset.type === 'threshold' ? preset.config as ThresholdConfig : null,
      anomaly: null,
      sequence: preset.type === 'sequence' ? preset.config as SequenceConfig : null,
      description: preset.description,
      mitreTactic: preset.mitreTactic,
      mitreId: preset.mitreId,
    };
    setSignatures([...signatures, newSig]);
    setExpandedSignatures(new Set([...expandedSignatures, newSig.id]));
    setHasUnsavedChanges(true);
  };

  const handleUpdateSignature = (id: string, updates: Partial<IDSSignature>) => {
    setSignatures(signatures.map(s => s.id === id ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
  };

  const handleDeleteSignature = (id: string) => {
    setSignatures(signatures.filter(s => s.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSignatures(signatures);
      setHasUnsavedChanges(false);
      const result = await onValidate();
      setValidationResult(result);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedSignatures);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSignatures(newExpanded);
  };

  const allErrors = signatures.flatMap(s => validateSignature(s));
  const hasValidationErrors = allErrors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="text-purple-400" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">IDS Signatures</h3>
            <p className="text-xs text-slate-400">
              Create detection rules for attack patterns, thresholds, and anomalies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          <select
            onChange={(e) => {
              const preset = KNOWN_ATTACK_PATTERNS.find(p => p.name === e.target.value);
              if (preset) handleAddPreset(preset);
              e.target.value = '';
            }}
            className="px-3 py-2 bg-slate-700 rounded-lg text-sm text-white border-none"
          >
            <option value="">Add known attack...</option>
            {KNOWN_ATTACK_PATTERNS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddSignature}
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
                ? `${signatures.filter(s => s.enabled).length} IDS signatures active. Attack patterns will be detected.`
                : `Configuration issues: ${validationResult.errors.join(', ')}`
              }
            </span>
          </div>
        </div>
      )}

      {signatures.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Eye size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">No IDS signatures configured</p>
          <p className="text-sm text-slate-500 mb-4">
            Create signatures to detect attack patterns and suspicious behavior
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleAddSignature}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
            >
              Create Custom Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {signatures.map((sig) => (
            <SignatureCard
              key={sig.id}
              signature={sig}
              expanded={expandedSignatures.has(sig.id)}
              onToggleExpand={() => toggleExpand(sig.id)}
              onChange={(updates) => handleUpdateSignature(sig.id, updates)}
              onDelete={() => handleDeleteSignature(sig.id)}
              validationErrors={validateSignature(sig)}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Activity size={14} className="text-purple-400" />
          Detection Strategies
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <strong className="text-slate-300">Pattern:</strong> Match specific byte sequences in packets.
            Best for known exploits with fixed signatures.
          </div>
          <div>
            <strong className="text-slate-300">Threshold:</strong> Alert when metrics exceed limits.
            Best for DoS, scanning, and abuse detection.
          </div>
          <div>
            <strong className="text-slate-300">Anomaly:</strong> Detect deviations from baseline.
            Best for zero-day and novel attacks.
          </div>
          <div>
            <strong className="text-slate-300">Sequence:</strong> Match ordered event chains.
            Best for multi-stage attacks and recon-to-exploit patterns.
          </div>
        </div>
      </div>
    </div>
  );
}
