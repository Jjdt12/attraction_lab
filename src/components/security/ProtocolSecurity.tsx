import { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProtocolConfig {
  id: string;
  name: string;
  port: number;
  enabled: boolean;
  encrypted: boolean;
  authenticated: boolean;
  whitelisted: boolean;
  functionCodes?: { code: number; name: string; allowed: boolean }[];
  securityLevel: 'none' | 'basic' | 'enhanced' | 'strict';
}

const defaultProtocols: ProtocolConfig[] = [
  {
    id: 'modbus',
    name: 'Modbus TCP',
    port: 502,
    enabled: true,
    encrypted: false,
    authenticated: false,
    whitelisted: true,
    securityLevel: 'basic',
    functionCodes: [
      { code: 1, name: 'Read Coils', allowed: true },
      { code: 2, name: 'Read Discrete Inputs', allowed: true },
      { code: 3, name: 'Read Holding Registers', allowed: true },
      { code: 4, name: 'Read Input Registers', allowed: true },
      { code: 5, name: 'Write Single Coil', allowed: true },
      { code: 6, name: 'Write Single Register', allowed: true },
      { code: 15, name: 'Write Multiple Coils', allowed: false },
      { code: 16, name: 'Write Multiple Registers', allowed: false },
      { code: 43, name: 'Read Device ID', allowed: true },
    ],
  },
  {
    id: 'enip',
    name: 'Ethernet/IP',
    port: 44818,
    enabled: true,
    encrypted: false,
    authenticated: false,
    whitelisted: false,
    securityLevel: 'basic',
  },
  {
    id: 'opcua',
    name: 'OPC UA',
    port: 4840,
    enabled: true,
    encrypted: true,
    authenticated: true,
    whitelisted: true,
    securityLevel: 'enhanced',
  },
  {
    id: 'profinet',
    name: 'ProfiNET',
    port: 34962,
    enabled: false,
    encrypted: false,
    authenticated: false,
    whitelisted: false,
    securityLevel: 'none',
  },
  {
    id: 'dnp3',
    name: 'DNP3',
    port: 20000,
    enabled: false,
    encrypted: false,
    authenticated: true,
    whitelisted: false,
    securityLevel: 'basic',
  },
];

export function ProtocolSecurity() {
  const [protocols, setProtocols] = useState<ProtocolConfig[]>(defaultProtocols);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('modbus');

  const updateProtocol = (id: string, updates: Partial<ProtocolConfig>) => {
    setProtocols(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const toggleFunctionCode = (protocolId: string, code: number) => {
    setProtocols(prev =>
      prev.map(p => {
        if (p.id === protocolId && p.functionCodes) {
          return {
            ...p,
            functionCodes: p.functionCodes.map(fc =>
              fc.code === code ? { ...fc, allowed: !fc.allowed } : fc
            ),
          };
        }
        return p;
      })
    );
  };

  const activeProtocol = protocols.find(p => p.id === selectedProtocol);

  const getSecurityScore = (protocol: ProtocolConfig) => {
    let score = 0;
    if (protocol.encrypted) score += 30;
    if (protocol.authenticated) score += 30;
    if (protocol.whitelisted) score += 20;
    if (protocol.securityLevel === 'strict') score += 20;
    else if (protocol.securityLevel === 'enhanced') score += 15;
    else if (protocol.securityLevel === 'basic') score += 10;
    return score;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Industrial Protocols</h3>
          {protocols.map((protocol) => {
            const score = getSecurityScore(protocol);
            return (
              <button
                key={protocol.id}
                onClick={() => setSelectedProtocol(protocol.id)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedProtocol === protocol.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${protocol.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    <span className="font-medium text-white">{protocol.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">:{protocol.port}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {protocol.encrypted && <Lock size={12} className="text-emerald-400" />}
                    {protocol.authenticated && <Shield size={12} className="text-cyan-400" />}
                    {protocol.whitelisted && <CheckCircle2 size={12} className="text-blue-400" />}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    score >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                    score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {score}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeProtocol && (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{activeProtocol.name}</h3>
                    <p className="text-sm text-slate-400">Port {activeProtocol.port}</p>
                  </div>
                  <button
                    onClick={() => updateProtocol(activeProtocol.id, { enabled: !activeProtocol.enabled })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeProtocol.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {activeProtocol.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeProtocol.encrypted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => updateProtocol(activeProtocol.id, { encrypted: !activeProtocol.encrypted })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={16} className={activeProtocol.encrypted ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="text-sm font-medium text-white">Encryption</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {activeProtocol.encrypted ? 'TLS/SSL enabled' : 'Traffic is unencrypted'}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeProtocol.authenticated
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => updateProtocol(activeProtocol.id, { authenticated: !activeProtocol.authenticated })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className={activeProtocol.authenticated ? 'text-cyan-400' : 'text-slate-500'} />
                      <span className="text-sm font-medium text-white">Authentication</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {activeProtocol.authenticated ? 'Client auth required' : 'No authentication'}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeProtocol.whitelisted
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => updateProtocol(activeProtocol.id, { whitelisted: !activeProtocol.whitelisted })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className={activeProtocol.whitelisted ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-sm font-medium text-white">IP Whitelist</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {activeProtocol.whitelisted ? 'Only approved IPs' : 'All sources allowed'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-white">Security Level</span>
                    </div>
                    <select
                      value={activeProtocol.securityLevel}
                      onChange={(e) => updateProtocol(activeProtocol.id, { securityLevel: e.target.value as ProtocolConfig['securityLevel'] })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="none">None</option>
                      <option value="basic">Basic</option>
                      <option value="enhanced">Enhanced</option>
                      <option value="strict">Strict</option>
                    </select>
                  </div>
                </div>
              </div>

              {activeProtocol.functionCodes && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-white mb-4">Function Code Filtering</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Control which Modbus function codes are allowed through the firewall.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeProtocol.functionCodes.map((fc) => (
                      <button
                        key={fc.code}
                        onClick={() => toggleFunctionCode(activeProtocol.id, fc.code)}
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          fc.allowed
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono w-8 text-slate-500">FC{fc.code}</span>
                          <span className="text-sm text-white">{fc.name}</span>
                        </div>
                        {fc.allowed ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : (
                          <AlertTriangle size={16} className="text-red-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-cyan-400" />
          <h3 className="font-semibold text-white">Protocol Security Best Practices</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-amber-400 mb-2">Modbus TCP</h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>No built-in security - add firewall rules</li>
              <li>Filter dangerous function codes (FC15, FC16)</li>
              <li>Consider Modbus/TCP Security extension</li>
              <li>Whitelist authorized clients</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-cyan-400 mb-2">OPC UA</h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>Use Security Mode: SignAndEncrypt</li>
              <li>Enable certificate-based auth</li>
              <li>Configure user access policies</li>
              <li>Regular certificate rotation</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Ethernet/IP</h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>Segment CIP traffic from IT network</li>
              <li>Use CIP Security when available</li>
              <li>Restrict to specific device types</li>
              <li>Monitor for anomalous traffic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
