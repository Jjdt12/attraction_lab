import { useState } from 'react';
import {
  Route,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ArrowRight,
  Server,
  Lock,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface PathSegment {
  from: string;
  to: string;
  blocked: boolean;
  blockingRule: string | null;
}

interface TestResult {
  startZone: string;
  targetZone: string;
  reachable: boolean;
  path: PathSegment[];
  vulnerabilities: string[];
}

export function LateralMovementTest() {
  const { zones, firewallRules, devices } = useLabEnvironment();
  const [startZone, setStartZone] = useState<string>('');
  const [targetZone, setTargetZone] = useState<string>('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTest = () => {
    if (!startZone || !targetZone) return;

    setTesting(true);

    setTimeout(() => {
      const path: PathSegment[] = [];
      const blockedRules = firewallRules.filter(
        r => r.enabled && r.action === 'deny' &&
        ((r.sourceZone === startZone && r.destZone === targetZone) ||
         (r.sourceZone === 'z0' && r.destZone.startsWith('z')))
      );

      const hasIdmz = zones.some(z => z.id === 'idmz');
      const startLevel = zones.find(z => z.id === startZone)?.level || 0;
      const targetLevel = zones.find(z => z.id === targetZone)?.level || 0;

      const crossingIdmz = startLevel > 3 && targetLevel <= 3;
      const blocked = blockedRules.length > 0 || (crossingIdmz && hasIdmz);

      path.push({
        from: zones.find(z => z.id === startZone)?.name || startZone,
        to: hasIdmz && crossingIdmz ? 'IDMZ' : zones.find(z => z.id === targetZone)?.name || targetZone,
        blocked: crossingIdmz && hasIdmz,
        blockingRule: crossingIdmz && hasIdmz ? 'IDMZ Boundary' : null,
      });

      if (!blocked) {
        path.push({
          from: hasIdmz ? 'IDMZ' : zones.find(z => z.id === startZone)?.name || startZone,
          to: zones.find(z => z.id === targetZone)?.name || targetZone,
          blocked: blockedRules.length > 0,
          blockingRule: blockedRules[0]?.name || null,
        });
      }

      const vulnerabilities: string[] = [];
      if (!hasIdmz && crossingIdmz) {
        vulnerabilities.push('No IDMZ separating IT from OT networks');
      }
      if (blockedRules.length === 0 && startZone !== targetZone) {
        vulnerabilities.push('No deny rules between source and target zones');
      }
      if (startLevel > targetLevel && !blocked) {
        vulnerabilities.push('Unrestricted downward network path');
      }

      setResults(prev => [
        ...prev,
        {
          startZone,
          targetZone,
          reachable: !blocked,
          path,
          vulnerabilities,
        },
      ]);

      setTesting(false);
    }, 1500);
  };

  const getZoneName = (id: string) => zones.find(z => z.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Lateral Movement Path Test</h3>
        <p className="text-sm text-slate-400 mb-6">
          Test whether an attacker could move from one zone to another. This simulates ransomware
          or other malware attempting to spread from compromised systems.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Start Zone (Attacker Position)</label>
            <select
              value={startZone}
              onChange={(e) => setStartZone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Select zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center">
            <ArrowRight size={24} className="text-slate-600 mb-2" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Target Zone</label>
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Select zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={runTest}
            disabled={!startZone || !targetZone || testing}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Testing Path...</span>
              </>
            ) : (
              <>
                <Route size={18} />
                <span>Test Lateral Movement</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Tests Run</p>
          <p className="text-2xl font-bold text-white">{results.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Paths Blocked</p>
          <p className="text-2xl font-bold text-emerald-400">
            {results.filter(r => !r.reachable).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Paths Open</p>
          <p className="text-2xl font-bold text-red-400">
            {results.filter(r => r.reachable).length}
          </p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Test Results</h3>
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  result.reachable
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {result.reachable ? (
                      <AlertTriangle size={20} className="text-red-400" />
                    ) : (
                      <Shield size={20} className="text-emerald-400" />
                    )}
                    <div>
                      <span className={`font-medium ${result.reachable ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.reachable ? 'PATH REACHABLE' : 'PATH BLOCKED'}
                      </span>
                      <p className="text-xs text-slate-400">
                        {getZoneName(result.startZone)} to {getZoneName(result.targetZone)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {result.path.map((segment, segIdx) => (
                    <div key={segIdx} className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-slate-800 rounded text-xs text-white">
                        {segment.from}
                      </div>
                      <div className="flex items-center">
                        {segment.blocked ? (
                          <Lock size={14} className="text-emerald-400" />
                        ) : (
                          <ArrowRight size={14} className="text-slate-500" />
                        )}
                      </div>
                      {segIdx === result.path.length - 1 && (
                        <div className={`px-3 py-1 rounded text-xs ${
                          segment.blocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-white'
                        }`}>
                          {segment.to}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {result.vulnerabilities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2">Vulnerabilities Found:</p>
                    <ul className="space-y-1">
                      {result.vulnerabilities.map((vuln, vIdx) => (
                        <li key={vIdx} className="text-xs text-amber-400 flex items-center gap-2">
                          <AlertTriangle size={12} />
                          {vuln}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Common Lateral Movement Techniques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Pass-the-Hash', desc: 'Credential theft and reuse', mitigation: 'Credential guard, MFA' },
            { title: 'Remote Services', desc: 'RDP, SSH, SMB exploitation', mitigation: 'Network segmentation' },
            { title: 'WMI/PowerShell', desc: 'Remote execution', mitigation: 'Script blocking, logging' },
            { title: 'Exploitation', desc: 'Unpatched vulnerabilities', mitigation: 'Patch management' },
          ].map(({ title, desc, mitigation }) => (
            <div key={title} className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
              <p className="text-xs text-slate-400 mb-2">{desc}</p>
              <p className="text-xs text-cyan-400">Mitigate: {mitigation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
