import { useState } from 'react';
import { Gauge, Shield, AlertTriangle, Timer, Hash, ChevronDown, ChevronUp } from 'lucide-react';

interface PLCStateMonitorProps {
  state: number;
  speedSetpoint: number;
  safetyOk: boolean;
  emergencyStop: boolean;
  safetyGate: boolean;
  masterEnable: boolean;
  motorRunning: boolean;
  brakeEngaged: boolean;
  runtimeHours: number;
  cycleCounter: number;
  maintenanceFlag: boolean;
  lastErrorCode: number;
  zones: {
    zone1: boolean;
    zone2: boolean;
    zone3: boolean;
  };
}

export default function PLCStateMonitor({
  state,
  speedSetpoint,
  safetyOk,
  emergencyStop,
  safetyGate,
  masterEnable,
  motorRunning,
  brakeEngaged,
  runtimeHours,
  cycleCounter,
  maintenanceFlag,
  lastErrorCode,
  zones,
}: PLCStateMonitorProps) {
  const getStateName = (stateNum: number) => {
    const states = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance'];
    return states[stateNum] || 'Unknown';
  };

  const getStateColor = (stateNum: number) => {
    const colors = [
      'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
      'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
      'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    ];
    return colors[stateNum] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
  };

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-colors overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 p-6 pb-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">PLC State Monitor</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">State Machine</div>
            <div className={`text-sm font-bold px-2 py-1 rounded ${getStateColor(state)}`}>
              {getStateName(state)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Speed Setpoint</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{speedSetpoint}%</div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Safety Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatusIndicator label="Safety OK" value={safetyOk} />
            <StatusIndicator label="E-Stop" value={emergencyStop} danger />
            <StatusIndicator label="Safety Gate" value={safetyGate} />
            <StatusIndicator label="Master Enable" value={masterEnable} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mechanical Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatusIndicator label="Motor Running" value={motorRunning} />
            <StatusIndicator label="Brake Engaged" value={brakeEngaged} danger />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Zone Status</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ZoneIndicator number={1} enabled={zones.zone1} />
            <ZoneIndicator number={2} enabled={zones.zone2} />
            <ZoneIndicator number={3} enabled={zones.zone3} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Counters</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Runtime</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{runtimeHours}h</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Cycles</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{cycleCounter}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Error Code</div>
              <div className={`text-base font-bold ${lastErrorCode > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {lastErrorCode}
              </div>
            </div>
          </div>
        </div>

        {maintenanceFlag && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-300">Maintenance Required</span>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ label, value, danger = false }: { label: string; value: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`font-bold ${
        danger
          ? (value ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')
          : (value ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500')
      }`}>
        {value ? 'YES' : 'NO'}
      </span>
    </div>
  );
}

function ZoneIndicator({ number, enabled }: { number: number; enabled: boolean }) {
  return (
    <div className={`text-center p-2 rounded border ${
      enabled
        ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
    }`}>
      <div className="text-xs font-bold">Z{number}</div>
      <div className="text-xs">{enabled ? 'ON' : 'OFF'}</div>
    </div>
  );
}
