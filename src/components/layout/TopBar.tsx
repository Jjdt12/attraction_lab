import { Bell, Settings, User, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import type { ViewType } from '../../App';

interface TopBarProps {
  currentView: ViewType;
}

const viewTitles: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your ICS security architecture' },
  'attraction-hmi': { title: 'Attraction HMI', subtitle: 'Live PLC monitoring and control' },
  'purdue-model': { title: 'Purdue Model', subtitle: 'Interactive reference architecture' },
  'idmz-designer': { title: 'IDMZ Designer', subtitle: 'Configure the Industrial DMZ' },
  'network-topology': { title: 'Network Topology', subtitle: 'Live architecture visualization' },
  'zone-editor': { title: 'Zone Editor', subtitle: 'Define and configure security zones' },
  'firewall-manager': { title: 'Firewall Rule Manager', subtitle: 'IT and OT firewall configuration' },
  'protocol-security': { title: 'Protocol Security', subtitle: 'Modbus, Ethernet/IP, ProfiNET controls' },
  'access-control': { title: 'Access Control Lists', subtitle: 'Per-zone access policies' },
  authentication: { title: 'Authentication Config', subtitle: 'Certificates, MFA, session control' },
  'sis-protection': { title: 'SIS Protection Panel', subtitle: 'Safety system hardening' },
  'fail-safe': { title: 'Fail-Safe Simulator', subtitle: 'Demonstrate fail-safe behavior' },
  'triton-defense': { title: 'TRITON Defense', subtitle: 'SIS attack prevention' },
  redundancy: { title: 'Redundancy Config', subtitle: '2oo3 voting, dual-channel setup' },
  'scenario-simulator': { title: 'Scenario Simulator', subtitle: 'Test defenses against attack patterns' },
  'lateral-movement': { title: 'Lateral Movement Test', subtitle: 'Can ransomware reach OT?' },
  'protocol-attack': { title: 'Protocol Attack Test', subtitle: 'Modbus injection vs your filters' },
  'latency-analysis': { title: 'Latency Impact Analysis', subtitle: 'Will security break timing?' },
  'iec-62443': { title: 'IEC 62443 Assessment', subtitle: 'Security level scoring' },
  'nist-csf': { title: 'NIST CSF Mapping', subtitle: 'Framework alignment' },
  'gap-analysis': { title: 'Gap Analysis', subtitle: "What's missing from your design?" },
  recommendations: { title: 'Recommendations Engine', subtitle: 'How to improve' },
  'saic-vs-cia': { title: 'SAIC vs CIA', subtitle: 'Priority inversion explanation' },
  'protocol-reference': { title: 'Protocol Reference', subtitle: 'Modbus, Ethernet/IP, ProfiNET specs' },
  glossary: { title: 'Glossary', subtitle: 'PLC, HMI, SIS, SIL definitions' },
  'interview-mode': { title: 'Interview Mode', subtitle: 'Guided walkthrough for demonstrations' },
};

export function TopBar({ currentView }: TopBarProps) {
  const [connected] = useState(true);
  const viewInfo = viewTitles[currentView];

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-white">{viewInfo.title}</h1>
        <p className="text-xs text-slate-400">{viewInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connected ? 'Lab Connected' : 'Disconnected'}</span>
        </div>

        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
        </button>

        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
          <Settings size={18} />
        </button>

        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
