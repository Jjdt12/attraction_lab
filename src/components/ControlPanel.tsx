import { Play, Square, Settings, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Gauge } from 'lucide-react';
import { useState } from 'react';

interface ControlPanelProps {
  rideRunning: boolean;
  wsConnected: boolean;
  plcConnected: boolean;
  coilStates: boolean[];
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onConnectPLC: (host: string, port: number) => void;
  onEmergencyStop: () => void;
  onSetSafetyConditions: () => void;
}

export default function ControlPanel({
  rideRunning,
  wsConnected,
  plcConnected,
  coilStates,
  onStart,
  onStop,
  onReset,
  onConnectPLC,
  onEmergencyStop,
  onSetSafetyConditions,
}: ControlPanelProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [plcHost, setPlcHost] = useState('localhost');
  const [plcPort, setPlcPort] = useState('502');

  const masterEnable = coilStates[0] || false;
  const emergencyStop = coilStates[3] || false;
  const safetyGate = coilStates[4] || false;

  const safetyChecksPass = masterEnable && !emergencyStop && safetyGate;
  const canStart = wsConnected && plcConnected && !rideRunning && safetyChecksPass;

  const handleConnect = () => {
    const port = parseInt(plcPort, 10);
    if (plcHost && !isNaN(port)) {
      onConnectPLC(plcHost, port);
      setShowConfig(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Control Panel</h3>
        </div>
        {wsConnected && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-md transition-colors ${
              showConfig ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="PLC Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {showConfig && (
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                PLC Host
              </label>
              <input
                type="text"
                value={plcHost}
                onChange={(e) => setPlcHost(e.target.value)}
                disabled={rideRunning}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                PLC Port
              </label>
              <input
                type="number"
                value={plcPort}
                onChange={(e) => setPlcPort(e.target.value)}
                disabled={rideRunning}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder="502"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={rideRunning || !plcHost}
              className="w-full px-3 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
            >
              Connect to PLC
            </button>
          </div>
        )}

        {plcConnected && !rideRunning && (
          <div className="space-y-3">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Safety Interlock Status
            </div>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                safetyGate
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                {safetyGate ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${safetyGate ? 'text-green-300' : 'text-red-300'}`}>
                  Safety Gate
                </span>
                <span className={`ml-auto text-[10px] font-mono ${safetyGate ? 'text-green-400' : 'text-red-400'}`}>
                  {safetyGate ? 'CLOSED' : 'OPEN'}
                </span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                masterEnable
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                {masterEnable ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${masterEnable ? 'text-green-300' : 'text-red-300'}`}>
                  Master Enable
                </span>
                <span className={`ml-auto text-[10px] font-mono ${masterEnable ? 'text-green-400' : 'text-red-400'}`}>
                  {masterEnable ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                !emergencyStop
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                {!emergencyStop ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${!emergencyStop ? 'text-green-300' : 'text-red-300'}`}>
                  E-Stop Status
                </span>
                <span className={`ml-auto text-[10px] font-mono ${!emergencyStop ? 'text-green-400' : 'text-red-400'}`}>
                  {!emergencyStop ? 'CLEAR' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {!safetyChecksPass && (
              <button
                onClick={onSetSafetyConditions}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Initialize Safety Systems
              </button>
            )}

            {safetyChecksPass && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">All Safety Checks Passed</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Ride Operations
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                canStart
                  ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4" />
              Start
            </button>

            <button
              onClick={onStop}
              disabled={!rideRunning}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                rideRunning
                  ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </div>

          <button
            onClick={onReset}
            disabled={!plcConnected}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              plcConnected
                ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset System
          </button>
        </div>

        {!wsConnected && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-300">
              WebSocket server required for PLC communication
            </p>
          </div>
        )}

        {wsConnected && !plcConnected && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-300">
              Configure PLC connection using the settings button above
            </p>
          </div>
        )}

        {plcConnected && (
          <div className="pt-3 border-t border-slate-700/50">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-3">
              Emergency Control
            </div>
            <button
              onClick={onEmergencyStop}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/30 transition-all border-2 border-red-500"
            >
              <ShieldAlert className="w-5 h-5" />
              EMERGENCY STOP
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Immediately halts all ride operations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
