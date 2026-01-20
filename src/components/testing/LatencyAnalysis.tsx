import { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface LatencyMetric {
  name: string;
  baseline: number;
  current: number;
  threshold: number;
  unit: string;
  category: 'network' | 'security' | 'process';
}

interface SecurityControl {
  id: string;
  name: string;
  enabled: boolean;
  latencyImpact: number;
}

const securityControls: SecurityControl[] = [
  { id: 'firewall', name: 'Deep Packet Inspection', enabled: true, latencyImpact: 2.5 },
  { id: 'ids', name: 'Intrusion Detection', enabled: true, latencyImpact: 1.8 },
  { id: 'encryption', name: 'TLS Encryption', enabled: false, latencyImpact: 5.2 },
  { id: 'logging', name: 'Full Packet Logging', enabled: false, latencyImpact: 3.1 },
  { id: 'filtering', name: 'Protocol Filtering', enabled: true, latencyImpact: 0.8 },
  { id: 'validation', name: 'Message Validation', enabled: true, latencyImpact: 1.2 },
];

export function LatencyAnalysis() {
  const [controls, setControls] = useState<SecurityControl[]>(securityControls);
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState<LatencyMetric[]>([
    { name: 'Network Round Trip', baseline: 5, current: 5, threshold: 20, unit: 'ms', category: 'network' },
    { name: 'Firewall Processing', baseline: 0, current: 0, threshold: 10, unit: 'ms', category: 'security' },
    { name: 'PLC Scan Time', baseline: 50, current: 50, threshold: 100, unit: 'ms', category: 'process' },
    { name: 'HMI Update Rate', baseline: 100, current: 100, threshold: 250, unit: 'ms', category: 'process' },
    { name: 'Safety Response', baseline: 10, current: 10, threshold: 50, unit: 'ms', category: 'process' },
  ]);

  useEffect(() => {
    const totalLatency = controls
      .filter(c => c.enabled)
      .reduce((sum, c) => sum + c.latencyImpact, 0);

    setMetrics(prev => prev.map(m => {
      if (m.category === 'security') {
        return { ...m, current: totalLatency };
      } else if (m.category === 'network') {
        return { ...m, current: m.baseline + totalLatency * 0.3 };
      } else {
        return { ...m, current: m.baseline + totalLatency * 0.2 };
      }
    }));
  }, [controls]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        current: m.current + (Math.random() - 0.5) * 2,
      })));
    }, 500);

    return () => clearInterval(interval);
  }, [running]);

  const toggleControl = (id: string) => {
    setControls(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const getTotalLatency = () => {
    return controls.filter(c => c.enabled).reduce((sum, c) => sum + c.latencyImpact, 0);
  };

  const getMetricStatus = (metric: LatencyMetric) => {
    const percentage = (metric.current / metric.threshold) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const overallHealthy = metrics.every(m => getMetricStatus(m) !== 'critical');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Security Latency</p>
          <p className="text-2xl font-bold text-white">{getTotalLatency().toFixed(1)}ms</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Active Controls</p>
          <p className="text-2xl font-bold text-cyan-400">
            {controls.filter(c => c.enabled).length}/{controls.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Timing Status</p>
          <div className="flex items-center gap-2">
            {overallHealthy ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">OK</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-red-400" />
                <span className="text-red-400 font-semibold">At Risk</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Simulation</p>
          <button
            onClick={() => setRunning(!running)}
            className={`flex items-center gap-2 ${running ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {running ? <Pause size={20} /> : <Play size={20} />}
            <span className="font-semibold">{running ? 'Running' : 'Stopped'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Security Controls</h3>
          <p className="text-xs text-slate-400 mb-4">
            Toggle security controls to see their impact on system latency. Balance security vs timing requirements.
          </p>

          <div className="space-y-3">
            {controls.map((control) => (
              <div
                key={control.id}
                className={`p-3 rounded-lg border transition-all ${
                  control.enabled
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{control.name}</p>
                    <p className="text-xs text-slate-400">+{control.latencyImpact}ms latency</p>
                  </div>
                  <button
                    onClick={() => toggleControl(control.id)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      control.enabled
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {control.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Timing Metrics</h3>

          <div className="space-y-4">
            {metrics.map((metric) => {
              const status = getMetricStatus(metric);
              const percentage = Math.min(100, (metric.current / metric.threshold) * 100);

              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${
                        status === 'critical' ? 'text-red-400' :
                        status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {metric.current.toFixed(1)}{metric.unit}
                      </span>
                      <span className="text-xs text-slate-500">/ {metric.threshold}{metric.unit}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'critical' ? 'bg-red-500' :
                        status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">ICS Timing Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Safety Response',
              requirement: '< 50ms',
              note: 'SIS must respond faster than process dynamics',
              color: 'red',
            },
            {
              title: 'Control Loop',
              requirement: '< 100ms',
              note: 'PLC scan time for closed-loop control',
              color: 'amber',
            },
            {
              title: 'HMI Update',
              requirement: '< 250ms',
              note: 'Operator display refresh rate',
              color: 'cyan',
            },
            {
              title: 'Historian',
              requirement: '< 1000ms',
              note: 'Data logging latency tolerance',
              color: 'emerald',
            },
          ].map(({ title, requirement, note, color }) => (
            <div key={title} className={`p-4 bg-${color}-500/5 border border-${color}-500/20 rounded-lg`}>
              <h4 className={`text-sm font-medium text-${color}-400 mb-1`}>{title}</h4>
              <p className="text-lg font-bold text-white mb-1">{requirement}</p>
              <p className="text-xs text-slate-400">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-400 mb-2">Important Consideration</h4>
            <p className="text-sm text-slate-300">
              Adding security controls introduces latency that may impact real-time process control.
              Always verify that your security architecture meets timing requirements for:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li>Safety Instrumented Systems (SIS) response times</li>
              <li>PLC scan cycle times</li>
              <li>Control loop performance</li>
              <li>Operator interface responsiveness</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
