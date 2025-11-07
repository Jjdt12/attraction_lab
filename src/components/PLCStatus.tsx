import { Activity, Circle } from 'lucide-react';

interface PLCStatusProps {
  wsConnected: boolean;
  plcConnected: boolean;
  plcHost: string | null;
  plcPort: number | null;
}

export default function PLCStatus({ wsConnected, plcConnected, plcHost, plcPort }: PLCStatusProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-900">Connection Status</h3>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">WebSocket Server</span>
            <div className="flex items-center gap-2">
              <Circle
                className={`w-2 h-2 ${
                  wsConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                }`}
              />
              <span className={`text-sm font-medium ${wsConnected ? 'text-green-700' : 'text-red-700'}`}>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono">
            {import.meta.env.VITE_WS_URL || 'ws://localhost:8765'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">PLC Modbus</span>
            <div className="flex items-center gap-2">
              <Circle
                className={`w-2 h-2 ${
                  plcConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                }`}
              />
              <span className={`text-sm font-medium ${plcConnected ? 'text-green-700' : 'text-red-700'}`}>
                {plcConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono">
            {plcHost && plcPort ? `${plcHost}:${plcPort}` : 'Not configured'}
          </div>
        </div>
      </div>

      {!wsConnected && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Start the server with:
          </p>
          <code className="block mt-2 text-xs bg-yellow-100 p-2 rounded font-mono text-yellow-900">
            cd scripts && ./start.sh
          </code>
        </div>
      )}
    </div>
  );
}
