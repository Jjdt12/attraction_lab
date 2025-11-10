import React, { useState } from 'react';
import { Network, Activity, ArrowRight, Filter } from 'lucide-react';
import { ModbusOperation, PLCType } from '../hooks/useMultiPLCConnection';

interface NetworkMonitorProps {
  operations: ModbusOperation[];
  onClear: () => void;
}

export function NetworkMonitor({ operations, onClear }: NetworkMonitorProps) {
  const [filterPLC, setFilterPLC] = useState<PLCType | 'ALL'>('ALL');
  const [filterOperation, setFilterOperation] = useState<string>('ALL');

  const filteredOps = operations.filter(op => {
    if (filterPLC !== 'ALL' && op.plc !== filterPLC) return false;
    if (filterOperation !== 'ALL' && !op.operation.includes(filterOperation)) return false;
    return true;
  });

  const getPLCColor = (plc: PLCType) => {
    switch (plc) {
      case 'MAIN':
        return 'text-green-400 bg-green-900/20';
      case 'SAFETY':
        return 'text-orange-400 bg-orange-900/20';
      case 'EFFECTS':
        return 'text-purple-400 bg-purple-900/20';
    }
  };

  const getOperationColor = (operation: string) => {
    if (operation.includes('WRITE')) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Network Traffic Monitor</h3>
          <span className="text-sm text-gray-400">({filteredOps.length} operations)</span>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={filterPLC}
            onChange={(e) => setFilterPLC(e.target.value as PLCType | 'ALL')}
            className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All PLCs</option>
            <option value="MAIN">Main</option>
            <option value="SAFETY">Safety</option>
            <option value="EFFECTS">Effects</option>
          </select>

          <select
            value={filterOperation}
            onChange={(e) => setFilterOperation(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All Operations</option>
            <option value="READ">Reads</option>
            <option value="WRITE">Writes</option>
          </select>

          <button
            onClick={onClear}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
        {filteredOps.length === 0 && (
          <div className="text-center py-8 text-gray-400">No network traffic to display</div>
        )}

        {filteredOps.map((op, index) => (
          <div
            key={index}
            className="hover:bg-gray-800/50 px-3 py-2 rounded border-l-2 border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 whitespace-nowrap">
                {formatTimestamp(op.timestamp)}
              </span>

              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPLCColor(op.plc)}`}>
                {op.plc}
              </span>

              <Activity className="h-3 w-3 text-gray-600" />

              <span className={`font-semibold whitespace-nowrap ${getOperationColor(op.operation)}`}>
                {op.operation}
              </span>

              <ArrowRight className="h-3 w-3 text-gray-600" />

              <span className="text-gray-400">
                Addr: <span className="text-white">{op.address}</span>
              </span>

              {op.count !== undefined && (
                <span className="text-gray-400">
                  Count: <span className="text-white">{op.count}</span>
                </span>
              )}

              {op.value !== undefined && (
                <span className="text-gray-400">
                  Value: <span className="text-white">{op.value.toString()}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400 text-xs">Total Operations</div>
            <div className="text-2xl font-bold text-white">{operations.length}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400 text-xs">Read Operations</div>
            <div className="text-2xl font-bold text-blue-400">
              {operations.filter(op => op.operation.includes('READ')).length}
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400 text-xs">Write Operations</div>
            <div className="text-2xl font-bold text-yellow-400">
              {operations.filter(op => op.operation.includes('WRITE')).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
