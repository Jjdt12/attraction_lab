import {
  LayoutDashboard,
  Layers,
  Shield,
  ChevronLeft,
  ChevronRight,
  Monitor,
  GraduationCap,
  Crosshair,
  BookOpen,
  HelpCircle,
  Presentation,
  Scale,
  AlertTriangle,
  Target,
  ClipboardCheck,
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
  moduleNumber?: number;
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'attraction-hmi', label: 'Attraction Simulator', icon: <Monitor size={18} /> },
    ],
  },
  {
    title: 'Training Modules',
    items: [
      { id: 'architecture-training', label: 'Architecture Fundamentals', icon: <Layers size={18} />, moduleNumber: 1 },
      { id: 'security-training', label: 'Security Controls', icon: <GraduationCap size={18} />, moduleNumber: 2 },
      { id: 'sis-protection', label: 'Safety Systems', icon: <AlertTriangle size={18} />, moduleNumber: 3 },
      { id: 'scenario-simulator', label: 'Attack & Defense', icon: <Target size={18} />, moduleNumber: 4 },
      { id: 'iec-62443', label: 'Compliance & Standards', icon: <ClipboardCheck size={18} />, moduleNumber: 5 },
    ],
  },
  {
    title: 'Validate Your Skills',
    items: [
      { id: 'defense-validator', label: 'Defense Tester', icon: <Crosshair size={18} /> },
    ],
  },
  {
    title: 'Reference Library',
    items: [
      { id: 'glossary', label: 'Glossary', icon: <HelpCircle size={18} /> },
      { id: 'protocol-reference', label: 'Protocol Reference', icon: <BookOpen size={18} /> },
      { id: 'saic-vs-cia', label: 'SAIC vs CIA', icon: <Scale size={18} /> },
      { id: 'interview-mode', label: 'Interview Prep', icon: <Presentation size={18} /> },
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
              <p className="text-[10px] text-slate-400">Training Lab</p>
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
                    <span className={`relative ${currentView === item.id ? 'text-cyan-400' : ''}`}>
                      {item.icon}
                      {item.moduleNumber && !collapsed && (
                        <span className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-slate-700 rounded-full text-[9px] font-bold flex items-center justify-center text-slate-300">
                          {item.moduleNumber}
                        </span>
                      )}
                    </span>
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
            Security Training Lab v2.0
          </div>
        )}
      </div>
    </aside>
  );
}
