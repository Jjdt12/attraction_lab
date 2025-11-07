import { RIDE_ZONES } from '../types/rideEvents';
import { Shield, ShieldCheck, Zap, Camera, Gauge, GitBranch, Octagon, Target, DoorOpen } from 'lucide-react';

interface AttractionVisualizerProps {
  carPosition: number;
  activeEvents: Set<string>;
  rideRunning: boolean;
  trackLength: number;
}

export default function AttractionVisualizer({
  carPosition,
  activeEvents,
  rideRunning,
}: AttractionVisualizerProps) {
  const getZoneColor = (zoneId: number) => {
    const colors = {
      1: 'from-blue-500/30 to-blue-600/40',
      2: 'from-violet-500/30 to-violet-600/40',
      3: 'from-rose-500/30 to-rose-600/40',
    };
    return colors[zoneId as keyof typeof colors] || 'from-slate-500/30 to-slate-600/40';
  };

  const getEventIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'shield': Shield,
      'shield-check': ShieldCheck,
      'zap': Zap,
      'camera': Camera,
      'gauge': Gauge,
      'git-branch': GitBranch,
      'octagon': Octagon,
      'target': Target,
      'door-open': DoorOpen,
    };
    return iconMap[iconName] || Shield;
  };

  const renderZoneRow = (zone: typeof RIDE_ZONES[0]) => {
    const positions = [];
    for (let pos = zone.start; pos <= zone.end; pos++) {
      const isCarHere = carPosition === pos;

      const event = zone.events.find(e => pos >= e.position[0] && pos <= e.position[1]);
      const isEventActive = event ? activeEvents.has(event.id) : false;
      const isEventPosition = !!event;
      const EventIcon = event ? getEventIcon(event.icon) : null;

      positions.push(
        <div key={pos} className="flex flex-col items-center gap-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
              isCarHere
                ? 'bg-gradient-to-br from-white to-slate-200 border-slate-400 shadow-xl scale-110'
                : isEventPosition
                ? `bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 ${
                    isEventActive ? 'shadow-lg shadow-blue-500/50 ring-2 ring-blue-400' : ''
                  }`
                : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600'
            }`}
          >
            {isCarHere && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse" />
            )}
            {isEventPosition && !isCarHere && EventIcon && (
              <EventIcon
                className={`w-5 h-5 transition-all ${
                  isEventActive ? 'text-blue-400 animate-pulse' : 'text-slate-400'
                }`}
              />
            )}
          </div>
        </div>
      );

      if (pos < zone.end) {
        positions.push(
          <div key={`line-${pos}`} className="flex items-center">
            <div className="w-8 h-0.5 bg-slate-600" />
          </div>
        );
      }
    }

    return (
      <div
        key={zone.id}
        className={`relative bg-gradient-to-r ${getZoneColor(zone.id)} rounded-xl p-6 border border-slate-700/50`}
      >
        <div className="absolute top-2 left-4 text-xs font-bold text-slate-300">
          {zone.name}
        </div>
        <div className="flex items-center justify-center gap-1 mt-4">
          {positions}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-2xl p-8 border border-slate-700 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Attraction Lab</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {rideRunning ? 'Ride in Operation' : 'Ride Standby'}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
          rideRunning
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
        }`}>
          {rideRunning ? 'ACTIVE' : 'STANDBY'}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {RIDE_ZONES.map(zone => renderZoneRow(zone))}
      </div>

      <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800/50 dark:bg-slate-900/50 rounded-xl border border-slate-700/50 dark:border-slate-800/50">
        <div className="text-center">
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Car Position</div>
          <div className="text-3xl font-bold text-white">{carPosition}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Light Status</div>
          <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">OFF</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Ride Status</div>
          <div className={`text-2xl font-bold ${rideRunning ? 'text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {rideRunning ? 'RUN' : 'STOP'}
          </div>
        </div>
      </div>
    </div>
  );
}
