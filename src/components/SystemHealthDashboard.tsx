import React from 'react';
import { Gauge, Thermometer, Zap, AlertTriangle } from 'lucide-react';
import { ProcessVariables } from '../utils/processSimulation';

interface SystemHealthDashboardProps {
  processVars: ProcessVariables;
  runtimeHours: number;
  cycleCount: number;
}

export function SystemHealthDashboard({ processVars, runtimeHours, cycleCount }: SystemHealthDashboardProps) {
  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const healthScore = calculateOverallHealth(processVars);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Overall Health</h3>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor(healthScore, { good: 80, warning: 60 })}`}>
            {healthScore}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getHealthBg(healthScore, { good: 80, warning: 60 })}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Runtime: {runtimeHours}h | Cycles: {cycleCount}
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Motor Current</h3>
          </div>
          <span className="text-2xl font-bold text-white">
            {processVars.motorCurrentAmps}A
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-yellow-500 transition-all"
            style={{ width: `${Math.min(100, (processVars.motorCurrentAmps / 150) * 100)}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Normal: 50-130A
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-400" />
            <h3 className="text-white font-semibold">Bearing Temp</h3>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor(100 - processVars.bearingTempCelsius, { good: 45, warning: 20 })}`}>
            {processVars.bearingTempCelsius}°C
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getHealthBg(100 - processVars.bearingTempCelsius, { good: 45, warning: 20 })}`}
            style={{ width: `${Math.min(100, (processVars.bearingTempCelsius / 100) * 100)}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Max: 85°C | Critical: 100°C
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Hydraulic Pressure</h3>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor(processVars.hydraulicPressurePsi / 12, { good: 100, warning: 83 })}`}>
            {processVars.hydraulicPressurePsi} PSI
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getHealthBg(processVars.hydraulicPressurePsi / 12, { good: 100, warning: 83 })}`}
            style={{ width: `${Math.min(100, (processVars.hydraulicPressurePsi / 1400) * 100)}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Normal: 1100-1300 PSI
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Vibration Level</h3>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor(50 - processVars.vibrationLevel, { good: 30, warning: 20 })}`}>
            {processVars.vibrationLevel}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getHealthBg(50 - processVars.vibrationLevel, { good: 30, warning: 20 })}`}
            style={{ width: `${Math.min(100, (processVars.vibrationLevel / 50) * 100)}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Normal: 10-20 | Warning: 30+
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-red-400" />
            <h3 className="text-white font-semibold">Brake Wear</h3>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor(100 - processVars.brakeWearPercent, { good: 50, warning: 20 })}`}>
            {processVars.brakeWearPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getHealthBg(100 - processVars.brakeWearPercent, { good: 50, warning: 20 })}`}
            style={{ width: `${processVars.brakeWearPercent}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Replace at 100%
        </div>
      </div>

      {processVars.safetyViolationCount > 0 && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 col-span-full">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-red-400 font-semibold">Safety Violations</h3>
            <span className="text-2xl font-bold text-red-400 ml-auto">
              {processVars.safetyViolationCount}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Safety violations detected. Review system logs and address issues immediately.
          </p>
        </div>
      )}
    </div>
  );
}

function calculateOverallHealth(vars: ProcessVariables): number {
  const tempScore = Math.max(0, 100 - (vars.bearingTempCelsius - 25));
  const brakeScore = 100 - vars.brakeWearPercent;
  const vibrationScore = Math.max(0, 100 - (vars.vibrationLevel * 2));
  const pressureScore = Math.max(0, (vars.hydraulicPressurePsi / 1200) * 100);
  const safetyScore = Math.max(0, 100 - (vars.safetyViolationCount * 10));

  return Math.round((tempScore + brakeScore + vibrationScore + pressureScore + safetyScore) / 5);
}
