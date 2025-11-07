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
    <div className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all min-h-[60px]">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${value ? `${colors.bg} shadow-lg ${colors.shadow}` : 'bg-slate-300 dark:bg-slate-600'}`} />
        <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      </div>
      <span className={`text-xs font-mono font-semibold ${value ? colors.text : 'text-slate-400 dark:text-slate-500'}`}>
        {value ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

export default function CoilStatus({ flashLight, coilStates }: CoilStatusProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 31 }, (_, i) => (
            <CoilItem
              key={i}
              address={i}
              label={`${i}`}
              description={`Address ${i}`}
              value={coilStates[i] || false}
              color={coilStates[i] ? "blue" : "slate"}
            />
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Refer to attraction documentation for coil address mappings and operational procedures.
          </p>
        </div>
        </div>
      )}
    </div>
  );
}
