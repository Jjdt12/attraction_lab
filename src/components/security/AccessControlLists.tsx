import { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  User,
  UserCog,
  Eye,
  Pencil,
  Settings,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface AccessPolicy {
  id: string;
  name: string;
  zoneId: string;
  role: 'operator' | 'engineer' | 'admin' | 'vendor' | 'readonly';
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
    configure: boolean;
  };
  timeRestrictions?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    daysOfWeek: number[];
  };
  mfaRequired: boolean;
}

const defaultPolicies: AccessPolicy[] = [
  {
    id: '1',
    name: 'Operator Access - Control Zone',
    zoneId: 'z3',
    role: 'operator',
    permissions: { read: true, write: true, execute: true, configure: false },
    mfaRequired: false,
  },
  {
    id: '2',
    name: 'Engineer Access - All Zones',
    zoneId: 'z4',
    role: 'engineer',
    permissions: { read: true, write: true, execute: true, configure: true },
    mfaRequired: true,
  },
  {
    id: '3',
    name: 'Vendor Remote Access',
    zoneId: 'idmz',
    role: 'vendor',
    permissions: { read: true, write: false, execute: false, configure: false },
    timeRestrictions: { enabled: true, startHour: 8, endHour: 18, daysOfWeek: [1, 2, 3, 4, 5] },
    mfaRequired: true,
  },
  {
    id: '4',
    name: 'SCADA Read-Only',
    zoneId: 'z2',
    role: 'readonly',
    permissions: { read: true, write: false, execute: false, configure: false },
    mfaRequired: false,
  },
];

export function AccessControlLists() {
  const { zones } = useLabEnvironment();
  const [policies, setPolicies] = useState<AccessPolicy[]>(defaultPolicies);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [showAddPolicy, setShowAddPolicy] = useState(false);

  const [newPolicy, setNewPolicy] = useState<Omit<AccessPolicy, 'id'>>({
    name: '',
    zoneId: '',
    role: 'operator',
    permissions: { read: true, write: false, execute: false, configure: false },
    mfaRequired: false,
  });

  const handleAddPolicy = () => {
    setPolicies(prev => [...prev, { ...newPolicy, id: Math.random().toString(36).substring(7) }]);
    setNewPolicy({
      name: '',
      zoneId: '',
      role: 'operator',
      permissions: { read: true, write: false, execute: false, configure: false },
      mfaRequired: false,
    });
    setShowAddPolicy(false);
  };

  const removePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  const getRoleIcon = (role: AccessPolicy['role']) => {
    switch (role) {
      case 'admin':
        return UserCog;
      case 'engineer':
        return Settings;
      case 'operator':
        return User;
      case 'vendor':
        return Users;
      case 'readonly':
        return Eye;
    }
  };

  const getRoleColor = (role: AccessPolicy['role']) => {
    switch (role) {
      case 'admin':
        return 'text-red-400 bg-red-500/10';
      case 'engineer':
        return 'text-amber-400 bg-amber-500/10';
      case 'operator':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'vendor':
        return 'text-blue-400 bg-blue-500/10';
      case 'readonly':
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Policies</p>
          <p className="text-2xl font-bold text-white">{policies.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">MFA Required</p>
          <p className="text-2xl font-bold text-emerald-400">
            {policies.filter(p => p.mfaRequired).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Time Restricted</p>
          <p className="text-2xl font-bold text-amber-400">
            {policies.filter(p => p.timeRestrictions?.enabled).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Write Access</p>
          <p className="text-2xl font-bold text-cyan-400">
            {policies.filter(p => p.permissions.write).length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Define role-based access policies for each security zone.
        </p>
        <button
          onClick={() => setShowAddPolicy(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Policy</span>
        </button>
      </div>

      {showAddPolicy && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Add Access Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Policy Name</label>
              <input
                type="text"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="e.g., Maintenance Access"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Zone</label>
              <select
                value={newPolicy.zoneId}
                onChange={(e) => setNewPolicy({ ...newPolicy, zoneId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Role</label>
              <select
                value={newPolicy.role}
                onChange={(e) => setNewPolicy({ ...newPolicy, role: e.target.value as AccessPolicy['role'] })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="readonly">Read Only</option>
                <option value="operator">Operator</option>
                <option value="engineer">Engineer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Permissions</label>
            <div className="flex flex-wrap gap-3">
              {(['read', 'write', 'execute', 'configure'] as const).map((perm) => (
                <label key={perm} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPolicy.permissions[perm]}
                    onChange={(e) => setNewPolicy({
                      ...newPolicy,
                      permissions: { ...newPolicy.permissions, [perm]: e.target.checked }
                    })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-300 capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPolicy.mfaRequired}
                onChange={(e) => setNewPolicy({ ...newPolicy, mfaRequired: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Require MFA</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddPolicy(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPolicy}
              disabled={!newPolicy.name || !newPolicy.zoneId}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Policy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {policies.map((policy) => {
          const zone = zones.find(z => z.id === policy.zoneId);
          const RoleIcon = getRoleIcon(policy.role);
          const isExpanded = expandedPolicy === policy.id;

          return (
            <div
              key={policy.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getRoleColor(policy.role)}`}>
                    <RoleIcon size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">{policy.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {zone && (
                        <span className="text-xs text-slate-500">{zone.name}</span>
                      )}
                      {policy.mfaRequired && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                          MFA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {policy.permissions.read && (
                      <Eye size={14} className="text-slate-500" title="Read" />
                    )}
                    {policy.permissions.write && (
                      <Pencil size={14} className="text-amber-500" title="Write" />
                    )}
                    {policy.permissions.execute && (
                      <Shield size={14} className="text-cyan-500" title="Execute" />
                    )}
                    {policy.permissions.configure && (
                      <Settings size={14} className="text-red-500" title="Configure" />
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Role</p>
                      <p className="text-sm text-white capitalize">{policy.role}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Zone</p>
                      <p className="text-sm text-white">{zone?.name.split(' ')[0]}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">MFA</p>
                      <p className={`text-sm ${policy.mfaRequired ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {policy.mfaRequired ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Time Restricted</p>
                      <p className={`text-sm ${policy.timeRestrictions?.enabled ? 'text-amber-400' : 'text-slate-400'}`}>
                        {policy.timeRestrictions?.enabled
                          ? `${policy.timeRestrictions.startHour}:00 - ${policy.timeRestrictions.endHour}:00`
                          : 'No restrictions'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Permissions:</span>
                      {Object.entries(policy.permissions)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <span key={k} className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 capitalize">
                            {k}
                          </span>
                        ))}
                    </div>
                    <button
                      onClick={() => removePolicy(policy.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      <span className="text-sm">Remove</span>
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
