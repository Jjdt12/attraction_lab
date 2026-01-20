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
} from 'lucide-react';
import { usePlcConnection } from '../../hooks/usePlcConnection';

const EVENT_CONFIG = [
  { name: 'Loading Gate', icon: CircleDot, color: 'cyan' },
  { name: 'Safety Interlock', icon: Shield, color: 'emerald' },
  { name: 'Launch', icon: Zap, color: 'amber' },
  { name: 'Photo Flash', icon: Camera, color: 'blue' },
  { name: 'Mid Brake', icon: Square, color: 'orange' },
  { name: 'Track Switch', icon: Activity, color: 'teal' },
  { name: 'Final Brake', icon: Square, color: 'red' },
  { name: 'Station', icon: MapPin, color: 'emerald' },
  { name: 'Unload', icon: CircleDot, color: 'cyan' },
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

  const currentZone = position < 120 ? 1 : position < 240 ? 2 : 3;

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
            <span className="text-slate-400">/ 360</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200"
              style={{ width: `${(position / 360) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">Speed: {speed}</span>
            <span className="text-xs text-slate-500">Zone {currentZone}</span>
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
            <PlcStatusRow name="Main PLC" connected={mainPlc.connected} port={502} />
            <PlcStatusRow name="Safety PLC" connected={safetyPlc.connected} port={503} />
            <PlcStatusRow name="Effects PLC" connected={effectsPlc.connected} port={504} />
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
              range="0-119"
            />
            <ZoneStatus
              zone={2}
              enabled={zone2Enable}
              active={currentZone === 2}
              range="120-239"
            />
            <ZoneStatus
              zone={3}
              enabled={zone3Enable}
              active={currentZone === 3}
              range="240-359"
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Track Visualization</h3>
        </div>
        <TrackVisualization position={position} events={EVENT_CONFIG} mainPlc={mainPlc} />
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
}: {
  zone: number;
  enabled: boolean;
  active: boolean;
  range: string;
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
        <p className="text-xs text-slate-400">Positions {range}</p>
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
}

function TrackVisualization({ position, events, mainPlc }: TrackVisualizationProps) {
  const eventPositions = [20, 60, 100, 140, 180, 220, 260, 300, 340];

  return (
    <div className="relative h-24">
      <div className="absolute inset-x-0 top-1/2 h-3 bg-slate-800 rounded-full -translate-y-1/2">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/30 to-transparent rounded-full transition-all duration-200"
          style={{ width: `${(position / 360) * 100}%` }}
        />
      </div>

      {[0, 120, 240].map((zoneStart, i) => (
        <div
          key={i}
          className="absolute top-1/2 w-0.5 h-6 bg-slate-600 -translate-y-1/2"
          style={{ left: `${(zoneStart / 360) * 100}%` }}
        />
      ))}

      {eventPositions.map((pos, index) => {
        const activeCoil = 17 + index;
        const isActive = mainPlc.coils[activeCoil] ?? false;
        return (
          <div
            key={index}
            className={`absolute top-1/2 w-4 h-4 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-all ${
              isActive
                ? 'bg-cyan-400 border-cyan-400 scale-125'
                : 'bg-slate-700 border-slate-600'
            }`}
            style={{ left: `${(pos / 360) * 100}%` }}
            title={events[index].name}
          />
        );
      })}

      <div
        className="absolute top-1/2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10"
        style={{ left: `${(position / 360) * 100}%` }}
      >
        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-1">
        <span>0</span>
        <span>Zone 1</span>
        <span>120</span>
        <span>Zone 2</span>
        <span>240</span>
        <span>Zone 3</span>
        <span>360</span>
      </div>
    </div>
  );
}
