import { useState } from 'react';
import { Gauge, Shield, AlertTriangle, Timer, Hash, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

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
    const states = ['IDLE', 'STARTING', 'RUNNING', 'STOPPING', 'EMERGENCY', 'MAINT'];
    return states[stateNum] || 'UNKNOWN';
  };

  const getStateColor = (stateNum: number) => {
    const colors = [
      'text-slate-400 bg-slate-500/20 border-slate-500/30',
      'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'text-green-400 bg-green-500/20 border-green-500/30',
      'text-amber-400 bg-amber-500/20 border-amber-500/30',
      'text-red-400 bg-red-500/20 border-red-500/30',
      'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    ];
    return colors[stateNum] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  };

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">PLC State Monitor</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">State Machine</div>
              <div className={`text-sm font-mono font-bold px-2 py-1 rounded border ${getStateColor(state)}`}>
                {getStateName(state)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Speed</div>
              <div className="text-xl font-mono font-bold text-white">{speedSetpoint}%</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Safety Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatusIndicator label="Safety OK" value={safetyOk} />
              <StatusIndicator label="E-Stop" value={emergencyStop} danger />
              <StatusIndicator label="Gate" value={safetyGate} />
              <StatusIndicator label="Master" value={masterEnable} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Mechanical</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatusIndicator label="Motor" value={motorRunning} />
              <StatusIndicator label="Brake" value={brakeEngaged} danger />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Zone Status</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ZoneIndicator number={1} enabled={zones.zone1} />
              <ZoneIndicator number={2} enabled={zones.zone2} />
              <ZoneIndicator number={3} enabled={zones.zone3} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Counters</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-[9px] text-slate-500">Runtime</div>
                <div className="text-sm font-mono font-bold text-white">{runtimeHours}h</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-500">Cycles</div>
                <div className="text-sm font-mono font-bold text-white">{cycleCounter}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-slate-500">Error</div>
                <div className={`text-sm font-mono font-bold ${lastErrorCode > 0 ? 'text-red-400' : 'text-white'}`}>
                  {lastErrorCode}
                </div>
              </div>
            </div>
          </div>

          {maintenanceFlag && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Maintenance Required</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ label, value, danger = false }: { label: string; value: boolean; danger?: boolean }) {
  const isGood = danger ? !value : value;
  return (
    <div className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/50">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono font-bold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {value ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

function ZoneIndicator({ number, enabled }: { number: number; enabled: boolean }) {
  return (
    <div className={`text-center p-1.5 rounded border ${
      enabled
        ? 'bg-green-500/10 border-green-500/30 text-green-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <div className="text-[10px] font-mono font-bold">Z{number}</div>
      <div className="text-[9px]">{enabled ? 'ON' : 'OFF'}</div>
    </div>
  );
}
