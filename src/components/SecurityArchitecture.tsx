import { Shield, Lock, Network, Eye, AlertTriangle, CheckCircle2, Server, Cpu, Layers, ShieldCheck, Radio, Database } from 'lucide-react';

interface SecurityLayer {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'monitoring' | 'alert';
  details: string[];
}

const SECURITY_LAYERS: SecurityLayer[] = [
  {
    id: 'network',
    name: 'Network Segmentation',
    description: 'Isolated OT network with controlled access points',
    icon: Network,
    status: 'active',
    details: [
      'DMZ between IT and OT networks',
      'VLAN separation for PLC tiers',
      'Firewall rules restrict Modbus traffic',
    ],
  },
  {
    id: 'access',
    name: 'Access Control',
    description: 'Role-based authentication and authorization',
    icon: Lock,
    status: 'active',
    details: [
      'Operator vs Engineer permissions',
      'Session management and timeout',
      'Audit logging of all actions',
    ],
  },
  {
    id: 'monitoring',
    name: 'Anomaly Detection',
    description: 'Real-time monitoring of protocol behavior',
    icon: Eye,
    status: 'monitoring',
    details: [
      'Baseline Modbus traffic patterns',
      'Unexpected register write alerts',
      'Protocol violation detection',
    ],
  },
  {
    id: 'safety',
    name: 'Safety Interlocks',
    description: 'Hardware and software safety mechanisms',
    icon: ShieldCheck,
    status: 'active',
    details: [
      'Redundant safety PLC (SIL-rated)',
      'Hardware E-stop circuits',
      'Watchdog timers on all PLCs',
    ],
  },
];

interface SecurityArchitectureProps {
  wsConnected: boolean;
  plcConnected: boolean;
  coilStates: boolean[];
}

export default function SecurityArchitecture({ wsConnected, plcConnected, coilStates }: SecurityArchitectureProps) {
  const masterEnable = coilStates[0] || false;
  const safetyPlcReady = coilStates[31] || false;
  const effectsPlcReady = coilStates[32] || false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'monitoring':
        return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400';
      case 'alert':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'monitoring':
        return <Eye className="w-3 h-3" />;
      case 'alert':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Security Architecture</h3>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Defense-in-depth layers protecting the ICS</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border ${wsConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Gateway</span>
            </div>
            <div className={`text-[10px] font-mono ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              {wsConnected ? 'CONNECTED' : 'OFFLINE'}
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${plcConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Main PLC</span>
            </div>
            <div className={`text-[10px] font-mono ${plcConnected ? 'text-green-400' : 'text-red-400'}`}>
              {plcConnected ? 'CONNECTED' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Security Layers
          </div>
          {SECURITY_LAYERS.map((layer) => {
            const LayerIcon = layer.icon;
            return (
              <div
                key={layer.id}
                className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getStatusColor(layer.status)}`}>
                    <LayerIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{layer.name}</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${getStatusColor(layer.status)}`}>
                        {getStatusIcon(layer.status)}
                        <span className="uppercase">{layer.status}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{layer.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            PLC Subsystems
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg border text-center ${masterEnable ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <Radio className={`w-4 h-4 mx-auto mb-1 ${masterEnable ? 'text-green-400' : 'text-slate-500'}`} />
              <div className="text-[9px] text-slate-400">Master</div>
              <div className={`text-[10px] font-mono ${masterEnable ? 'text-green-400' : 'text-slate-500'}`}>
                {masterEnable ? 'OK' : 'OFF'}
              </div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${safetyPlcReady ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <ShieldCheck className={`w-4 h-4 mx-auto mb-1 ${safetyPlcReady ? 'text-green-400' : 'text-amber-400'}`} />
              <div className="text-[9px] text-slate-400">Safety</div>
              <div className={`text-[10px] font-mono ${safetyPlcReady ? 'text-green-400' : 'text-amber-400'}`}>
                {safetyPlcReady ? 'OK' : 'WAIT'}
              </div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${effectsPlcReady ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <Database className={`w-4 h-4 mx-auto mb-1 ${effectsPlcReady ? 'text-green-400' : 'text-amber-400'}`} />
              <div className="text-[9px] text-slate-400">Effects</div>
              <div className={`text-[10px] font-mono ${effectsPlcReady ? 'text-green-400' : 'text-amber-400'}`}>
                {effectsPlcReady ? 'OK' : 'WAIT'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Learning Objectives</span>
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5" />
              <span className="text-[10px] text-slate-400">Understand ICS network architecture and protocols</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5" />
              <span className="text-[10px] text-slate-400">Identify security controls at each layer</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5" />
              <span className="text-[10px] text-slate-400">Analyze safety system design patterns</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5" />
              <span className="text-[10px] text-slate-400">Evaluate defense-in-depth effectiveness</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
