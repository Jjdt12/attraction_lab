import React from 'react';
import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { useAlarmSystem, Alarm, AlarmSeverity } from '../hooks/useAlarmSystem';

export function AlarmPanel() {
  const { activeAlarms, acknowledgeAlarm, clearAlarm } = useAlarmSystem();

  const criticalAlarms = activeAlarms.filter(a => a.severity === 'CRITICAL');
  const warningAlarms = activeAlarms.filter(a => a.severity === 'WARNING');
  const infoAlarms = activeAlarms.filter(a => a.severity === 'INFO');

  if (activeAlarms.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 shadow-lg">
      {criticalAlarms.length > 0 && (
        <div className="bg-red-600 border-b-2 border-red-800 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-white" />
              <span className="text-white font-bold">CRITICAL ALARM: {criticalAlarms[0].alarmName}</span>
            </div>
            <div className="flex gap-2">
              {!criticalAlarms[0].acknowledged && (
                <button
                  onClick={() => acknowledgeAlarm(criticalAlarms[0].id)}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-sm flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Acknowledge
                </button>
              )}
              <button
                onClick={() => clearAlarm(criticalAlarms[0].id)}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-sm flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {criticalAlarms.length === 0 && warningAlarms.length > 0 && (
        <div className="bg-yellow-500 border-b-2 border-yellow-700">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-900" />
              <span className="text-gray-900 font-semibold">WARNING: {warningAlarms[0].alarmName}</span>
            </div>
            <div className="flex gap-2">
              {!warningAlarms[0].acknowledged && (
                <button
                  onClick={() => acknowledgeAlarm(warningAlarms[0].id)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Acknowledge
                </button>
              )}
              <button
                onClick={() => clearAlarm(warningAlarms[0].id)}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {criticalAlarms.length === 0 && warningAlarms.length === 0 && infoAlarms.length > 0 && (
        <div className="bg-blue-500 border-b-2 border-blue-700">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-white" />
              <span className="text-white">INFO: {infoAlarms[0].alarmName}</span>
            </div>
            <button
              onClick={() => clearAlarm(infoAlarms[0].id)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AlarmListProps {
  showHistory?: boolean;
}

export function AlarmList({ showHistory = false }: AlarmListProps) {
  const { activeAlarms, alarmHistory, acknowledgeAlarm, clearAlarm } = useAlarmSystem();

  const alarms = showHistory ? alarmHistory : activeAlarms;

  const getSeverityIcon = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900/20 border-red-500';
      case 'WARNING':
        return 'bg-yellow-900/20 border-yellow-500';
      case 'INFO':
        return 'bg-blue-900/20 border-blue-500';
    }
  };

  return (
    <div className="space-y-2">
      {alarms.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No {showHistory ? 'alarm history' : 'active alarms'}
        </div>
      )}

      {alarms.map(alarm => (
        <div
          key={alarm.id}
          className={`border-l-4 p-4 rounded-r ${getSeverityColor(alarm.severity)} bg-gray-800`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getSeverityIcon(alarm.severity)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{alarm.alarmCode}</span>
                  <span className="text-sm text-gray-400">({alarm.plcName})</span>
                  {alarm.acknowledged && (
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded">ACK</span>
                  )}
                </div>
                <div className="text-white mt-1">{alarm.alarmName}</div>
                {alarm.alarmDescription && (
                  <div className="text-sm text-gray-400 mt-1">{alarm.alarmDescription}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {alarm.triggeredAt.toLocaleString()}
                  {alarm.clearedAt && ` - Cleared: ${alarm.clearedAt.toLocaleString()}`}
                </div>
                {alarm.triggerValue && (
                  <div className="text-xs text-gray-400 mt-1">Trigger value: {alarm.triggerValue}</div>
                )}
              </div>
            </div>

            {!alarm.clearedAt && (
              <div className="flex gap-2 ml-4">
                {!alarm.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlarm(alarm.id)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    ACK
                  </button>
                )}
                <button
                  onClick={() => clearAlarm(alarm.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
