import {
  LayoutDashboard,
  Wrench,
  TrendingUp,
  AlertCircle,
  Network,
  BookOpen,
  Activity,
  Shield
} from 'lucide-react';

export type TabType = 'overview' | 'diagnostics' | 'trends' | 'alarms' | 'network' | 'docs' | 'events' | 'security';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Wrench className="h-4 w-4" /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'alarms', label: 'Alarms', icon: <AlertCircle className="h-4 w-4" /> },
    { id: 'events', label: 'Event Log', icon: <Activity className="h-4 w-4" /> },
    { id: 'network', label: 'Network', icon: <Network className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'docs', label: 'Docs', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 bg-slate-900/50 p-1 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
