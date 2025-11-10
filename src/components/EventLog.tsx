import React, { useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { useAlarmSystem, SystemEvent, AlarmSeverity, PLCName } from '../hooks/useAlarmSystem';

export function EventLog() {
  const { recentEvents } = useAlarmSystem();
  const [filterSeverity, setFilterSeverity] = useState<AlarmSeverity | 'ALL'>('ALL');
  const [filterPLC, setFilterPLC] = useState<PLCName | 'ALL'>('ALL');

  const filteredEvents = recentEvents.filter(event => {
    if (filterSeverity !== 'ALL' && event.severity !== filterSeverity) return false;
    if (filterPLC !== 'ALL' && event.plcName !== filterPLC) return false;
    return true;
  });

  const getSeverityColor = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400';
      case 'WARNING':
        return 'text-yellow-400';
      case 'INFO':
        return 'text-blue-400';
    }
  };

  const getPLCColor = (plc: PLCName) => {
    switch (plc) {
      case 'MAIN':
        return 'text-green-400';
      case 'SAFETY':
        return 'text-orange-400';
      case 'EFFECTS':
        return 'text-purple-400';
      case 'SYSTEM':
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Event Log</h3>
          <span className="text-sm text-gray-400">({filteredEvents.length} events)</span>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as AlarmSeverity | 'ALL')}
            className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          <select
            value={filterPLC}
            onChange={(e) => setFilterPLC(e.target.value as PLCName | 'ALL')}
            className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All PLCs</option>
            <option value="MAIN">Main</option>
            <option value="SAFETY">Safety</option>
            <option value="EFFECTS">Effects</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-sm">
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-400">No events to display</div>
        )}

        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="hover:bg-gray-800/50 px-3 py-2 rounded border-l-2"
            style={{
              borderLeftColor:
                event.severity === 'CRITICAL' ? '#ef4444' :
                event.severity === 'WARNING' ? '#eab308' : '#3b82f6'
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {event.timestamp.toLocaleTimeString()}
              </span>

              <span className={`font-semibold text-xs whitespace-nowrap ${getSeverityColor(event.severity)}`}>
                {event.severity}
              </span>

              <span className={`text-xs whitespace-nowrap ${getPLCColor(event.plcName)}`}>
                [{event.plcName}]
              </span>

              <span className="text-xs text-gray-400 whitespace-nowrap">
                {event.eventType}
              </span>

              <span className="text-white flex-1">
                {event.message}
              </span>
            </div>

            {Object.keys(event.details).length > 0 && (
              <div className="ml-32 mt-1 text-xs text-gray-500">
                {JSON.stringify(event.details)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
