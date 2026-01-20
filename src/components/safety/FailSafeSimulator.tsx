import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Thermometer,
  Gauge,
  Wind,
} from 'lucide-react';

interface SimulationState {
  running: boolean;
  time: number;
  temperature: number;
  pressure: number;
  flow: number;
  sisTripped: boolean;
  bpcsTripped: boolean;
  safeState: boolean;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  processVariable: 'temperature' | 'pressure' | 'flow';
  normalValue: number;
  tripPoint: number;
  failureMode: 'gradual' | 'sudden' | 'oscillating';
  expectedBehavior: string;
}

const scenarios: Scenario[] = [
  {
    id: 'high-temp',
    name: 'High Temperature Trip',
    description: 'Temperature rises above safe limits',
    processVariable: 'temperature',
    normalValue: 75,
    tripPoint: 95,
    failureMode: 'gradual',
    expectedBehavior: 'SIS should trip before BPCS, closing emergency valves',
  },
  {
    id: 'pressure-spike',
    name: 'Pressure Spike',
    description: 'Sudden pressure increase due to valve failure',
    processVariable: 'pressure',
    normalValue: 50,
    tripPoint: 85,
    failureMode: 'sudden',
    expectedBehavior: 'SIS should immediately open relief valves',
  },
  {
    id: 'flow-loss',
    name: 'Loss of Flow',
    description: 'Cooling flow drops below minimum',
    processVariable: 'flow',
    normalValue: 80,
    tripPoint: 20,
    failureMode: 'gradual',
    expectedBehavior: 'SIS should detect low flow and initiate safe shutdown',
  },
];

export function FailSafeSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [simulation, setSimulation] = useState<SimulationState>({
    running: false,
    time: 0,
    temperature: 75,
    pressure: 50,
    flow: 80,
    sisTripped: false,
    bpcsTripped: false,
    safeState: true,
  });

  useEffect(() => {
    if (!simulation.running) return;

    const interval = setInterval(() => {
      setSimulation(prev => {
        const newState = { ...prev, time: prev.time + 0.1 };

        if (!prev.sisTripped && !prev.bpcsTripped) {
          const pv = selectedScenario.processVariable;
          const currentValue = prev[pv];
          const tripPoint = selectedScenario.tripPoint;
          const isHighTrip = tripPoint > selectedScenario.normalValue;

          let newValue = currentValue;
          switch (selectedScenario.failureMode) {
            case 'gradual':
              newValue = isHighTrip
                ? currentValue + 0.5
                : currentValue - 0.5;
              break;
            case 'sudden':
              if (prev.time > 2 && prev.time < 2.5) {
                newValue = tripPoint + (isHighTrip ? 5 : -5);
              }
              break;
            case 'oscillating':
              newValue = selectedScenario.normalValue + Math.sin(prev.time * 2) * 30;
              break;
          }

          (newState as Record<string, number | boolean>)[pv] = newValue;

          const tripped = isHighTrip ? newValue >= tripPoint : newValue <= tripPoint;
          if (tripped) {
            newState.sisTripped = true;
            newState.safeState = true;
          }
        }

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [simulation.running, selectedScenario]);

  const resetSimulation = () => {
    setSimulation({
      running: false,
      time: 0,
      temperature: 75,
      pressure: 50,
      flow: 80,
      sisTripped: false,
      bpcsTripped: false,
      safeState: true,
    });
  };

  const getValueColor = (variable: string, value: number) => {
    const scenario = scenarios.find(s => s.processVariable === variable);
    if (!scenario) return 'text-white';

    const isHighTrip = scenario.tripPoint > scenario.normalValue;
    const danger = isHighTrip ? value > scenario.tripPoint * 0.9 : value < scenario.tripPoint * 1.1;
    const warning = isHighTrip ? value > scenario.tripPoint * 0.8 : value < scenario.tripPoint * 1.2;

    if (danger) return 'text-red-400';
    if (warning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getVariableIcon = (variable: string) => {
    switch (variable) {
      case 'temperature':
        return Thermometer;
      case 'pressure':
        return Gauge;
      case 'flow':
        return Wind;
      default:
        return Zap;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Select Failure Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => {
                setSelectedScenario(scenario);
                resetSimulation();
              }}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedScenario.id === scenario.id
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = getVariableIcon(scenario.processVariable);
                  return <Icon size={18} className="text-cyan-400" />;
                })()}
                <span className="font-medium text-white">{scenario.name}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{scenario.description}</p>
              <p className="text-xs text-slate-500">Trip: {scenario.tripPoint}%</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white">Process Simulation</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulation(prev => ({ ...prev, running: !prev.running }))}
                disabled={simulation.sisTripped}
                className={`p-2 rounded-lg transition-colors ${
                  simulation.running
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                } disabled:opacity-50`}
              >
                {simulation.running ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={resetSimulation}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { key: 'temperature', label: 'Temperature', unit: 'C', icon: Thermometer },
              { key: 'pressure', label: 'Pressure', unit: 'bar', icon: Gauge },
              { key: 'flow', label: 'Flow Rate', unit: '%', icon: Wind },
            ].map(({ key, label, unit, icon: Icon }) => {
              const value = simulation[key as keyof SimulationState] as number;
              const scenario = scenarios.find(s => s.processVariable === key);
              const isActive = selectedScenario.processVariable === key;

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border ${
                    isActive ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${getValueColor(key, value)}`}>
                    {value.toFixed(1)}
                    <span className="text-sm text-slate-500 ml-1">{unit}</span>
                  </p>
                  {scenario && (
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          scenario.tripPoint > scenario.normalValue
                            ? value >= scenario.tripPoint ? 'bg-red-500' : value >= scenario.tripPoint * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                            : value <= scenario.tripPoint ? 'bg-red-500' : value <= scenario.tripPoint * 1.2 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (value / 100) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Simulation Time</span>
              <span className="text-lg font-mono text-white">{simulation.time.toFixed(1)}s</span>
            </div>

            <div className="h-32 bg-slate-900 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                <div className="text-center">
                  <Zap size={32} className="mx-auto mb-2" />
                  <p className="text-xs">Process trend visualization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Safety System Status</h3>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                simulation.sisTripped
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">SIS Status</span>
                  {simulation.sisTripped ? (
                    <AlertTriangle size={18} className="text-red-400" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  )}
                </div>
                <p className={`text-lg font-semibold mt-1 ${
                  simulation.sisTripped ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {simulation.sisTripped ? 'TRIPPED' : 'NORMAL'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                simulation.safeState
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Process State</span>
                  {simulation.safeState ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
                <p className={`text-lg font-semibold mt-1 ${
                  simulation.safeState ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {simulation.safeState ? 'SAFE' : 'UNSAFE'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Expected Behavior</h3>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-300">{selectedScenario.expectedBehavior}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Trip Point</span>
                <span className="text-white font-mono">{selectedScenario.tripPoint}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Normal Value</span>
                <span className="text-white font-mono">{selectedScenario.normalValue}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Failure Mode</span>
                <span className="text-white capitalize">{selectedScenario.failureMode}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Fail-Safe Principles</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Fail to safe state on loss of power</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Fail to safe state on communication loss</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>SIS trips before BPCS limits reached</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Redundant sensors for critical values</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
