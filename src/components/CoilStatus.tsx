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
}

type PLCTab = 'MAIN' | 'SAFETY' | 'EFFECTS';

function CoilItem({ label, description, value }: CoilItemProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all min-h-[52px] group relative ${
        value
          ? 'bg-cyan-500/10 border-cyan-500/30'
          : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
      }`}
      title={description}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className={`w-2 h-2 rounded-full transition-all ${
          value ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-slate-600'
        }`} />
        <span className="text-xs font-mono font-bold text-white">{label}</span>
      </div>
      <span className={`text-[9px] font-mono font-medium ${value ? 'text-cyan-400' : 'text-slate-500'}`}>
        {value ? 'ON' : 'OFF'}
      </span>
      <div className="absolute hidden group-hover:block bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-10 border border-slate-700">
        {description}
      </div>
    </div>
  );
}

const COIL_DEFINITIONS: Record<PLCTab, { address: number; label: string; description: string }[]> = {
  MAIN: [
    { address: 0, label: '0', description: 'Master Enable' },
    { address: 1, label: '1', description: 'Start Command' },
    { address: 2, label: '2', description: 'Stop Command' },
    { address: 3, label: '3', description: 'Emergency Stop Button' },
    { address: 4, label: '4', description: 'Safety Gate Closed' },
    { address: 5, label: '5', description: 'Zone 1 Enable' },
    { address: 6, label: '6', description: 'Zone 2 Enable' },
    { address: 7, label: '7', description: 'Zone 3 Enable' },
    { address: 8, label: '8', description: 'Event 1 Enable (Loading Gate)' },
    { address: 9, label: '9', description: 'Event 2 Enable (Safety Interlock)' },
    { address: 10, label: '10', description: 'Event 3 Enable (Launch Accelerator)' },
    { address: 11, label: '11', description: 'Event 4 Enable (Photo Flash)' },
    { address: 12, label: '12', description: 'Event 5 Enable (Mid-Course Brake)' },
    { address: 13, label: '13', description: 'Event 6 Enable (Track Switch)' },
    { address: 14, label: '14', description: 'Event 7 Enable (Final Brake)' },
    { address: 15, label: '15', description: 'Event 8 Enable (Station Approach)' },
    { address: 16, label: '16', description: 'Event 9 Enable (Unload Platform)' },
    { address: 17, label: '17', description: 'Event 1 Active' },
    { address: 18, label: '18', description: 'Event 2 Active' },
    { address: 19, label: '19', description: 'Event 3 Active' },
    { address: 20, label: '20', description: 'Event 4 Active' },
    { address: 21, label: '21', description: 'Event 5 Active' },
    { address: 22, label: '22', description: 'Event 6 Active' },
    { address: 23, label: '23', description: 'Event 7 Active' },
    { address: 24, label: '24', description: 'Event 8 Active' },
    { address: 25, label: '25', description: 'Event 9 Active' },
    { address: 26, label: '26', description: 'Motor Running' },
    { address: 27, label: '27', description: 'Brake Engaged' },
    { address: 28, label: '28', description: 'Flash Light' },
    { address: 29, label: '29', description: 'Alert Active' },
    { address: 30, label: '30', description: 'Safety OK' },
    { address: 31, label: '31', description: 'Safety PLC Ready' },
    { address: 32, label: '32', description: 'Effects PLC Ready' },
  ],
  SAFETY: [
    { address: 0, label: '0', description: 'Safety System Ready' },
    { address: 1, label: '1', description: 'Event 1: Loading Gate' },
    { address: 2, label: '2', description: 'Event 2: Safety Interlock' },
    { address: 3, label: '3', description: 'Event 3: Launch Accelerator' },
    { address: 4, label: '4', description: 'Event 4: Photo Flash' },
    { address: 5, label: '5', description: 'Event 5: Mid-Course Brake' },
    { address: 6, label: '6', description: 'Event 6: Track Switch' },
    { address: 7, label: '7', description: 'Event 7: Final Brake' },
    { address: 8, label: '8', description: 'Event 8: Station Approach' },
    { address: 9, label: '9', description: 'Event 9: Unload Platform' },
    { address: 10, label: '10', description: 'Zone 1 Active' },
    { address: 11, label: '11', description: 'Zone 2 Active' },
    { address: 12, label: '12', description: 'Zone 3 Active' },
    { address: 13, label: '13', description: 'Emergency Stop Status' },
    { address: 14, label: '14', description: 'Gate Sensor' },
    { address: 15, label: '15', description: 'Safety Fault Active' },
  ],
  EFFECTS: [
    { address: 0, label: '0', description: 'Effects System Ready' },
    { address: 1, label: '1', description: 'Light Channel 1' },
    { address: 2, label: '2', description: 'Light Channel 2' },
    { address: 3, label: '3', description: 'Light Channel 3' },
    { address: 4, label: '4', description: 'Light Channel 4' },
    { address: 5, label: '5', description: 'Sound Channel 1' },
    { address: 6, label: '6', description: 'Sound Channel 2' },
    { address: 7, label: '7', description: 'Sound Channel 3' },
    { address: 8, label: '8', description: 'Smoke Machine' },
    { address: 9, label: '9', description: 'Strobe Light' },
    { address: 10, label: '10', description: 'Laser Effect' },
    { address: 11, label: '11', description: 'Water Effect' },
    { address: 12, label: '12', description: 'Wind Effect' },
    { address: 13, label: '13', description: 'Pyrotechnic Effect' },
    { address: 14, label: '14', description: 'Projector 1' },
    { address: 15, label: '15', description: 'Projector 2' },
  ],
};

export default function CoilStatus({ coilStates }: CoilStatusProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<PLCTab>('MAIN');

  const getTabColor = (tab: PLCTab, isActive: boolean) => {
    if (!isActive) return 'text-slate-500 border-transparent hover:text-slate-400';
    switch (tab) {
      case 'MAIN':
        return 'text-green-400 border-green-400';
      case 'SAFETY':
        return 'text-amber-400 border-amber-400';
      case 'EFFECTS':
        return 'text-cyan-400 border-cyan-400';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Modbus Coil States</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4">
          <div className="flex gap-1 mb-4 border-b border-slate-700/50 pb-2">
            {(['MAIN', 'SAFETY', 'EFFECTS'] as PLCTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t transition-all border-b-2 ${getTabColor(tab, activeTab === tab)}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {COIL_DEFINITIONS[activeTab].map((coil) => (
              <CoilItem
                key={coil.address}
                address={coil.address}
                label={coil.label}
                description={coil.description}
                value={coilStates[coil.address] || false}
              />
            ))}
          </div>

          <div className="mt-3 p-2 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500">
              <span className="font-medium text-slate-400">{activeTab}:</span>{' '}
              {activeTab === 'MAIN' ? 'Main ride control (Port 502)' :
               activeTab === 'SAFETY' ? 'Safety monitoring (Port 503)' :
               'Show effects (Port 504)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
