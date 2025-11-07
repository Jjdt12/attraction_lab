import { Play, Square, Settings, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
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

  const masterEnable = coilStates[0] || false;      // Coil 0 = master_enable (QX0.0)
  const emergencyStop = coilStates[3] || false;     // Coil 3 = emergency_stop_button (QX0.3)
  const safetyGate = coilStates[4] || false;        // Coil 4 = safety_gate_closed (QX0.4)

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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Control Panel</h3>
        {wsConnected && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="PLC Configuration"
          >
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>

      {showConfig && (
        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              PLC Host
            </label>
            <input
              type="text"
              value={plcHost}
              onChange={(e) => setPlcHost(e.target.value)}
              disabled={rideRunning}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              placeholder="e.g., 192.168.1.100 or localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              PLC Port
            </label>
            <input
              type="number"
              value={plcPort}
              onChange={(e) => setPlcPort(e.target.value)}
              disabled={rideRunning}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              placeholder="502"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={rideRunning || !plcHost}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            Connect to PLC
          </button>
        </div>
      )}

      <div className="space-y-4">
        {plcConnected && !rideRunning && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Pre-Start Safety Checklist
            </label>
            <div className="space-y-2 mb-3">
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                safetyGate ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                {safetyGate ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  safetyGate ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  Safety Gate Closed
                </span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                masterEnable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                {masterEnable ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  masterEnable ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  Master Enable Active
                </span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                !emergencyStop ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                {!emergencyStop ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  !emergencyStop ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  Emergency Stop Clear
                </span>
              </div>
            </div>
            <button
              onClick={onSetSafetyConditions}
              disabled={safetyChecksPass}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors mb-3 ${
                safetyChecksPass
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {safetyChecksPass ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  All Safety Checks Passed
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Initialize Safety Systems
                </>
              )}
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Ride Control
          </label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                canStart
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              Start Ride
            </button>

            <button
              onClick={onStop}
              disabled={!rideRunning}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                rideRunning
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Square className="w-5 h-5" />
              Stop Ride
            </button>
          </div>
          <button
            onClick={onReset}
            disabled={!plcConnected}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              plcConnected
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Zero
          </button>
          {!wsConnected && (
            <div className="mt-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              WebSocket server must be running to configure PLC
            </div>
          )}
          {wsConnected && !plcConnected && (
            <div className="mt-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              Configure and connect to your PLC using the settings button above
            </div>
          )}
          {!safetyChecksPass && plcConnected && !rideRunning && (
            <div className="mt-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <strong>Safety Check Required:</strong> Initialize safety systems before starting the ride
            </div>
          )}
        </div>

        {plcConnected && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Emergency Control
            </label>
            <button
              onClick={onEmergencyStop}
              disabled={!plcConnected}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              <ShieldAlert className="w-5 h-5" />
              Emergency Stop
            </button>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
              Immediately halts all ride operations
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
