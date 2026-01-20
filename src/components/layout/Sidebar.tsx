import {
  LayoutDashboard,
  Layers,
  Shield,
  Network,
  Grid3X3,
  Flame,
  Lock,
  Key,
  UserCheck,
  AlertTriangle,
  ToggleLeft,
  ShieldAlert,
  GitBranch,
  Target,
  Route,
  Zap,
  Timer,
  ClipboardCheck,
  FileCheck,
  Search,
  Lightbulb,
  Scale,
  BookOpen,
  HelpCircle,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import type { ViewType } from '../../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'attraction-hmi', label: 'Attraction HMI', icon: <Monitor size={18} /> },
    ],
  },
  {
    title: 'Architecture',
    items: [
      { id: 'purdue-model', label: 'Purdue Model', icon: <Layers size={18} /> },
      { id: 'idmz-designer', label: 'IDMZ Designer', icon: <Shield size={18} /> },
      { id: 'network-topology', label: 'Network Topology', icon: <Network size={18} /> },
      { id: 'zone-editor', label: 'Zone Editor', icon: <Grid3X3 size={18} /> },
    ],
  },
  {
    title: 'Security Controls',
    items: [
      { id: 'firewall-manager', label: 'Firewall Rules', icon: <Flame size={18} /> },
      { id: 'protocol-security', label: 'Protocol Security', icon: <Lock size={18} /> },
      { id: 'access-control', label: 'Access Control', icon: <Key size={18} /> },
      { id: 'authentication', label: 'Authentication', icon: <UserCheck size={18} /> },
    ],
  },
  {
    title: 'Safety Systems',
    items: [
      { id: 'sis-protection', label: 'SIS Protection', icon: <AlertTriangle size={18} /> },
      { id: 'fail-safe', label: 'Fail-Safe Simulator', icon: <ToggleLeft size={18} /> },
      { id: 'triton-defense', label: 'TRITON Defense', icon: <ShieldAlert size={18} /> },
      { id: 'redundancy', label: 'Redundancy Config', icon: <GitBranch size={18} /> },
    ],
  },
  {
    title: 'Attack Testing',
    items: [
      { id: 'scenario-simulator', label: 'Scenario Simulator', icon: <Target size={18} /> },
      { id: 'lateral-movement', label: 'Lateral Movement', icon: <Route size={18} /> },
      { id: 'protocol-attack', label: 'Protocol Attack', icon: <Zap size={18} /> },
      { id: 'latency-analysis', label: 'Latency Analysis', icon: <Timer size={18} /> },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { id: 'iec-62443', label: 'IEC 62443', icon: <ClipboardCheck size={18} /> },
      { id: 'nist-csf', label: 'NIST CSF', icon: <FileCheck size={18} /> },
      { id: 'gap-analysis', label: 'Gap Analysis', icon: <Search size={18} /> },
      { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb size={18} /> },
    ],
  },
  {
    title: 'Education',
    items: [
      { id: 'saic-vs-cia', label: 'SAIC vs CIA', icon: <Scale size={18} /> },
      { id: 'protocol-reference', label: 'Protocol Reference', icon: <BookOpen size={18} /> },
      { id: 'glossary', label: 'Glossary', icon: <HelpCircle size={18} /> },
      { id: 'interview-mode', label: 'Interview Mode', icon: <Presentation size={18} /> },
    ],
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">ICS Security</h1>
              <p className="text-[10px] text-slate-400">Engineering Lab</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <h2 className="px-4 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sm ${
                      currentView === item.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={currentView === item.id ? 'text-cyan-400' : ''}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {!collapsed && (
          <div className="text-[10px] text-slate-500 text-center">
            Security Engineering Lab v2.0
          </div>
        )}
      </div>
    </aside>
  );
}
