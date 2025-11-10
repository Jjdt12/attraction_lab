import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface CoilStatusProps {
  flashLight: boolean;
  coilStates: boolean[];
}

interface CoilItemProps {
  address: number;
  label: string;
  description: string;
  value: boolean;
  color?: 'green' | 'amber' | 'blue' | 'slate';
}

type PLCTab = 'MAIN' | 'SAFETY' | 'EFFECTS';

function CoilItem({ address, label, description, value, color = 'slate' }: CoilItemProps) {
  const colorClasses = {
    green: {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/50',
    },
    amber: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500',
      shadow: 'shadow-amber-500/50',
    },
    blue: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500',
      shadow: 'shadow-blue-500/50',
    },
    slate: {
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-500',
      shadow: 'shadow-slate-500/50',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all min-h-[60px] group relative"
      title={description}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${value ? `${colors.bg} shadow-lg ${colors.shadow}` : 'bg-slate-300 dark:bg-slate-600'}`} />
        <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      </div>
      <span className={`text-xs font-mono font-semibold ${value ? colors.text : 'text-slate-400 dark:text-slate-500'}`}>
        {value ? 'ON' : 'OFF'}
      </span>
      <div className="absolute hidden group-hover:block bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
        {description}
      </div>
    </div>
  );
}

// Coil definitions for each PLC
const COIL_DEFINITIONS: Record<PLCTab, { address: number; label: string; description: string }[]> = {
  MAIN: [
    { address: 0, label: 'Master', description: 'Master Enable' },
    { address: 1, label: 'Start', description: 'Start Command' },
    { address: 2, label: 'Stop', description: 'Stop Command' },
    { address: 3, label: 'E-Stop', description: 'Emergency Stop Button' },
    { address: 4, label: 'Gate', description: 'Safety Gate Closed' },
    { address: 5, label: 'Zone 1', description: 'Zone 1 Enable' },
    { address: 6, label: 'Zone 2', description: 'Zone 2 Enable' },
    { address: 7, label: 'Zone 3', description: 'Zone 3 Enable' },
    { address: 8, label: 'Evt1 En', description: 'Event 1 Enable (Loading Gate)' },
    { address: 9, label: 'Evt2 En', description: 'Event 2 Enable (Safety Interlock)' },
    { address: 10, label: 'Evt3 En', description: 'Event 3 Enable (Launch Accelerator)' },
    { address: 11, label: 'Evt4 En', description: 'Event 4 Enable (Photo Flash)' },
    { address: 12, label: 'Evt5 En', description: 'Event 5 Enable (Mid-Course Brake)' },
    { address: 13, label: 'Evt6 En', description: 'Event 6 Enable (Track Switch)' },
    { address: 14, label: 'Evt7 En', description: 'Event 7 Enable (Final Brake)' },
    { address: 15, label: 'Evt8 En', description: 'Event 8 Enable (Station Approach)' },
    { address: 16, label: 'Evt9 En', description: 'Event 9 Enable (Unload Platform)' },
    { address: 17, label: 'Evt1', description: 'Event 1 Active' },
    { address: 18, label: 'Evt2', description: 'Event 2 Active' },
    { address: 19, label: 'Evt3', description: 'Event 3 Active' },
    { address: 20, label: 'Evt4', description: 'Event 4 Active' },
    { address: 21, label: 'Evt5', description: 'Event 5 Active' },
    { address: 22, label: 'Evt6', description: 'Event 6 Active' },
    { address: 23, label: 'Evt7', description: 'Event 7 Active' },
    { address: 24, label: 'Evt8', description: 'Event 8 Active' },
    { address: 25, label: 'Evt9', description: 'Event 9 Active' },
    { address: 26, label: 'Motor', description: 'Motor Running' },
    { address: 27, label: 'Brake', description: 'Brake Engaged' },
    { address: 28, label: 'Flash', description: 'Flash Light' },
    { address: 29, label: 'Alert', description: 'Alert Active' },
    { address: 30, label: 'Safety', description: 'Safety OK' },
    { address: 31, label: 'S-PLC', description: 'Safety PLC Ready' },
    { address: 32, label: 'E-PLC', description: 'Effects PLC Ready' },
  ],
  SAFETY: [
    { address: 0, label: 'Ready', description: 'Safety System Ready' },
    { address: 1, label: 'Evt1', description: 'Event 1: Loading Gate' },
    { address: 2, label: 'Evt2', description: 'Event 2: Safety Interlock' },
    { address: 3, label: 'Evt3', description: 'Event 3: Launch Accelerator' },
    { address: 4, label: 'Evt4', description: 'Event 4: Photo Flash' },
    { address: 5, label: 'Evt5', description: 'Event 5: Mid-Course Brake' },
    { address: 6, label: 'Evt6', description: 'Event 6: Track Switch' },
    { address: 7, label: 'Evt7', description: 'Event 7: Final Brake' },
    { address: 8, label: 'Evt8', description: 'Event 8: Station Approach' },
    { address: 9, label: 'Evt9', description: 'Event 9: Unload Platform' },
    { address: 10, label: 'Zone 1', description: 'Zone 1 Active' },
    { address: 11, label: 'Zone 2', description: 'Zone 2 Active' },
    { address: 12, label: 'Zone 3', description: 'Zone 3 Active' },
    { address: 13, label: 'E-Stop', description: 'Emergency Stop Status' },
    { address: 14, label: 'Gate', description: 'Gate Sensor' },
    { address: 15, label: 'Fault', description: 'Safety Fault Active' },
  ],
  EFFECTS: [
    { address: 0, label: 'Ready', description: 'Effects System Ready' },
    { address: 1, label: 'Light 1', description: 'Light Channel 1' },
    { address: 2, label: 'Light 2', description: 'Light Channel 2' },
    { address: 3, label: 'Light 3', description: 'Light Channel 3' },
    { address: 4, label: 'Light 4', description: 'Light Channel 4' },
    { address: 5, label: 'Sound 1', description: 'Sound Channel 1' },
    { address: 6, label: 'Sound 2', description: 'Sound Channel 2' },
    { address: 7, label: 'Sound 3', description: 'Sound Channel 3' },
    { address: 8, label: 'Smoke', description: 'Smoke Machine' },
    { address: 9, label: 'Strobe', description: 'Strobe Light' },
    { address: 10, label: 'Laser', description: 'Laser Effect' },
    { address: 11, label: 'Water', description: 'Water Effect' },
    { address: 12, label: 'Wind', description: 'Wind Effect' },
    { address: 13, label: 'Pyro', description: 'Pyrotechnic Effect' },
    { address: 14, label: 'Proj 1', description: 'Projector 1' },
    { address: 15, label: 'Proj 2', description: 'Projector 2' },
  ],
};

export default function CoilStatus({ flashLight, coilStates }: CoilStatusProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<PLCTab>('MAIN');

  const getTabColor = (tab: PLCTab) => {
    switch (tab) {
      case 'MAIN':
        return 'text-green-400 border-green-400';
      case 'SAFETY':
        return 'text-orange-400 border-orange-400';
      case 'EFFECTS':
        return 'text-purple-400 border-purple-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 px-6 py-4 hover:from-slate-700 hover:to-slate-600 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Modbus Coil States</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6">
          {/* PLC Tabs */}
          <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
            {(['MAIN', 'SAFETY', 'EFFECTS'] as PLCTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === tab
                    ? `${getTabColor(tab)} border-b-2`
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab} PLC
              </button>
            ))}
          </div>

          {/* Coil Grid */}
          <div className="grid grid-cols-6 gap-2">
            {COIL_DEFINITIONS[activeTab].map((coil) => (
              <CoilItem
                key={coil.address}
                address={coil.address}
                label={coil.label}
                description={coil.description}
                value={coilStates[coil.address] || false}
                color={coilStates[coil.address] ? "blue" : "slate"}
              />
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>{activeTab} PLC:</strong> {
                activeTab === 'MAIN' ? 'Main ride control system (Port 502)' :
                activeTab === 'SAFETY' ? 'Safety monitoring and interlocks (Port 503)' :
                'Show effects and lighting (Port 504)'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
