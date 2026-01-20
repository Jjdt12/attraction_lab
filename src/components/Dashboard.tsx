import {
  Layers,
  GraduationCap,
  AlertTriangle,
  Target,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Monitor,
  ExternalLink,
  BookOpen,
  Crosshair,
  ChevronRight,
  Play,
} from 'lucide-react';
import { usePlcConnection } from '../hooks/usePlcConnection';
import type { ViewType } from '../App';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

interface TrainingModule {
  id: ViewType;
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  topics: string[];
  status: 'not-started' | 'in-progress' | 'completed';
}

const trainingModules: TrainingModule[] = [
  {
    id: 'architecture-training',
    number: 1,
    title: 'Architecture Fundamentals',
    description: 'Learn about zones, conduits, segmentation, and the Purdue model for industrial networks.',
    icon: Layers,
    topics: ['Purdue Model Levels', 'Zone Segmentation', 'IDMZ Design', 'Network Topology'],
    status: 'not-started',
  },
  {
    id: 'security-training',
    number: 2,
    title: 'Security Controls',
    description: 'Configure firewalls, protocol filters, access controls, and authentication mechanisms.',
    icon: GraduationCap,
    topics: ['Firewall Rules', 'Protocol Filtering', 'Access Control Lists', 'Authentication'],
    status: 'not-started',
  },
  {
    id: 'sis-protection',
    number: 3,
    title: 'Safety Systems',
    description: 'Understand Safety Instrumented Systems, fail-safe design, and redundancy patterns.',
    icon: AlertTriangle,
    topics: ['SIS Protection', 'Fail-Safe Design', 'TRITON Attack', 'Redundancy Config'],
    status: 'not-started',
  },
  {
    id: 'scenario-simulator',
    number: 4,
    title: 'Attack & Defense',
    description: 'Simulate real-world attack scenarios and test how your defenses hold up.',
    icon: Target,
    topics: ['Attack Scenarios', 'Lateral Movement', 'Protocol Attacks', 'Latency Impact'],
    status: 'not-started',
  },
  {
    id: 'iec-62443',
    number: 5,
    title: 'Compliance & Standards',
    description: 'Assess your architecture against IEC 62443 and NIST CSF frameworks.',
    icon: ClipboardCheck,
    topics: ['IEC 62443 Levels', 'NIST CSF Functions', 'Gap Analysis', 'Recommendations'],
    status: 'not-started',
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { connectionStatus, plcStates } = usePlcConnection();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome to the ICS Security Training Lab</h2>
            <p className="text-slate-400 text-sm max-w-2xl mb-4">
              This interactive lab teaches you how to design and secure industrial control systems.
              Work through the 5 training modules below, then test your skills with the Defense Tester.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('architecture-training')}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors text-white font-medium text-sm"
              >
                <Play size={16} />
                Start Learning
              </button>
              <button
                onClick={() => window.open('/EXPLOIT_HELP.html', '_blank')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 text-sm"
              >
                <BookOpen size={16} />
                Documentation
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
          <div className="hidden lg:block ml-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2 font-medium">Live Simulator</div>
              <div className="flex items-center gap-3 mb-3">
                <Monitor size={24} className="text-cyan-400" />
                <div>
                  <p className="text-sm text-white font-medium">Attraction Control System</p>
                  <p className="text-xs text-slate-500">
                    {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('attraction-hmi')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 text-sm"
              >
                <Monitor size={14} />
                Open Simulator
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Training Modules</h3>
          <span className="text-xs text-slate-500">Complete all 5 modules to master ICS security</span>
        </div>
        <div className="space-y-3">
          {trainingModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onStart={() => onNavigate(module.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Validate Your Skills</h3>
            <Crosshair size={20} className="text-amber-400" />
          </div>
          <p className="text-sm text-slate-400 mb-4">
            After completing the training modules, test your security configurations against
            simulated attacks to see how well your defenses hold up.
          </p>
          <button
            onClick={() => onNavigate('defense-validator')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors text-amber-400 font-medium text-sm"
          >
            <Crosshair size={16} />
            Launch Defense Tester
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">PLC Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Main PLC', port: 502, connected: plcStates.main.connected },
              { label: 'Safety PLC', port: 503, connected: plcStates.safety.connected },
              { label: 'Effects PLC', port: 504, connected: plcStates.effects.connected },
            ].map(({ label, port, connected }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <span className="text-sm text-white">{label}</span>
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
              <span className="text-slate-500">WebSocket Connection</span>
              <span className={connectionStatus === 'connected' ? 'text-emerald-400' : connectionStatus === 'connecting' ? 'text-amber-400' : 'text-slate-500'}>
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reference Library</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'glossary' as ViewType, label: 'Glossary', desc: 'ICS terminology' },
            { id: 'protocol-reference' as ViewType, label: 'Protocol Reference', desc: 'Technical specs' },
            { id: 'saic-vs-cia' as ViewType, label: 'SAIC vs CIA', desc: 'Priority comparison' },
            { id: 'interview-mode' as ViewType, label: 'Interview Prep', desc: 'Practice explaining' },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <p className="text-sm text-white group-hover:text-cyan-400 transition-colors">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: TrainingModule;
  onStart: () => void;
}

function ModuleCard({ module, onStart }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <div
      onClick={onStart}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-cyan-400">Module {module.number}</span>
          </div>
          <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">{module.title}</h4>
          <p className="text-sm text-slate-400 mt-1">{module.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {module.topics.map((topic) => (
              <span key={topic} className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
                {topic}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-2" />
      </div>
    </div>
  );
}
