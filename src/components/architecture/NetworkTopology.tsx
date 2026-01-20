import { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Filter,
  Server,
  Shield,
  Database,
  Monitor,
  Cpu,
  Router,
  Activity,
} from 'lucide-react';
import { useLabEnvironment, Device } from '../../contexts/LabEnvironmentContext';

export function NetworkTopology() {
  const { zones, devices, firewallRules } = useLabEnvironment();
  const [zoom, setZoom] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const canvasRef = useRef<HTMLDivElement>(null);

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'plc':
      case 'sis':
        return Cpu;
      case 'hmi':
      case 'scada':
        return Monitor;
      case 'historian':
      case 'server':
        return Database;
      case 'firewall':
        return Shield;
      case 'switch':
      case 'router':
        return Router;
      default:
        return Server;
    }
  };

  const getDeviceColor = (type: Device['type']) => {
    switch (type) {
      case 'plc':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'sis':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'hmi':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'scada':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'historian':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'firewall':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusIndicator = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const filteredDevices = filter === 'all' ? devices : devices.filter(d => d.type === filter);

  const devicesByZone = zones.map(zone => ({
    zone,
    devices: filteredDevices.filter(d => d.zoneId === zone.id),
  })).filter(z => z.devices.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ZoomOut size={18} className="text-slate-400" />
          </button>
          <span className="text-sm text-slate-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ZoomIn size={18} className="text-slate-400" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Maximize2 size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="all">All Devices</option>
            <option value="plc">PLCs</option>
            <option value="sis">Safety Systems</option>
            <option value="hmi">HMIs</option>
            <option value="scada">SCADA</option>
            <option value="firewall">Firewalls</option>
            <option value="historian">Historians</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          ref={canvasRef}
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[600px] overflow-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <div className="space-y-4">
            {devicesByZone.map(({ zone, devices: zoneDevices }) => (
              <div
                key={zone.id}
                className="p-4 rounded-xl border-2 border-dashed"
                style={{ borderColor: zone.color + '50', backgroundColor: zone.color + '08' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                  <h3 className="text-sm font-semibold text-white">{zone.name}</h3>
                  <span className="text-xs text-slate-500 ml-auto">Level {zone.level}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {zoneDevices.map((device) => {
                    const Icon = getDeviceIcon(device.type);
                    const colorClasses = getDeviceColor(device.type);

                    return (
                      <button
                        key={device.id}
                        onClick={() => setSelectedDevice(selectedDevice?.id === device.id ? null : device)}
                        className={`p-3 rounded-lg border transition-all ${colorClasses} ${
                          selectedDevice?.id === device.id ? 'ring-2 ring-cyan-500' : ''
                        } hover:scale-105`}
                      >
                        <div className="flex items-start justify-between">
                          <Icon size={20} />
                          <span className={`w-2 h-2 rounded-full ${getStatusIndicator(device.status)}`} />
                        </div>
                        <p className="text-xs font-medium mt-2 text-left">{device.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 text-left font-mono">{device.ipAddress}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {devicesByZone.length === 0 && (
              <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                <Router size={48} className="mb-4" />
                <p>No devices match the current filter</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedDevice ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Device Details</h3>
                <span className={`w-2 h-2 rounded-full ${getStatusIndicator(selectedDevice.status)}`} />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm text-white font-medium">{selectedDevice.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="text-sm text-white capitalize">{selectedDevice.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">IP Address</p>
                  <p className="text-sm text-white font-mono">{selectedDevice.ipAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Zone</p>
                  <p className="text-sm text-white">
                    {zones.find(z => z.id === selectedDevice.zoneId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Protocols</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDevice.protocols.map((proto) => (
                      <span key={proto} className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
                        {proto}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`text-sm capitalize ${
                    selectedDevice.status === 'online' ? 'text-emerald-400' :
                    selectedDevice.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {selectedDevice.status}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Network Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Total Devices</span>
                  <span className="text-sm font-semibold text-white">{devices.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Online</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {devices.filter(d => d.status === 'online').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Warnings</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {devices.filter(d => d.status === 'warning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Errors</span>
                  <span className="text-sm font-semibold text-red-400">
                    {devices.filter(d => d.status === 'error').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Active Connections</h3>
            <div className="space-y-2">
              {firewallRules.filter(r => r.enabled && r.action === 'allow').slice(0, 5).map((rule) => (
                <div key={rule.id} className="p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{rule.name}</span>
                    <Activity size={12} className="text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">{rule.protocol}</span>
                    <span className="text-[10px] text-slate-600">:</span>
                    <span className="text-[10px] font-mono text-slate-500">{rule.ports}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Legend</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'plc', label: 'PLC' },
                { type: 'sis', label: 'Safety' },
                { type: 'hmi', label: 'HMI' },
                { type: 'scada', label: 'SCADA' },
                { type: 'firewall', label: 'Firewall' },
                { type: 'historian', label: 'Historian' },
              ].map(({ type, label }) => {
                const Icon = getDeviceIcon(type as Device['type']);
                const colorClasses = getDeviceColor(type as Device['type']);
                return (
                  <div key={type} className={`p-2 rounded-lg ${colorClasses} flex items-center gap-2`}>
                    <Icon size={14} />
                    <span className="text-xs">{label}</span>
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
