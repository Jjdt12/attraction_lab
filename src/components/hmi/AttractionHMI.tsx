import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Play,
  Square,
  AlertOctagon,
  Gauge,
  MapPin,
  Zap,
  Camera,
  CircleDot,
  Settings,
  Shield,
  Timer,
  RotateCcw,
  CloudFog,
  Lightbulb,
  Volume2,
  Sparkles,
  Sun,
  FlashlightOff,
} from 'lucide-react';
import { usePlcConnection } from '../../hooks/usePlcConnection';

const TRACK_POSITIONS = 26;
const POSITIONS_PER_SCENE = 3;

const SHOW_EFFECTS_CONFIG = {
  flash_light: { address: 28, name: 'Flash Light', icon: Camera, color: 'amber' },
  show_lighting: { address: 60, name: 'Show Lighting', icon: Lightbulb, color: 'yellow' },
  audio_1: { address: 61, name: 'Audio Ch 1', icon: Volume2, color: 'cyan' },
  audio_2: { address: 62, name: 'Audio Ch 2', icon: Volume2, color: 'blue' },
  audio_3: { address: 63, name: 'Audio Ch 3', icon: Volume2, color: 'indigo' },
  fog_machine: { address: 64, name: 'Fog Machine', icon: CloudFog, color: 'slate' },
  strobe: { address: 65, name: 'Strobe', icon: Sun, color: 'white' },
  laser: { address: 66, name: 'Laser Effect', icon: Sparkles, color: 'red' },
};

const EFFECT_ZONES = [
  { zone: 1, name: 'Loading/Launch', posRange: [0, 5], effects: ['show_lighting', 'audio_1'] },
  { zone: 2, name: 'Thrill Zone', posRange: [6, 11], effects: ['show_lighting', 'audio_2', 'fog_machine', 'strobe', 'laser'] },
  { zone: 3, name: 'Scenic Route', posRange: [12, 17], effects: ['show_lighting', 'audio_3', 'fog_machine', 'laser'] },
  { zone: 4, name: 'Return/Station', posRange: [18, 26], effects: ['show_lighting', 'audio_1'] },
];

const EVENT_CONFIG = [
  { name: 'Loading Gate', icon: CircleDot, color: 'cyan', position: 1 },
  { name: 'Safety Interlock', icon: Shield, color: 'emerald', position: 4 },
  { name: 'Launch', icon: Zap, color: 'amber', position: 7 },
  { name: 'Photo Flash', icon: Camera, color: 'blue', position: 10 },
  { name: 'Mid Brake', icon: Square, color: 'orange', position: 13 },
  { name: 'Track Switch', icon: Activity, color: 'teal', position: 16 },
  { name: 'Final Brake', icon: Square, color: 'red', position: 19 },
  { name: 'Station', icon: MapPin, color: 'emerald', position: 22 },
  { name: 'Unload', icon: CircleDot, color: 'cyan', position: 25 },
];

const STATE_COLORS: Record<string, string> = {
  IDLE: 'text-slate-400',
  STARTING: 'text-amber-400',
  RUNNING: 'text-emerald-400',
  STOPPING: 'text-orange-400',
  EMERGENCY: 'text-red-400',
  MAINTENANCE: 'text-blue-400',
};

export function AttractionHMI() {
  const {
    connectionStatus,
    plcStates,
    error,
    getStateName,
    writeCoil,
    resetAttraction,
  } = usePlcConnection();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const mainPlc = plcStates.main;
  const safetyPlc = plcStates.safety;
  const effectsPlc = plcStates.effects;

  const position = mainPlc.registers[1025] ?? 0;
  const speed = mainPlc.registers[1026] ?? 0;
  const state = mainPlc.registers[1039] ?? 0;
  const stateName = getStateName(state);
  const errorCode = mainPlc.registers[1029] ?? 0;

  const masterEnable = mainPlc.coils[0] ?? false;
  const emergencyStop = mainPlc.coils[3] ?? false;
  const safetyGate = mainPlc.coils[4] ?? false;
  const motorRunning = mainPlc.coils[26] ?? false;
  const brakeEngaged = mainPlc.coils[27] ?? false;
  const safetyOk = mainPlc.coils[30] ?? false;
  const safetyPlcReady = mainPlc.coils[31] ?? false;
  const effectsPlcReady = mainPlc.coils[32] ?? false;

  const zone1Enable = mainPlc.coils[5] ?? false;
  const zone2Enable = mainPlc.coils[6] ?? false;
  const zone3Enable = mainPlc.coils[7] ?? false;

  const currentZone = position <= 8 ? 1 : position <= 17 ? 2 : 3;
  const currentScene = Math.floor(position / POSITIONS_PER_SCENE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Attraction Control HMI</h2>
          <p className="text-sm text-slate-400">Live PLC Data - Real-time Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">System Time</p>
            <p className="text-sm font-mono text-slate-300">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <ConnectionBadge status={connectionStatus} error={error} />
        </div>
      </div>

      <OperatorControlPanel
        masterEnable={masterEnable}
        emergencyStop={emergencyStop}
        safetyGate={safetyGate}
        stateName={stateName}
        connected={connectionStatus === 'connected'}
        onMasterToggle={() => writeCoil('main', 0, !masterEnable)}
        onStart={() => writeCoil('main', 1, true)}
        onStop={() => writeCoil('main', 2, true)}
        onEmergencyStop={() => writeCoil('main', 3, !emergencyStop)}
        onSafetyGateToggle={() => writeCoil('main', 4, !safetyGate)}
        onReset={resetAttraction}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">System State</h3>
          </div>
          <div className={`text-3xl font-bold mb-2 ${STATE_COLORS[stateName] || 'text-white'}`}>
            {stateName}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatusIndicator label="Master Enable" active={masterEnable} />
            <StatusIndicator label="Motor Running" active={motorRunning} />
            <StatusIndicator label="Brake Engaged" active={brakeEngaged} inverted />
            <StatusIndicator label="Safety OK" active={safetyOk} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Position / Speed</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">{position}</span>
            <span className="text-slate-400">/ {TRACK_POSITIONS}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200"
              style={{ width: `${(position / TRACK_POSITIONS) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">Speed: {speed}</span>
            <span className="text-xs text-slate-500">Scene {currentScene} / Zone {currentZone}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">Safety Status</h3>
          </div>
          <div className="space-y-2">
            <SafetyIndicator
              label="Emergency Stop"
              active={emergencyStop}
              danger={emergencyStop}
              icon={AlertOctagon}
            />
            <SafetyIndicator
              label="Safety Gate"
              active={safetyGate}
              danger={!safetyGate}
              icon={Shield}
            />
            <SafetyIndicator
              label="Safety PLC"
              active={safetyPlcReady}
              danger={!safetyPlcReady}
              icon={Activity}
            />
          </div>
          {errorCode > 0 && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
              Error: {errorCode}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={18} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">PLC Status</h3>
          </div>
          <div className="space-y-2">
            <PlcStatusRow name="Attraction Control" connected={mainPlc.connected} port={502} />
            <PlcStatusRow name="Safety PLC" connected={safetyPlc.connected} port={503} />
            <PlcStatusRow name="Show Control" connected={effectsPlc.connected} port={504} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
            Last update: {mainPlc.lastUpdate ? new Date(mainPlc.lastUpdate).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Zone Control</h3>
          </div>
          <div className="space-y-3">
            <ZoneStatus
              zone={1}
              enabled={zone1Enable}
              active={currentZone === 1}
              range="0-8"
              scenes="Scenes 1-3"
            />
            <ZoneStatus
              zone={2}
              enabled={zone2Enable}
              active={currentZone === 2}
              range="9-17"
              scenes="Scenes 4-6"
            />
            <ZoneStatus
              zone={3}
              enabled={zone3Enable}
              active={currentZone === 3}
              range="18-26"
              scenes="Scenes 7-9"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Timer size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Show Events</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_CONFIG.map((event, index) => {
              const enableCoil = 8 + index;
              const activeCoil = 17 + index;
              const enabled = mainPlc.coils[enableCoil] ?? false;
              const active = mainPlc.coils[activeCoil] ?? false;
              const Icon = event.icon;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : enabled
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-900 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={active ? 'text-cyan-400' : 'text-slate-500'} />
                    <span className="text-xs font-medium text-slate-300">{event.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {active && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ShowEffectsPanel effectsPlc={effectsPlc} position={position} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Track Visualization</h3>
        </div>
        <TrackVisualization position={position} events={EVENT_CONFIG} mainPlc={mainPlc} effectsPlc={effectsPlc} />
      </div>

      {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-400">Not Connected to PLCs</p>
              <p className="text-xs text-amber-400/70">
                Make sure the backend server is running (run.sh) and PLCs are started.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConnectionBadge({ status, error }: { status: string; error: string | null }) {
  const config = {
    connected: { icon: Wifi, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Connected' },
    connecting: { icon: Wifi, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Connecting...' },
    disconnected: { icon: WifiOff, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', label: 'Disconnected' },
    error: { icon: WifiOff, color: 'text-red-400 bg-red-500/10 border-red-500/30', label: error || 'Error' },
  }[status] || { icon: WifiOff, color: 'text-slate-400', label: 'Unknown' };

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color}`}>
      <Icon size={14} />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}

function StatusIndicator({ label, active, inverted = false }: { label: string; active: boolean; inverted?: boolean }) {
  const isGood = inverted ? !active : active;
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
      <span className="text-slate-400">{label}</span>
      {isGood ? (
        <CheckCircle2 size={14} className="text-emerald-400" />
      ) : (
        <XCircle size={14} className="text-red-400" />
      )}
    </div>
  );
}

function SafetyIndicator({
  label,
  active,
  danger,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  danger: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${danger ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={danger ? 'text-red-400' : 'text-emerald-400'} />
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      <span className={`text-xs font-medium ${danger ? 'text-red-400' : 'text-emerald-400'}`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

function PlcStatusRow({ name, connected, port }: { name: string; connected: boolean; port: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <span className="text-xs text-slate-300">{name}</span>
      </div>
      <span className="text-xs text-slate-500">:{port}</span>
    </div>
  );
}

function ZoneStatus({
  zone,
  enabled,
  active,
  range,
  scenes,
}: {
  zone: number;
  enabled: boolean;
  active: boolean;
  range: string;
  scenes: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        active
          ? 'bg-cyan-500/20 border-cyan-500/50'
          : enabled
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-white">Zone {zone}</p>
        <p className="text-xs text-slate-400">Pos {range} ({scenes})</p>
      </div>
      <div className="text-right">
        <p className={`text-xs font-medium ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>
          {enabled ? 'ENABLED' : 'DISABLED'}
        </p>
        {active && <p className="text-xs text-cyan-400">ACTIVE</p>}
      </div>
    </div>
  );
}

interface TrackVisualizationProps {
  position: number;
  events: typeof EVENT_CONFIG;
  mainPlc: { coils: Record<number, boolean> };
  effectsPlc: { coils: Record<number, boolean> };
}

function TrackVisualization({ position, events, mainPlc, effectsPlc }: TrackVisualizationProps) {
  const fogActive = effectsPlc.coils[64] ?? false;
  const strobeActive = effectsPlc.coils[65] ?? false;
  const laserActive = effectsPlc.coils[66] ?? false;

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-6 flex">
        {EFFECT_ZONES.map((zone, i) => {
          const startPct = (zone.posRange[0] / TRACK_POSITIONS) * 100;
          const endPct = (zone.posRange[1] / TRACK_POSITIONS) * 100;
          const widthPct = endPct - startPct;
          const isInZone = position >= zone.posRange[0] && position <= zone.posRange[1];

          const zoneHasFog = zone.effects.includes('fog_machine');
          const zoneHasStrobe = zone.effects.includes('strobe');
          const zoneHasLaser = zone.effects.includes('laser');

          return (
            <div
              key={i}
              className="absolute h-full flex items-center justify-center gap-1"
              style={{ left: `${startPct}%`, width: `${widthPct}%` }}
            >
              {zoneHasFog && (
                <CloudFog
                  size={12}
                  className={`transition-all ${isInZone && fogActive ? 'text-slate-300 animate-pulse' : 'text-slate-700'}`}
                />
              )}
              {zoneHasStrobe && (
                <Sun
                  size={12}
                  className={`transition-all ${isInZone && strobeActive ? 'text-white animate-pulse' : 'text-slate-700'}`}
                />
              )}
              {zoneHasLaser && (
                <Sparkles
                  size={12}
                  className={`transition-all ${isInZone && laserActive ? 'text-red-400 animate-pulse' : 'text-slate-700'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="relative h-28 mt-6">
        <div className="absolute inset-x-0 top-1/2 h-3 bg-slate-800 rounded-full -translate-y-1/2 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/30 to-transparent rounded-full transition-all duration-200"
            style={{ width: `${(position / TRACK_POSITIONS) * 100}%` }}
          />
          {EFFECT_ZONES.map((zone, i) => {
            const startPct = (zone.posRange[0] / TRACK_POSITIONS) * 100;
            const endPct = (zone.posRange[1] / TRACK_POSITIONS) * 100;
            const widthPct = endPct - startPct;
            const isInZone = position >= zone.posRange[0] && position <= zone.posRange[1];
            const hasActiveEffect = isInZone && (
              (zone.effects.includes('fog_machine') && fogActive) ||
              (zone.effects.includes('strobe') && strobeActive) ||
              (zone.effects.includes('laser') && laserActive)
            );

            return (
              <div
                key={i}
                className={`absolute top-0 h-full transition-all ${hasActiveEffect ? 'bg-amber-500/20' : ''}`}
                style={{ left: `${startPct}%`, width: `${widthPct}%` }}
              />
            );
          })}
        </div>

        {[0, 9, 18].map((zoneStart, i) => (
          <div
            key={i}
            className="absolute top-1/2 w-0.5 h-6 bg-slate-600 -translate-y-1/2"
            style={{ left: `${(zoneStart / TRACK_POSITIONS) * 100}%` }}
          />
        ))}

        {events.map((event, index) => {
          const activeCoil = 17 + index;
          const isActive = mainPlc.coils[activeCoil] ?? false;
          return (
            <div
              key={index}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${(event.position / TRACK_POSITIONS) * 100}%` }}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isActive
                    ? 'bg-cyan-400 border-cyan-400 scale-125'
                    : 'bg-slate-700 border-slate-600'
                }`}
                title={event.name}
              />
              <span className="text-[9px] text-slate-500 mt-5 whitespace-nowrap max-w-12 truncate">
                {event.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        <div
          className="absolute top-1/2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10"
          style={{ left: `${(position / TRACK_POSITIONS) * 100}%` }}
        >
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-1">
          <span>0</span>
          <span className="text-cyan-500/50">Z1</span>
          <span>9</span>
          <span className="text-cyan-500/50">Z2</span>
          <span>18</span>
          <span className="text-cyan-500/50">Z3</span>
          <span>26</span>
        </div>
      </div>
    </div>
  );
}

interface ShowEffectsPanelProps {
  effectsPlc: { coils: Record<number, boolean> };
  position: number;
}

function ShowEffectsPanel({ effectsPlc, position }: ShowEffectsPanelProps) {
  const currentZone = EFFECT_ZONES.find(z => position >= z.posRange[0] && position <= z.posRange[1]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Show Effects</h3>
        </div>
        {currentZone && (
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {currentZone.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(SHOW_EFFECTS_CONFIG).map(([key, config]) => {
          const isActive = effectsPlc.coils[config.address] ?? false;
          const Icon = config.icon;
          const expectedInZone = currentZone?.effects.includes(key);

          const colorClasses: Record<string, string> = {
            amber: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
            yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
            cyan: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
            blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
            indigo: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400',
            slate: 'bg-slate-400/20 border-slate-400/50 text-slate-300',
            white: 'bg-white/20 border-white/50 text-white',
            red: 'bg-red-500/20 border-red-500/50 text-red-400',
          };

          return (
            <div
              key={key}
              className={`relative p-3 rounded-lg border transition-all ${
                isActive
                  ? colorClasses[config.color] || 'bg-cyan-500/20 border-cyan-500/50'
                  : 'bg-slate-800/30 border-slate-700/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`relative ${isActive ? 'animate-pulse' : ''}`}>
                  <Icon
                    size={24}
                    className={isActive ? '' : 'text-slate-600'}
                  />
                  {isActive && config.color === 'white' && (
                    <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50" />
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${isActive ? '' : 'text-slate-500'}`}>
                  {config.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
              {expectedInZone && !isActive && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" title="Expected in this zone" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 mb-2">Effect Zones</div>
        <div className="grid grid-cols-4 gap-2">
          {EFFECT_ZONES.map((zone) => {
            const isCurrentZone = position >= zone.posRange[0] && position <= zone.posRange[1];
            return (
              <div
                key={zone.zone}
                className={`p-2 rounded text-xs transition-all ${
                  isCurrentZone
                    ? 'bg-cyan-500/20 border border-cyan-500/50'
                    : 'bg-slate-800/50'
                }`}
              >
                <div className={`font-medium ${isCurrentZone ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {zone.name}
                </div>
                <div className="text-slate-500 text-[10px]">
                  Pos {zone.posRange[0]}-{zone.posRange[1]}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {zone.effects.map((effect) => {
                    const cfg = SHOW_EFFECTS_CONFIG[effect as keyof typeof SHOW_EFFECTS_CONFIG];
                    if (!cfg) return null;
                    const EffectIcon = cfg.icon;
                    const effectActive = effectsPlc.coils[cfg.address] ?? false;
                    return (
                      <EffectIcon
                        key={effect}
                        size={10}
                        className={`${isCurrentZone && effectActive ? 'text-amber-400' : 'text-slate-600'}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface OperatorControlPanelProps {
  masterEnable: boolean;
  emergencyStop: boolean;
  safetyGate: boolean;
  stateName: string;
  connected: boolean;
  onMasterToggle: () => void;
  onStart: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
  onSafetyGateToggle: () => void;
  onReset: () => void;
}

function OperatorControlPanel({
  masterEnable,
  emergencyStop,
  safetyGate,
  stateName,
  connected,
  onMasterToggle,
  onStart,
  onStop,
  onEmergencyStop,
  onSafetyGateToggle,
  onReset,
}: OperatorControlPanelProps) {
  const canStart = masterEnable && safetyGate && !emergencyStop && stateName === 'IDLE';
  const canStop = stateName === 'RUNNING' || stateName === 'STARTING';
  const canReset = stateName === 'IDLE' || stateName === 'STOPPING';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Play size={18} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Operator Control Panel</h3>
        {!connected && (
          <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
            Offline
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onMasterToggle}
            disabled={!connected}
            className={`relative w-16 h-8 rounded-full transition-all ${
              masterEnable
                ? 'bg-emerald-500'
                : 'bg-slate-700'
            } ${!connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                masterEnable ? 'left-9' : 'left-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-300">Master Enable</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSafetyGateToggle}
            disabled={!connected}
            className={`relative w-16 h-8 rounded-full transition-all ${
              safetyGate
                ? 'bg-emerald-500'
                : 'bg-slate-700'
            } ${!connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                safetyGate ? 'left-9' : 'left-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-300">Safety Gate</span>
        </div>

        <div className="h-10 w-px bg-slate-700" />

        <button
          onClick={onStart}
          disabled={!connected || !canStart}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            canStart && connected
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play size={18} />
          START
        </button>

        <button
          onClick={onStop}
          disabled={!connected || !canStop}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            canStop && connected
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Square size={18} />
          STOP
        </button>

        <button
          onClick={onEmergencyStop}
          disabled={!connected}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            emergencyStop
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40'
              : connected
              ? 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <AlertOctagon size={18} />
          E-STOP
        </button>

        <div className="h-10 w-px bg-slate-700" />

        <button
          onClick={onReset}
          disabled={!connected || !canReset}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            canReset && connected
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <RotateCcw size={18} />
          RESET
        </button>

        {!canStart && !canStop && connected && (
          <div className="text-xs text-slate-500 ml-2">
            {!masterEnable && 'Enable Master'}
            {masterEnable && !safetyGate && 'Close Safety Gate'}
            {masterEnable && safetyGate && emergencyStop && 'Release E-Stop'}
            {masterEnable && safetyGate && !emergencyStop && stateName !== 'IDLE' && `State: ${stateName}`}
          </div>
        )}
      </div>
    </div>
  );
}
