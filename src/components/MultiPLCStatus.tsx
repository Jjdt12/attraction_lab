import React from 'react';
import { Server, Wifi, WifiOff, Activity } from 'lucide-react';
import { PLCConnection } from '../hooks/useMultiPLCConnection';

interface MultiPLCStatusProps {
  plcs: PLCConnection[];
  onConnect: (plcName: string) => void;
  onDisconnect: (plcName: string) => void;
  onConnectAll: () => void;
  onDisconnectAll: () => void;
}

export function MultiPLCStatus({
  plcs,
  onConnect,
  onDisconnect,
  onConnectAll,
  onDisconnectAll
}: MultiPLCStatusProps) {
  const allConnected = plcs.every(plc => plc.connected);
  const anyConnected = plcs.some(plc => plc.connected);

  const getPLCColor = (plcName: string) => {
    switch (plcName) {
      case 'MAIN':
        return 'border-green-500 bg-green-900/20';
      case 'SAFETY':
        return 'border-orange-500 bg-orange-900/20';
      case 'EFFECTS':
        return 'border-purple-500 bg-purple-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getPLCIconColor = (plcName: string) => {
    switch (plcName) {
      case 'MAIN':
        return 'text-green-400';
      case 'SAFETY':
        return 'text-orange-400';
      case 'EFFECTS':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">PLC Network Status</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConnectAll}
            disabled={allConnected}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm"
          >
            Connect All
          </button>
          <button
            onClick={onDisconnectAll}
            disabled={!anyConnected}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm"
          >
            Disconnect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plcs.map(plc => (
          <div
            key={plc.name}
            className={`border-2 rounded-lg p-4 ${getPLCColor(plc.name)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className={`h-5 w-5 ${getPLCIconColor(plc.name)}`} />
                <span className="font-bold text-white">{plc.name}</span>
              </div>
              {plc.connected ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-500" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Host:</span>
                <span className="text-white">{plc.host}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Port:</span>
                <span className="text-white">{plc.port}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Status:</span>
                <span className={plc.connected ? 'text-green-400' : 'text-gray-500'}>
                  {plc.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {plc.connected && (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Activity className="h-3 w-3" />
                  <span>Heartbeat active</span>
                </div>
              )}
              {plc.error && (
                <div className="text-red-400 text-xs mt-2">
                  {plc.error}
                </div>
              )}
            </div>

            <button
              onClick={() => plc.connected ? onDisconnect(plc.name) : onConnect(plc.name)}
              className={`w-full mt-3 px-3 py-2 rounded text-sm font-semibold ${
                plc.connected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {plc.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-700">
        <div className="text-sm text-gray-400">
          <strong className="text-white">Network Topology:</strong> All PLCs communicate via Modbus TCP.
          Main PLC handles sequencing, Safety PLC enforces interlocks, Effects PLC controls show elements.
        </div>
      </div>
    </div>
  );
}
