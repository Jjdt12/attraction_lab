import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';
import { useLabEnvironment, FirewallRule } from '../../contexts/LabEnvironmentContext';

export function FirewallManager() {
  const { zones, firewallRules, addFirewallRule, updateFirewallRule, removeFirewallRule } = useLabEnvironment();
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<'all' | 'allow' | 'deny'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newRule, setNewRule] = useState<Omit<FirewallRule, 'id'>>({
    name: '',
    sourceZone: '',
    destZone: '',
    protocol: 'Modbus TCP',
    ports: '502',
    action: 'allow',
    enabled: true,
  });

  const handleAddRule = () => {
    addFirewallRule(newRule);
    setNewRule({
      name: '',
      sourceZone: '',
      destZone: '',
      protocol: 'Modbus TCP',
      ports: '502',
      action: 'allow',
      enabled: true,
    });
    setShowAddRule(false);
  };

  const filteredRules = firewallRules
    .filter(r => filterAction === 'all' || r.action === filterAction)
    .filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.protocol.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const allowCount = firewallRules.filter(r => r.action === 'allow' && r.enabled).length;
  const denyCount = firewallRules.filter(r => r.action === 'deny' && r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Rules</p>
          <p className="text-2xl font-bold text-white">{firewallRules.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Allow Rules</p>
          <p className="text-2xl font-bold text-emerald-400">{allowCount}</p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Deny Rules</p>
          <p className="text-2xl font-bold text-red-400">{denyCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Disabled</p>
          <p className="text-2xl font-bold text-slate-500">
            {firewallRules.filter(r => !r.enabled).length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {(['all', 'allow', 'deny'] as const).map((action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filterAction === action
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Rule</span>
        </button>
      </div>

      {showAddRule && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Add Firewall Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="e.g., Allow HMI to PLC"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Source Zone</label>
              <select
                value={newRule.sourceZone}
                onChange={(e) => setNewRule({ ...newRule, sourceZone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Destination Zone</label>
              <select
                value={newRule.destZone}
                onChange={(e) => setNewRule({ ...newRule, destZone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Protocol</label>
              <select
                value={newRule.protocol}
                onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="Modbus TCP">Modbus TCP</option>
                <option value="Ethernet/IP">Ethernet/IP</option>
                <option value="OPC UA">OPC UA</option>
                <option value="ProfiNET">ProfiNET</option>
                <option value="DNP3">DNP3</option>
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="SSH">SSH</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ports</label>
              <input
                type="text"
                value={newRule.ports}
                onChange={(e) => setNewRule({ ...newRule, ports: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="e.g., 502"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Action</label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as 'allow' | 'deny' | 'log' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
                <option value="log">Log Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddRule(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRule}
              disabled={!newRule.name || !newRule.sourceZone || !newRule.destZone}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Rule
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Rule Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Source</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400"></th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Destination</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Protocol</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Ports</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Action</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => {
              const sourceZone = zones.find(z => z.id === rule.sourceZone);
              const destZone = zones.find(z => z.id === rule.destZone);

              return (
                <tr key={rule.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => updateFirewallRule(rule.id, { enabled: !rule.enabled })}
                      className={`p-1.5 rounded-lg transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {rule.enabled ? <Shield size={14} /> : <ShieldOff size={14} />}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${rule.enabled ? 'text-white' : 'text-slate-500'}`}>
                      {rule.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {sourceZone && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sourceZone.color }}
                        />
                      )}
                      <span className="text-xs text-slate-400">
                        {sourceZone?.name.split(' ')[0] || rule.sourceZone}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ArrowRight size={14} className="text-slate-600" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {destZone && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: destZone.color }}
                        />
                      )}
                      <span className="text-xs text-slate-400">
                        {destZone?.name.split(' ')[0] || rule.destZone}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono text-slate-400">{rule.protocol}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono text-slate-400">{rule.ports}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      rule.action === 'allow'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : rule.action === 'deny'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rule.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => removeFirewallRule(rule.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRules.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <Shield size={32} className="mx-auto mb-2 opacity-50" />
            <p>No firewall rules match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
