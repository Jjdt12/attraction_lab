import { useState } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface Gap {
  id: string;
  category: 'network' | 'access' | 'monitoring' | 'safety' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentState: string;
  desiredState: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  frameworks: string[];
}

const securityGaps: Gap[] = [
  {
    id: 'gap-1',
    category: 'network',
    severity: 'critical',
    title: 'Missing IDMZ Implementation',
    description: 'No Industrial DMZ separating IT and OT networks',
    currentState: 'Direct connection between enterprise and control networks',
    desiredState: 'Fully implemented IDMZ with jump servers and data diodes',
    impact: 'Ransomware or malware can propagate directly from IT to OT',
    effort: 'high',
    frameworks: ['IEC 62443 FR5', 'NIST CSF PR.AC'],
  },
  {
    id: 'gap-2',
    category: 'access',
    severity: 'high',
    title: 'No Multi-Factor Authentication',
    description: 'Single-factor authentication used for OT access',
    currentState: 'Password-only authentication',
    desiredState: 'MFA required for all remote and administrative access',
    impact: 'Credential theft enables unauthorized access',
    effort: 'medium',
    frameworks: ['IEC 62443 FR1', 'NIST CSF PR.AC'],
  },
  {
    id: 'gap-3',
    category: 'monitoring',
    severity: 'high',
    title: 'Insufficient OT Network Visibility',
    description: 'No dedicated OT network monitoring solution',
    currentState: 'IT security tools with limited OT protocol support',
    desiredState: 'OT-specific IDS/IPS with protocol deep inspection',
    impact: 'Unable to detect attacks targeting industrial protocols',
    effort: 'medium',
    frameworks: ['IEC 62443 FR6', 'NIST CSF DE.CM'],
  },
  {
    id: 'gap-4',
    category: 'safety',
    severity: 'critical',
    title: 'SIS Network Not Isolated',
    description: 'Safety system shares network with BPCS',
    currentState: 'SIS on same VLAN as process control',
    desiredState: 'Physically separate SIS network with strict access control',
    impact: 'Compromise of BPCS could impact safety systems',
    effort: 'high',
    frameworks: ['IEC 61511', 'IEC 62443 FR5'],
  },
  {
    id: 'gap-5',
    category: 'compliance',
    severity: 'medium',
    title: 'Incomplete Asset Inventory',
    description: 'OT asset inventory not comprehensive or current',
    currentState: 'Partial spreadsheet-based inventory',
    desiredState: 'Automated asset discovery and inventory management',
    impact: 'Cannot protect unknown assets',
    effort: 'medium',
    frameworks: ['IEC 62443 ID.AM', 'NIST CSF ID.AM'],
  },
  {
    id: 'gap-6',
    category: 'network',
    severity: 'medium',
    title: 'Uncontrolled Protocol Usage',
    description: 'No protocol filtering or function code restrictions',
    currentState: 'All Modbus function codes permitted',
    desiredState: 'Whitelist of approved function codes and addresses',
    impact: 'Attackers can use dangerous commands like FC15/FC16',
    effort: 'low',
    frameworks: ['IEC 62443 FR3', 'NIST CSF PR.DS'],
  },
];

export function GapAnalysis() {
  const { zones, firewallRules } = useLabEnvironment();
  const [gaps, setGaps] = useState<Gap[]>(securityGaps);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredGaps = gaps
    .filter(g => filterCategory === 'all' || g.category === filterCategory)
    .filter(g => filterSeverity === 'all' || g.severity === filterSeverity);

  const getSeverityColor = (severity: Gap['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getEffortColor = (effort: Gap['effort']) => {
    switch (effort) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-emerald-400';
    }
  };

  const criticalCount = gaps.filter(g => g.severity === 'critical').length;
  const highCount = gaps.filter(g => g.severity === 'high').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Gaps</p>
          <p className="text-2xl font-bold text-white">{gaps.length}</p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">High</p>
          <p className="text-2xl font-bold text-amber-400">{highCount}</p>
        </div>
        <div className="bg-slate-900 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-400">{gaps.filter(g => g.severity === 'medium').length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Low</p>
          <p className="text-2xl font-bold text-emerald-400">{gaps.filter(g => g.severity === 'low').length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Categories</option>
            <option value="network">Network</option>
            <option value="access">Access Control</option>
            <option value="monitoring">Monitoring</option>
            <option value="safety">Safety</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredGaps.map((gap) => (
          <div key={gap.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getSeverityColor(gap.severity)}`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{gap.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(gap.severity)}`}>
                      {gap.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{gap.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Remediation Effort</p>
                <p className={`text-sm font-medium ${getEffortColor(gap.effort)} capitalize`}>{gap.effort}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 font-medium mb-1">Current State</p>
                <p className="text-sm text-slate-300">{gap.currentState}</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium mb-1">Desired State</p>
                <p className="text-sm text-slate-300">{gap.desiredState}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg mb-4">
              <p className="text-xs text-slate-500 mb-1">Business Impact</p>
              <p className="text-sm text-slate-300">{gap.impact}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Frameworks:</span>
                {gap.frameworks.map((fw) => (
                  <span key={fw} className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                    {fw}
                  </span>
                ))}
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 capitalize">
                {gap.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredGaps.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Search size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No gaps match the current filters</p>
        </div>
      )}
    </div>
  );
}
