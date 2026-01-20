import {
  Shield,
  Layers,
  Network,
  AlertTriangle,
  Target,
  ClipboardCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Monitor,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useLabEnvironment } from '../contexts/LabEnvironmentContext';
import { usePlcConnection } from '../hooks/usePlcConnection';
import type { ViewType } from '../App';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { zones, devices, firewallRules, assessment } = useLabEnvironment();
  const { connectionStatus, plcStates } = usePlcConnection();

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const enabledRules = firewallRules.filter(r => r.enabled).length;

  const quickActions = [
    { id: 'attraction-hmi', label: 'Open Live HMI', icon: Monitor, color: 'cyan' },
    { id: 'purdue-model', label: 'View Purdue Model', icon: Layers, color: 'emerald' },
    { id: 'scenario-simulator', label: 'Run Attack Test', icon: Target, color: 'amber' },
    { id: 'iec-62443', label: 'Check Compliance', icon: ClipboardCheck, color: 'blue' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Monitor size={24} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Attraction Control Lab</h2>
              <p className="text-sm text-slate-400">
                {connectionStatus === 'connected' ? (
                  <span className="text-emerald-400">Connected to PLCs - Live data available</span>
                ) : connectionStatus === 'connecting' ? (
                  <span className="text-amber-400">Connecting to backend...</span>
                ) : (
                  <span className="text-slate-400">Start backend with ./run.sh to enable live data</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open('/EXPLOIT_HELP.html', '_blank')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 text-sm"
            >
              <BookOpen size={16} />
              Documentation
              <ExternalLink size={12} />
            </button>
            <button
              onClick={() => onNavigate('attraction-hmi')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors text-white font-medium text-sm"
            >
              <Monitor size={16} />
              Open Live HMI
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Security Level"
          value={`SL ${assessment.iec62443.overallLevel}`}
          subtitle="IEC 62443"
          icon={Shield}
          color="cyan"
          trend={+5}
        />
        <StatCard
          title="Active Zones"
          value={zones.length.toString()}
          subtitle="Configured"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Devices Online"
          value={`${onlineDevices}/${devices.length}`}
          subtitle="Connected"
          icon={Network}
          color="blue"
        />
        <StatCard
          title="Firewall Rules"
          value={enabledRules.toString()}
          subtitle="Active"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Architecture Overview</h2>
            <div className="space-y-3">
              {zones.slice(0, 6).map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => onNavigate('zone-editor')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{zone.name}</p>
                      <p className="text-xs text-slate-400">
                        {devices.filter(d => d.zoneId === zone.id).length} devices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">SL {zone.securityLevel}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      zone.securityLevel >= 3 ? 'bg-emerald-500' : zone.securityLevel >= 2 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Security Assessment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-400">IEC 62443 Levels</h3>
                {[
                  { label: 'SL 1 - Basic', value: assessment.iec62443.sl1 },
                  { label: 'SL 2 - Enhanced', value: assessment.iec62443.sl2 },
                  { label: 'SL 3 - Significant', value: assessment.iec62443.sl3 },
                  { label: 'SL 4 - Critical', value: assessment.iec62443.sl4 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white">{value}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-400">NIST CSF Functions</h3>
                {[
                  { label: 'Identify', value: assessment.nistCsf.identify },
                  { label: 'Protect', value: assessment.nistCsf.protect },
                  { label: 'Detect', value: assessment.nistCsf.detect },
                  { label: 'Respond', value: assessment.nistCsf.respond },
                  { label: 'Recover', value: assessment.nistCsf.recover },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white">{value}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border border-transparent hover:border-${color}-500/20 bg-slate-800/50 hover:bg-${color}-500/10`}
                >
                  <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                    <Icon size={18} className={`text-${color}-400`} />
                  </div>
                  <span className="text-sm text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Top Gaps</h2>
            <div className="space-y-3">
              {assessment.gaps.slice(0, 4).map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300">{gap}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('gap-analysis')}
              className="w-full mt-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View Full Analysis
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">PLC Status (Live)</h2>
            <div className="space-y-3">
              {[
                { label: 'Main PLC', port: 502, connected: plcStates.main.connected },
                { label: 'Safety PLC', port: 503, connected: plcStates.safety.connected },
                { label: 'Effects PLC', port: 504, connected: plcStates.effects.connected },
              ].map(({ label, port, connected }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-xs text-slate-600 ml-2">:{port}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {connected ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : connectionStatus === 'connecting' ? (
                      <AlertCircle size={14} className="text-amber-400" />
                    ) : (
                      <XCircle size={14} className="text-slate-500" />
                    )}
                    <span className={`text-xs ${
                      connected ? 'text-emerald-400' : connectionStatus === 'connecting' ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {connected ? 'online' : connectionStatus === 'connecting' ? 'connecting' : 'offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">WebSocket</span>
                <span className={connectionStatus === 'connected' ? 'text-emerald-400' : 'text-slate-500'}>
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'cyan' | 'emerald' | 'blue' | 'amber';
  trend?: number;
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-500 bg-cyan-500/10 text-cyan-400',
    emerald: 'from-emerald-500 to-teal-500 bg-emerald-500/10 text-emerald-400',
    blue: 'from-blue-500 to-indigo-500 bg-blue-500/10 text-blue-400',
    amber: 'from-amber-500 to-orange-500 bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color].split(' ')[2]}`}>
          <Icon size={20} className={colors[color].split(' ')[3]} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          <TrendingUp size={14} className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <span className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last assessment
          </span>
        </div>
      )}
    </div>
  );
}
