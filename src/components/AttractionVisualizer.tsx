import { RIDE_ZONES } from '../types/rideEvents';
import { Shield, ShieldCheck, Zap, Camera, Gauge, GitBranch, Octagon, Target, DoorOpen, Lightbulb, Volume2, Wind, Sparkles, Train, MapPin } from 'lucide-react';

interface AttractionVisualizerProps {
  carPosition: number;
  activeEvents: Set<string>;
  rideRunning: boolean;
  trackLength: number;
  coilStates: boolean[];
}

interface EffectConfig {
  name: string;
  icon: any;
  coil: number;
  color: string;
  positions: [number, number];
}

const EFFECTS_CONFIG: EffectConfig[] = [
  { name: 'Show Lighting', icon: Lightbulb, coil: 60, color: 'yellow', positions: [0, 26] },
  { name: 'Audio Ch.1', icon: Volume2, coil: 61, color: 'blue', positions: [0, 5] },
  { name: 'Audio Ch.2', icon: Volume2, coil: 62, color: 'cyan', positions: [6, 11] },
  { name: 'Audio Ch.3', icon: Volume2, coil: 63, color: 'teal', positions: [12, 17] },
  { name: 'Fog System', icon: Wind, coil: 64, color: 'slate', positions: [6, 17] },
  { name: 'Strobe', icon: Sparkles, coil: 65, color: 'white', positions: [6, 11] },
  { name: 'Laser Array', icon: Zap, coil: 66, color: 'red', positions: [6, 17] },
  { name: 'Photo Flash', icon: Camera, coil: 28, color: 'amber', positions: [9, 11] },
];

const getEffectColorClasses = (color: string, isActive: boolean) => {
  if (!isActive) return 'bg-slate-800 border-slate-700';

  const colorMap: Record<string, string> = {
    'yellow': 'bg-yellow-500/20 border-yellow-500/50 shadow-yellow-500/20',
    'blue': 'bg-blue-500/20 border-blue-500/50 shadow-blue-500/20',
    'cyan': 'bg-cyan-500/20 border-cyan-500/50 shadow-cyan-500/20',
    'teal': 'bg-teal-500/20 border-teal-500/50 shadow-teal-500/20',
    'slate': 'bg-slate-500/20 border-slate-500/50 shadow-slate-500/20',
    'white': 'bg-white/20 border-white/50 shadow-white/20',
    'red': 'bg-red-500/20 border-red-500/50 shadow-red-500/20',
    'amber': 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20',
  };
  return colorMap[color] || 'bg-slate-500/20 border-slate-500/50';
};

const getIndicatorColor = (color: string, isActive: boolean) => {
  if (!isActive) return 'bg-slate-600';

  const colorMap: Record<string, string> = {
    'yellow': 'bg-yellow-400',
    'blue': 'bg-blue-400',
    'cyan': 'bg-cyan-400',
    'teal': 'bg-teal-400',
    'slate': 'bg-slate-400',
    'white': 'bg-white',
    'red': 'bg-red-400',
    'amber': 'bg-amber-400',
  };
  return colorMap[color] || 'bg-slate-400';
};

export default function AttractionVisualizer({
  carPosition,
  activeEvents,
  rideRunning,
  coilStates,
}: AttractionVisualizerProps) {
  const getZoneColor = (zoneId: number) => {
    const colors = {
      1: 'from-blue-600/20 to-blue-700/30 border-blue-500/30',
      2: 'from-cyan-600/20 to-cyan-700/30 border-cyan-500/30',
      3: 'from-teal-600/20 to-teal-700/30 border-teal-500/30',
    };
    return colors[zoneId as keyof typeof colors] || 'from-slate-600/20 to-slate-700/30 border-slate-500/30';
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

  const isEffectInRange = (effect: EffectConfig, pos: number) => {
    if (effect.coil === 61) {
      return (pos >= 0 && pos <= 5) || (pos >= 18 && pos <= 26);
    }
    return pos >= effect.positions[0] && pos <= effect.positions[1];
  };

  const getActiveEffectsAtPosition = (pos: number) => {
    if (pos !== carPosition) return [];
    return EFFECTS_CONFIG.filter(effect => {
      const isInRange = isEffectInRange(effect, pos);
      const isActive = coilStates[effect.coil] || false;
      return isInRange && isActive;
    });
  };

  const renderZoneRow = (zone: typeof RIDE_ZONES[0]) => {
    const positions = [];
    for (let pos = zone.start; pos <= zone.end; pos++) {
      const isCarHere = carPosition === pos;
      const event = zone.events.find(e => pos >= e.position[0] && pos <= e.position[1]);
      const isEventActive = event ? activeEvents.has(event.id) : false;
      const isEventPosition = !!event;
      const EventIcon = event ? getEventIcon(event.icon) : null;
      const activeEffects = getActiveEffectsAtPosition(pos);
      const hasActiveEffects = activeEffects.length > 0;

      positions.push(
        <div key={pos} className="flex flex-col items-center gap-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border relative ${
              isCarHere
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 shadow-lg shadow-cyan-500/40 scale-110'
                : isEventPosition
                ? `bg-slate-800/80 border-slate-600 ${
                    isEventActive ? 'ring-2 ring-cyan-400/50' : ''
                  }`
                : 'bg-slate-800/50 border-slate-700/50'
            }`}
          >
            {isCarHere && (
              <Train className="w-5 h-5 text-white" />
            )}
            {isEventPosition && !isCarHere && EventIcon && (
              <EventIcon
                className={`w-4 h-4 transition-all ${
                  isEventActive ? 'text-cyan-400' : 'text-slate-500'
                }`}
              />
            )}
            {hasActiveEffects && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center">
                <span className="text-[8px] font-bold text-slate-900">{activeEffects.length}</span>
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">{pos}</div>
        </div>
      );

      if (pos < zone.end) {
        positions.push(
          <div key={`line-${pos}`} className="flex items-center self-start mt-5">
            <div className="w-3 h-px bg-slate-600" />
          </div>
        );
      }
    }

    return (
      <div
        key={zone.id}
        className={`relative bg-gradient-to-r ${getZoneColor(zone.id)} rounded-lg p-4 border`}
      >
        <div className="absolute top-1 left-3 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {zone.name}
          </span>
        </div>
        <div className="flex items-center justify-center gap-0.5 pt-4">
          {positions}
        </div>
      </div>
    );
  };

  const currentZone = carPosition <= 8 ? 'Zone 1' : carPosition <= 17 ? 'Zone 2' : 'Zone 3';
  const activeEffectsCount = getActiveEffectsAtPosition(carPosition).length;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              rideRunning
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-slate-700/50 border border-slate-600/30'
            }`}>
              <Train className={`w-5 h-5 ${rideRunning ? 'text-green-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Attraction Track Layout</h2>
              <p className="text-xs text-slate-400">Real-time vehicle and effects monitoring</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-mono text-sm border ${
            rideRunning
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-slate-700/50 text-slate-400 border-slate-600'
          }`}>
            {rideRunning ? 'RUNNING' : 'STANDBY'}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-3">
            {RIDE_ZONES.map(zone => renderZoneRow(zone))}

            <div className="grid grid-cols-4 gap-3 mt-6">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Position</div>
                <div className="text-2xl font-mono font-bold text-cyan-400">{carPosition}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Zone</div>
                <div className="text-lg font-bold text-white">{currentZone}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Effects</div>
                <div className="text-2xl font-mono font-bold text-amber-400">{activeEffectsCount}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <div className={`text-lg font-bold ${rideRunning ? 'text-green-400' : 'text-slate-500'}`}>
                  {rideRunning ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            </div>
          </div>

          <div className="w-64 space-y-4">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Active Effects
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {EFFECTS_CONFIG.filter(effect => {
                  const isActive = coilStates[effect.coil] || false;
                  const isInRange = isEffectInRange(effect, carPosition);
                  return isActive && isInRange;
                }).map(effect => {
                  const EffectIcon = effect.icon;
                  return (
                    <div
                      key={effect.coil}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${getEffectColorClasses(effect.color, true)}`}
                    >
                      <EffectIcon className="w-4 h-4 text-white" />
                      <span className="text-xs font-medium text-white flex-1">{effect.name}</span>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${getIndicatorColor(effect.color, true)}`} />
                    </div>
                  );
                })}
                {EFFECTS_CONFIG.filter(effect => {
                  const isActive = coilStates[effect.coil] || false;
                  const isInRange = isEffectInRange(effect, carPosition);
                  return isActive && isInRange;
                }).length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <Sparkles className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">No active effects</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Effects System
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {EFFECTS_CONFIG.map(effect => {
                  const isActive = coilStates[effect.coil] || false;
                  const isInRange = isEffectInRange(effect, carPosition);
                  const shouldBeActive = isActive && isInRange;
                  const EffectIcon = effect.icon;

                  return (
                    <div
                      key={effect.coil}
                      className={`flex items-center gap-2 p-2 rounded-md transition-all ${
                        shouldBeActive
                          ? 'bg-slate-700/50 border border-slate-600/50'
                          : 'bg-transparent border border-transparent'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center border ${getEffectColorClasses(effect.color, shouldBeActive)}`}>
                        <EffectIcon className={`w-3 h-3 ${shouldBeActive ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-medium truncate ${shouldBeActive ? 'text-white' : 'text-slate-500'}`}>
                          {effect.name}
                        </div>
                        <div className="text-[8px] text-slate-600">
                          Pos {effect.positions[0]}-{effect.positions[1]}
                        </div>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${shouldBeActive ? getIndicatorColor(effect.color, true) : 'bg-slate-700'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
