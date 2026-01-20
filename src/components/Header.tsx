import { Cpu, Activity, ChevronDown, ChevronUp, Sun, Moon, Server, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  wsConnected: boolean;
  plcConnected: boolean;
  plcHost: string | null;
  plcPort: number | null;
  sessionId: string | null;
}

export default function Header({ wsConnected, plcConnected, plcHost, plcPort }: HeaderProps) {
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const allConnected = wsConnected && plcConnected;

  return (
    <div className="bg-slate-900 border-b border-slate-700 rounded-xl mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${allConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ICS Security Engineering Lab
              </h1>
              <p className="text-sm text-slate-400">
                Industrial Control System Training Environment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Security Training Mode</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-300" />
              ) : (
                <Sun className="w-5 h-5 text-slate-300" />
              )}
            </button>

            <button
              onClick={() => setShowConnectionDetails(!showConnectionDetails)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                allConnected
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                  : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${allConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-semibold ${allConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {allConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              {showConnectionDetails ? (
                <ChevronUp className={`w-4 h-4 ${allConnected ? 'text-green-400' : 'text-red-400'}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${allConnected ? 'text-green-400' : 'text-red-400'}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {showConnectionDetails && (
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">System Connections</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">WebSocket Gateway</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {import.meta.env.VITE_WS_URL || 'ws://localhost:8765'}
              </div>
              <div className={`mt-2 text-xs font-medium ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Main PLC (Modbus)</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${plcConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {plcHost && plcPort ? `${plcHost}:${plcPort}` : 'Not configured'}
              </div>
              <div className={`mt-2 text-xs font-medium ${plcConnected ? 'text-green-400' : 'text-red-400'}`}>
                {plcConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Protocol Status</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${allConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Modbus TCP/IP
              </div>
              <div className={`mt-2 text-xs font-medium ${allConnected ? 'text-green-400' : 'text-amber-400'}`}>
                {allConnected ? 'Active' : 'Waiting...'}
              </div>
            </div>
          </div>

          {!wsConnected && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-300 font-medium mb-1">
                Start the backend server to enable communication:
              </p>
              <code className="block text-xs bg-slate-900 p-2 rounded font-mono text-amber-200">
                cd scripts && ./start.sh
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
