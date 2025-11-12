import { RIDE_ZONES } from '../types/rideEvents';
import { Shield, ShieldCheck, Zap, Camera, Gauge, GitBranch, Octagon, Target, DoorOpen, Lightbulb, Volume2, Wind, Sparkles } from 'lucide-react';

interface AttractionVisualizerProps {
  carPosition: number;
  activeEvents: Set<string>;
  rideRunning: boolean;
  trackLength: number;
  coilStates: boolean[];
}

// Effect icons and their coil mappings from Effects PLC
interface EffectConfig {
  name: string;
  icon: any;
  coil: number;
  color: string;
  positions: [number, number]; // Position range where this effect is active
}

// Match the PLC logic exactly from attraction_control_effects.st
const EFFECTS_CONFIG: EffectConfig[] = [
  { name: 'Show Lighting', icon: Lightbulb, coil: 60, color: 'yellow', positions: [0, 26] },
  { name: 'Audio 1', icon: Volume2, coil: 61, color: 'blue', positions: [0, 5] },
  { name: 'Audio 2', icon: Volume2, coil: 62, color: 'purple', positions: [6, 11] },
  { name: 'Audio 3', icon: Volume2, coil: 63, color: 'cyan', positions: [12, 17] },
  { name: 'Fog Machine', icon: Wind, coil: 64, color: 'slate', positions: [6, 17] },
  { name: 'Strobe', icon: Sparkles, coil: 65, color: 'white', positions: [6, 11] },
  { name: 'Laser', icon: Zap, coil: 66, color: 'red', positions: [6, 17] },
  { name: 'Flash', icon: Camera, coil: 28, color: 'yellow', positions: [9, 11] },
];

// Helper to get effect color classes (Tailwind doesn't support dynamic colors)
const getEffectColorClasses = (color: string, isActive: boolean) => {
  if (!isActive) {
    return 'bg-slate-700/40 border border-slate-600/50';
  }

  const colorMap: Record<string, string> = {
    'yellow': 'bg-yellow-500/80 shadow-lg shadow-yellow-500/50',
    'blue': 'bg-blue-500/80 shadow-lg shadow-blue-500/50',
    'purple': 'bg-purple-500/80 shadow-lg shadow-purple-500/50',
    'cyan': 'bg-cyan-500/80 shadow-lg shadow-cyan-500/50',
    'slate': 'bg-slate-500/80 shadow-lg shadow-slate-500/50',
    'white': 'bg-white/80 shadow-lg shadow-white/50',
    'red': 'bg-red-500/80 shadow-lg shadow-red-500/50',
  };
  return colorMap[color] || 'bg-slate-500/80 shadow-lg shadow-slate-500/50';
};

const getEffectPanelColorClasses = (color: string, shouldBeActive: boolean) => {
  if (!shouldBeActive) {
    return 'bg-slate-700/40 border border-slate-600/50';
  }

  const colorMap: Record<string, string> = {
    'yellow': 'bg-yellow-500/80 shadow-lg shadow-yellow-500/30',
    'blue': 'bg-blue-500/80 shadow-lg shadow-blue-500/30',
    'purple': 'bg-purple-500/80 shadow-lg shadow-purple-500/30',
    'cyan': 'bg-cyan-500/80 shadow-lg shadow-cyan-500/30',
    'slate': 'bg-slate-500/80 shadow-lg shadow-slate-500/30',
    'white': 'bg-white/80 shadow-lg shadow-white/30',
    'red': 'bg-red-500/80 shadow-lg shadow-red-500/30',
  };
  return colorMap[color] || 'bg-slate-500/80 shadow-lg shadow-slate-500/30';
};

const getEffectIndicatorClasses = (color: string, shouldBeActive: boolean) => {
  if (!shouldBeActive) {
    return 'bg-slate-600';
  }

  const colorMap: Record<string, string> = {
    'yellow': 'bg-yellow-400 shadow-lg shadow-yellow-400/50 animate-pulse',
    'blue': 'bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse',
    'purple': 'bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse',
    'cyan': 'bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse',
    'slate': 'bg-slate-400 shadow-lg shadow-slate-400/50 animate-pulse',
    'white': 'bg-white shadow-lg shadow-white/50 animate-pulse',
    'red': 'bg-red-400 shadow-lg shadow-red-400/50 animate-pulse',
  };
  return colorMap[color] || 'bg-slate-400 shadow-lg shadow-slate-400/50 animate-pulse';
};

export default function AttractionVisualizer({
  carPosition,
  activeEvents,
  rideRunning,
  coilStates,
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

  // Get active effects at current position
  const getActiveEffectsAtPosition = (pos: number) => {
    return EFFECTS_CONFIG.filter(effect => {
      const isInRange = pos >= effect.positions[0] && pos <= effect.positions[1];
      const isActive = coilStates[effect.coil] || false;
      return isInRange && isActive;
    });
  };

  // Get potential effects at position (even if not active)
  const getPotentialEffectsAtPosition = (pos: number) => {
    return EFFECTS_CONFIG.filter(effect =>
      pos >= effect.positions[0] && pos <= effect.positions[1]
    );
  };

  const renderZoneRow = (zone: typeof RIDE_ZONES[0]) => {
    const positions = [];
    for (let pos = zone.start; pos <= zone.end; pos++) {
      const isCarHere = carPosition === pos;

      const event = zone.events.find(e => pos >= e.position[0] && pos <= e.position[1]);
      const isEventActive = event ? activeEvents.has(event.id) : false;
      const isEventPosition = !!event;
      const EventIcon = event ? getEventIcon(event.icon) : null;

      // Get effects at this position
      const activeEffects = getActiveEffectsAtPosition(pos);
      const hasActiveEffects = activeEffects.length > 0;

      positions.push(
        <div key={pos} className="flex flex-col items-center gap-2">
          {/* Position indicator */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 relative ${
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
            {/* Active effects indicator */}
            {hasActiveEffects && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-slate-900 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-900">{activeEffects.length}</span>
              </div>
            )}
          </div>
          {/* Position number */}
          <div className="text-[10px] text-slate-500 font-mono">{pos}</div>
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
        <div className="flex items-center justify-center gap-1 pt-6">
          {positions}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-2xl p-8 border border-slate-700 dark:border-slate-800">
      <div className="flex gap-6">
        {/* Main ride visualization */}
        <div className="flex-1">
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
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Active Effects</div>
              <div className="text-2xl font-bold text-yellow-400">{getActiveEffectsAtPosition(carPosition).length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Ride Status</div>
              <div className={`text-2xl font-bold ${rideRunning ? 'text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {rideRunning ? 'RUN' : 'STOP'}
              </div>
            </div>
          </div>
        </div>

        {/* Active Effects Dashboard */}
        <div className="w-80 space-y-4">
          {/* Currently Active Effects */}
          <div className="bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 dark:border-slate-800/50">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Active Now
            </h3>
            <div className="space-y-2">
              {EFFECTS_CONFIG.filter(effect => {
                const isActive = coilStates[effect.coil] || false;
                const isInRange = carPosition >= effect.positions[0] && carPosition <= effect.positions[1];
                return isActive && isInRange;
              }).map(effect => {
                const EffectIcon = effect.icon;
                return (
                  <div
                    key={effect.coil}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/80 border border-slate-600 animate-in fade-in slide-in-from-right-2 duration-300"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${getEffectPanelColorClasses(effect.color, true)}`}>
                      <EffectIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {effect.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Position {effect.positions[0]}-{effect.positions[1]}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getEffectIndicatorClasses(effect.color, true)}`} />
                  </div>
                );
              })}
              {EFFECTS_CONFIG.filter(effect => {
                const isActive = coilStates[effect.coil] || false;
                const isInRange = carPosition >= effect.positions[0] && carPosition <= effect.positions[1];
                return isActive && isInRange;
              }).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No effects active</p>
                </div>
              )}
            </div>
          </div>

          {/* All Available Effects */}
          <div className="bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 dark:border-slate-800/50">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              All Show Effects
            </h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {EFFECTS_CONFIG.map(effect => {
                const isActive = coilStates[effect.coil] || false;
                const isInRange = carPosition >= effect.positions[0] && carPosition <= effect.positions[1];
                const shouldBeActive = isActive && isInRange;
                const EffectIcon = effect.icon;

                return (
                  <div
                    key={effect.coil}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                      shouldBeActive
                        ? 'bg-slate-700/60 border border-slate-600/50'
                        : 'bg-slate-800/20 border border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${getEffectPanelColorClasses(effect.color, shouldBeActive)}`}>
                      <EffectIcon
                        className={`w-3.5 h-3.5 transition-all ${
                          shouldBeActive ? 'text-white' : 'text-slate-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate transition-colors ${
                        shouldBeActive ? 'text-white' : 'text-slate-400'
                      }`}>
                        {effect.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Pos {effect.positions[0]}-{effect.positions[1]}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full transition-all ${getEffectIndicatorClasses(effect.color, shouldBeActive)}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
