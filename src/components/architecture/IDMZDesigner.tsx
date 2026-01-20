import { useState } from 'react';
import {
  Shield,
  Server,
  Database,
  Router,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface IDMZComponent {
  id: string;
  name: string;
  type: 'jump-server' | 'data-diode' | 'historian-mirror' | 'patch-server' | 'remote-access' | 'firewall';
  enabled: boolean;
  direction: 'it-to-ot' | 'ot-to-it' | 'bidirectional';
  description: string;
}

const defaultComponents: IDMZComponent[] = [
  { id: '1', name: 'Jump Server', type: 'jump-server', enabled: true, direction: 'bidirectional', description: 'Secure access point for authorized personnel' },
  { id: '2', name: 'Data Diode', type: 'data-diode', enabled: true, direction: 'ot-to-it', description: 'Hardware-enforced one-way data transfer' },
  { id: '3', name: 'Historian Mirror', type: 'historian-mirror', enabled: true, direction: 'ot-to-it', description: 'Read-only replica of OT historian data' },
  { id: '4', name: 'Patch Server', type: 'patch-server', enabled: false, direction: 'it-to-ot', description: 'Staging area for OT system updates' },
  { id: '5', name: 'Remote Access Gateway', type: 'remote-access', enabled: true, direction: 'bidirectional', description: 'Vendor and remote operator access' },
];

export function IDMZDesigner() {
  const [components, setComponents] = useState<IDMZComponent[]>(defaultComponents);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const { firewallRules, addFirewallRule } = useLabEnvironment();

  const toggleComponent = (id: string) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const getDirectionIcon = (direction: IDMZComponent['direction']) => {
    switch (direction) {
      case 'it-to-ot':
        return <ArrowRight size={16} className="text-blue-400" />;
      case 'ot-to-it':
        return <ArrowLeft size={16} className="text-emerald-400" />;
      case 'bidirectional':
        return (
          <div className="flex items-center">
            <ArrowLeft size={14} className="text-emerald-400" />
            <ArrowRight size={14} className="text-blue-400 -ml-1" />
          </div>
        );
    }
  };

  const getTypeIcon = (type: IDMZComponent['type']) => {
    switch (type) {
      case 'jump-server':
        return Server;
      case 'data-diode':
        return Lock;
      case 'historian-mirror':
        return Database;
      case 'patch-server':
        return Settings;
      case 'remote-access':
        return Router;
      case 'firewall':
        return Shield;
    }
  };

  const enabledCount = components.filter(c => c.enabled).length;
  const securityScore = Math.min(100, enabledCount * 20);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">IDMZ Score</p>
          <p className="text-2xl font-bold text-white">{securityScore}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                securityScore >= 80 ? 'bg-emerald-500' : securityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Components Active</p>
          <p className="text-2xl font-bold text-white">{enabledCount}/{components.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Data Diode</p>
          <div className="flex items-center gap-2">
            {components.find(c => c.type === 'data-diode')?.enabled ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Active</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-amber-400" />
                <span className="text-amber-400 font-semibold">Disabled</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">IDMZ Rules</p>
          <p className="text-2xl font-bold text-white">
            {firewallRules.filter(r => r.sourceZone === 'idmz' || r.destZone === 'idmz').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server size={18} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Enterprise Network</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Level 4-5: IT Systems</p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Server size={16} className="text-blue-400" />
              <span className="text-sm text-slate-300">Business Applications</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Database size={16} className="text-blue-400" />
              <span className="text-sm text-slate-300">ERP/MES Systems</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Router size={16} className="text-blue-400" />
              <span className="text-sm text-slate-300">Internet Gateway</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-pink-500/10 to-slate-900 border border-pink-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Shield size={18} className="text-pink-400" />
              </div>
              <h3 className="font-semibold text-white">Industrial DMZ</h3>
            </div>
            <button className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus size={16} className="text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Security Buffer Zone</p>

          <div className="space-y-2">
            {components.map((component) => {
              const Icon = getTypeIcon(component.type);
              return (
                <button
                  key={component.id}
                  onClick={() => setSelectedComponent(selectedComponent === component.id ? null : component.id)}
                  className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                    component.enabled
                      ? 'bg-slate-800/80 border border-pink-500/30'
                      : 'bg-slate-800/30 border border-slate-700/50 opacity-50'
                  } ${selectedComponent === component.id ? 'ring-2 ring-pink-500/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={component.enabled ? 'text-pink-400' : 'text-slate-500'} />
                    <div className="text-left">
                      <p className={`text-sm ${component.enabled ? 'text-slate-200' : 'text-slate-500'}`}>
                        {component.name}
                      </p>
                      <p className="text-xs text-slate-500">{getDirectionIcon(component.direction)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComponent(component.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      component.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                    }`}
                  >
                    {component.enabled ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </button>
              );
            })}
          </div>

          {selectedComponent && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">
                {components.find(c => c.id === selectedComponent)?.description}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Router size={18} className="text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">OT Network</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Level 0-3: Control Systems</p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Server size={16} className="text-emerald-400" />
              <span className="text-sm text-slate-300">SCADA/HMI</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Database size={16} className="text-emerald-400" />
              <span className="text-sm text-slate-300">Process Historian</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
              <Settings size={16} className="text-emerald-400" />
              <span className="text-sm text-slate-300">PLCs/RTUs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">IDMZ Design Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'No Direct Paths', desc: 'All traffic must pass through IDMZ inspection points', color: 'cyan' },
            { title: 'Defense in Depth', desc: 'Multiple security layers before reaching OT systems', color: 'emerald' },
            { title: 'Least Privilege', desc: 'Only required protocols and minimum necessary access', color: 'amber' },
            { title: 'Monitor Everything', desc: 'Full visibility into all traffic crossing the boundary', color: 'pink' },
          ].map(({ title, desc, color }) => (
            <div key={title} className={`p-4 bg-${color}-500/5 border border-${color}-500/20 rounded-lg`}>
              <h4 className={`text-sm font-semibold text-${color}-400 mb-2`}>{title}</h4>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
