import { useState, useEffect } from 'react';
import { Terminal, Play, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

const DEFAULT_ATTACK_CODE = `# Coil Override Attack
# Challenge: Write TRUE to coil address 3

print("[*] Starting Coil Override attack...")
print("[*] Target: Coil Address 3")
print("[*] Action: Write TRUE")

# Execute the write (must use await since it's async)
result = await write_coil(3, True)

if result.get('success'):
    print("[SUCCESS] Coil 3 set to TRUE!")
    print("[INFO] Check CTF Challenges panel for completion")
else:
    print(f"[ERROR] Failed: {result.get('error', 'Unknown error')}")
`;

interface AttackConsoleProps {
  wsConnected: boolean;
  pythonReady: boolean;
  pythonError: string | null;
  isExecuting: boolean;
  onExecute: (code: string) => Promise<void>;
}

export default function AttackConsole({
  wsConnected,
  pythonReady,
  pythonError,
  isExecuting,
  onExecute
}: AttackConsoleProps) {
  const [code, setCode] = useState(DEFAULT_ATTACK_CODE);
  const [output, setOutput] = useState('Python runtime loading...\nOnce ready, you can execute attack scripts.\n');

  useEffect(() => {
    if (pythonReady) {
      setOutput('[Python Ready] Runtime initialized successfully.\n[Info] You can now execute Python attack scripts.\n');
    } else if (pythonError) {
      setOutput(`[ERROR] Failed to load Python runtime.\n\n${pythonError}\n\nPlease check the browser console for more details.`);
    }
  }, [pythonReady, pythonError]);

  const handleRun = async () => {
    if (!wsConnected) {
      setOutput(prev => prev + '\n[ERROR] WebSocket not connected!\n');
      setOutput(prev => prev + '[INFO] Start the simulation first.\n');
      return;
    }

    if (!pythonReady) {
      setOutput(prev => prev + '\n[ERROR] Python runtime not ready yet!\n');
      return;
    }

    setOutput('[*] Executing Python script...\n\n');

    try {
      const result = await onExecute(code);

      if (result.success) {
        setOutput(prev => prev + result.output + '\n\n[STATUS] Execution completed successfully.\n');
      } else {
        setOutput(prev => prev + `[ERROR] ${result.error}\n`);
      }
    } catch (error: any) {
      setOutput(prev => prev + `\n[ERROR] Execution failed: ${error.message}\n`);
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_ATTACK_CODE);
    setOutput('Ready to execute attack script...\n');
  };

  const updateOutput = (newOutput: string, isError: boolean = false) => {
    setOutput(prev => {
      const prefix = isError ? '[ERROR] ' : '';
      return prev + prefix + newOutput + '\n';
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Attack Console</h2>
            {pythonReady ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/50 rounded-md">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300">Python Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-900/50 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-300">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isExecuting}
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleRun}
              disabled={!wsConnected || !pythonReady || isExecuting}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isExecuting ? 'Executing...' : 'Run Attack'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Attack Script (Python)
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 px-4 py-3 bg-slate-900 text-green-400 font-mono text-sm rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            spellCheck={false}
            placeholder="# Write your Python attack script here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Output Console
          </label>
          <div className="w-full h-48 px-4 py-3 bg-slate-900 text-slate-300 font-mono text-sm rounded-lg border border-slate-700 overflow-y-auto whitespace-pre-wrap">
            {output}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Available Python API</h3>
          <div className="space-y-1 text-xs text-blue-800 font-mono">
            <div><span className="text-blue-600">write_coil(address, value)</span> - Write to a coil (returns dict with 'success' and optional 'error')</div>
            <div className="text-blue-600 mt-2">Example:</div>
            <div className="pl-4 text-blue-700">result = write_coil(3, True)</div>
            <div className="pl-4 text-blue-700">if result.get('success'): print("Success!")</div>
          </div>
        </div>
      </div>
    </div>
  );
}
