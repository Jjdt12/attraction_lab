import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Shield,
  Server,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useLabEnvironment, Zone, Device } from '../../contexts/LabEnvironmentContext';

export function ZoneEditor() {
  const {
    zones,
    devices,
    addZone,
    updateZone,
    removeZone,
    addDevice,
    updateDevice,
    removeDevice,
    recalculateAssessment,
  } = useLabEnvironment();

  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState<string | null>(null);

  const [newZone, setNewZone] = useState({
    name: '',
    level: 3,
    securityLevel: 2,
    color: '#06b6d4',
  });

  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'plc' as Device['type'],
    ipAddress: '',
    protocols: [] as string[],
  });

  const handleAddZone = () => {
    addZone({
      name: newZone.name,
      level: newZone.level,
      securityLevel: newZone.securityLevel,
      devices: [],
      color: newZone.color,
    });
    setNewZone({ name: '', level: 3, securityLevel: 2, color: '#06b6d4' });
    setShowAddZone(false);
    recalculateAssessment();
  };

  const handleAddDevice = (zoneId: string) => {
    addDevice({
      name: newDevice.name,
      type: newDevice.type,
      ipAddress: newDevice.ipAddress,
      zoneId,
      protocols: newDevice.protocols,
      status: 'online',
    });
    setNewDevice({ name: '', type: 'plc', ipAddress: '', protocols: [] });
    setShowAddDevice(null);
    recalculateAssessment();
  };

  const protocolOptions = ['Modbus TCP', 'Ethernet/IP', 'ProfiNET', 'OPC UA', 'DNP3', 'HART', 'ProfiSafe'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Configure security zones and assign devices to each zone. Each zone should have appropriate security controls.
          </p>
        </div>
        <button
          onClick={() => setShowAddZone(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Zone</span>
        </button>
      </div>

      {showAddZone && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Add New Zone</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Zone Name</label>
              <input
                type="text"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="e.g., Control Room"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Purdue Level</label>
              <select
                value={newZone.level}
                onChange={(e) => setNewZone({ ...newZone, level: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {[0, 1, 2, 3, 3.5, 4, 5].map((level) => (
                  <option key={level} value={level}>Level {level}{level === 3.5 ? ' (IDMZ)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Security Level (SL)</label>
              <select
                value={newZone.securityLevel}
                onChange={(e) => setNewZone({ ...newZone, securityLevel: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {[1, 2, 3, 4].map((sl) => (
                  <option key={sl} value={sl}>SL {sl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Color</label>
              <input
                type="color"
                value={newZone.color}
                onChange={(e) => setNewZone({ ...newZone, color: e.target.value })}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddZone(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddZone}
              disabled={!newZone.name}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Zone
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {zones.sort((a, b) => b.level - a.level).map((zone) => {
          const zoneDevices = devices.filter(d => d.zoneId === zone.id);
          const isExpanded = expandedZone === zone.id;

          return (
            <div
              key={zone.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-12 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{zone.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                        Level {zone.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {zoneDevices.length} devices | Security Level {zone.securityLevel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    zone.securityLevel >= 3 ? 'bg-emerald-500/10 text-emerald-400' :
                    zone.securityLevel >= 2 ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    <Shield size={14} />
                    <span className="text-xs">SL {zone.securityLevel}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-400">Zone Devices</h4>
                    <button
                      onClick={() => setShowAddDevice(zone.id)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add Device</span>
                    </button>
                  </div>

                  {showAddDevice === zone.id && (
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Device Name</label>
                          <input
                            type="text"
                            value={newDevice.name}
                            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            placeholder="e.g., Main PLC"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Type</label>
                          <select
                            value={newDevice.type}
                            onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value as Device['type'] })}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="plc">PLC</option>
                            <option value="hmi">HMI</option>
                            <option value="scada">SCADA</option>
                            <option value="sis">Safety (SIS)</option>
                            <option value="historian">Historian</option>
                            <option value="firewall">Firewall</option>
                            <option value="server">Server</option>
                            <option value="workstation">Workstation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">IP Address</label>
                          <input
                            type="text"
                            value={newDevice.ipAddress}
                            onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            placeholder="10.0.1.10"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => handleAddDevice(zone.id)}
                            disabled={!newDevice.name || !newDevice.ipAddress}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded transition-colors disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowAddDevice(null)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {zoneDevices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {zoneDevices.map((device) => (
                        <div
                          key={device.id}
                          className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Server size={16} className="text-slate-400" />
                            <div>
                              <p className="text-sm text-white">{device.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{device.ipAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              device.status === 'online' ? 'bg-emerald-500' :
                              device.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <button
                              onClick={() => removeDevice(device.id)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No devices in this zone</p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Security Level</label>
                        <select
                          value={zone.securityLevel}
                          onChange={(e) => {
                            updateZone(zone.id, { securityLevel: Number(e.target.value) });
                            recalculateAssessment();
                          }}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {[1, 2, 3, 4].map((sl) => (
                            <option key={sl} value={sl}>SL {sl}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this zone?')) {
                          removeZone(zone.id);
                          recalculateAssessment();
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      <span className="text-sm">Delete Zone</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
