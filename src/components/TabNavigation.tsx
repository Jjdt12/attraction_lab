import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  TrendingUp,
  AlertCircle,
  Network,
  BookOpen,
  Activity
} from 'lucide-react';

export type TabType = 'overview' | 'diagnostics' | 'trends' | 'alarms' | 'network' | 'docs' | 'events';

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
    { id: 'docs', label: 'Documentation', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
