import { useState } from 'react';
import {
  Camera,
  Volume2,
  Cloud,
  Zap,
  Bot,
  Film,
  Lightbulb,
  Shield,
  AlertTriangle,
  Activity,
  Gauge,
  GitBranch,
  Octagon,
  Target,
  DoorOpen,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RideEvent, RideEventType } from '../types/rideEvents';

interface RideEventsMonitorProps {
  activeEvents: Set<string>;
  allEvents: RideEvent[];
  rideRunning: boolean;
}

const EVENT_ICONS: Record<RideEventType, typeof Camera> = {
  loading_gate: Shield,
  safety_interlock: ShieldCheck,
  launch_accelerator: Zap,
  photo_flash: Camera,
  mid_brake: Gauge,
  track_switch: GitBranch,
  final_brake: Octagon,
  station_approach: Target,
  unload_platform: DoorOpen,
};

export default function RideEventsMonitor({
  activeEvents,
  allEvents,
  rideRunning
}: RideEventsMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sortedEvents = [...allEvents].sort((a, b) => a.position[0] - b.position[0]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 p-6 pb-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-white">All Ride Events</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {sortedEvents.map(event => {
          const isActive = activeEvents.has(event.id);
          const Icon = EVENT_ICONS[event.type];

          const getBorderClass = () => {
            switch (event.color) {
              case 'yellow': return 'border-yellow-500';
              case 'emerald': return 'border-emerald-500';
              case 'slate': return 'border-slate-500';
              case 'pink': return 'border-pink-500';
              case 'green': return 'border-green-500';
              case 'cyan': return 'border-cyan-500';
              case 'white': return 'border-white';
              case 'blue': return 'border-blue-500';
              case 'orange': return 'border-orange-500';
              case 'red': return 'border-red-500';
              default: return 'border-slate-500';
            }
          };

          const getIconBgClass = () => {
            switch (event.color) {
              case 'yellow': return 'bg-yellow-500/20';
              case 'emerald': return 'bg-emerald-500/20';
              case 'slate': return 'bg-slate-500/20';
              case 'pink': return 'bg-pink-500/20';
              case 'green': return 'bg-green-500/20';
              case 'cyan': return 'bg-cyan-500/20';
              case 'white': return 'bg-white/20';
              case 'blue': return 'bg-blue-500/20';
              case 'orange': return 'bg-orange-500/20';
              case 'red': return 'bg-red-500/20';
              default: return 'bg-slate-500/20';
            }
          };

          const getTextClass = () => {
            switch (event.color) {
              case 'yellow': return 'text-yellow-400';
              case 'emerald': return 'text-emerald-400';
              case 'slate': return 'text-slate-400';
              case 'pink': return 'text-pink-400';
              case 'green': return 'text-green-400';
              case 'cyan': return 'text-cyan-400';
              case 'white': return 'text-white';
              case 'blue': return 'text-blue-400';
              case 'orange': return 'text-orange-400';
              case 'red': return 'text-red-400';
              default: return 'text-slate-400';
            }
          };

          return (
            <div
              key={event.id}
              className={`rounded-lg p-3 border-l-4 transition-all ${getBorderClass()} ${
                isActive
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 scale-105 shadow-lg'
                  : 'bg-slate-800/50 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${getIconBgClass()} flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''
                }`}>
                  <Icon className={`w-4 h-4 ${getTextClass()}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold text-xs ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {event.name}
                    </h4>
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {event.position[0]}-{event.position[1]}
                    </span>
                  </div>
                  <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {event.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Zone {event.zone}</span>
                    {isActive && (
                      <span className="text-xs text-emerald-400 font-bold animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {activeEvents.size}
                </div>
                <div className="text-xs text-slate-400 mt-1">Active Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400 font-mono">
                  {allEvents.length}
                </div>
                <div className="text-xs text-slate-400 mt-1">Total Events</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
