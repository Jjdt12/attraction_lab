import { useState } from 'react';
import {
  Camera,
  Zap,
  Gauge,
  GitBranch,
  Octagon,
  Target,
  DoorOpen,
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Radio
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
}: RideEventsMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sortedEvents = [...allEvents].sort((a, b) => a.position[0] - b.position[0]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Track Events</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {sortedEvents.map(event => {
              const isActive = activeEvents.has(event.id);
              const Icon = EVENT_ICONS[event.type];

              return (
                <div
                  key={event.id}
                  className={`rounded-lg p-2.5 border-l-2 transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 border-cyan-400'
                      : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      isActive ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                    }`}>
                      <Icon className={`w-3 h-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {event.name}
                        </span>
                        <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                          {event.position[0]}-{event.position[1]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-600">Zone {event.zone}</span>
                        {isActive && (
                          <span className="text-[9px] text-cyan-400 font-bold animate-pulse">ACTIVE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-700/50">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {activeEvents.size}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Active</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="text-lg font-mono font-bold text-slate-400">
                  {allEvents.length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
