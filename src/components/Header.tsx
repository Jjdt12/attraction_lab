import { FlaskConical, Circle, Activity, Trophy, ChevronDown, ChevronUp, FileText, Terminal, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import CTFChallenges from './CTFChallenges';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  wsConnected: boolean;
  plcConnected: boolean;
  plcHost: string | null;
  plcPort: number | null;
  sessionId: string | null;
}

export default function Header({ wsConnected, plcConnected, plcHost, plcPort, sessionId }: HeaderProps) {
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const allConnected = wsConnected && plcConnected;

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Attraction Technology Lab
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              ) : (
                <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              )}
            </button>
            <a
              href="/ATTRACTION_DOCS.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Attraction Documentation</span>
            </a>

            <a
              href="/EXPLOIT_HELP.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Terminal className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-900 dark:text-red-300">Help</span>
            </a>

            <button
              onClick={() => setShowChallenges(!showChallenges)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">CTF Challenges</span>
              {showChallenges ? (
                <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            <button
              onClick={() => setShowConnectionDetails(!showConnectionDetails)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                allConnected
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              <Circle
                className={`w-3 h-3 ${
                  allConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                }`}
              />
              <span className={`text-sm font-semibold ${
                allConnected ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
              }`}>
                {allConnected ? 'Connected' : 'Disconnected'}
              </span>
              {showConnectionDetails ? (
                <ChevronUp className={`w-4 h-4 ${allConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${allConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              )}
            </button>
          </div>
        </div>

        {showConnectionDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Connection Status</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WebSocket Server</span>
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`w-2 h-2 ${
                        wsConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                      }`}
                    />
                    <span className={`text-sm font-medium ${wsConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {wsConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {import.meta.env.VITE_WS_URL || 'ws://localhost:8765'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PLC Modbus</span>
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`w-2 h-2 ${
                        plcConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                      }`}
                    />
                    <span className={`text-sm font-medium ${plcConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {plcConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {plcHost && plcPort ? `${plcHost}:${plcPort}` : 'Not configured'}
                </div>
              </div>
            </div>

            {!wsConnected && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Start the server with:
                </p>
                <code className="block mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded font-mono text-yellow-900 dark:text-yellow-200">
                  cd scripts && ./start.sh
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {showChallenges && (
        <div className="mb-6">
          <CTFChallenges sessionId={sessionId} />
        </div>
      )}
    </>
  );
}
