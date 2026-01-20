import { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  ArrowRight,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface Recommendation {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  category: 'quick-win' | 'strategic' | 'foundation' | 'advanced';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  cost: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  benefits: string[];
  relatedGaps: string[];
  implemented: boolean;
}

const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    priority: 1,
    title: 'Implement Network Segmentation',
    description: 'Create distinct network zones with firewall enforcement between Purdue levels',
    category: 'foundation',
    timeframe: 'short-term',
    cost: 'medium',
    impact: 'critical',
    steps: [
      'Audit current network topology',
      'Design zone architecture aligned with Purdue model',
      'Deploy firewalls at zone boundaries',
      'Configure access control lists',
      'Test and validate traffic flows',
    ],
    benefits: [
      'Prevents lateral movement of malware',
      'Limits blast radius of security incidents',
      'Enables granular access control',
      'Foundation for compliance with IEC 62443',
    ],
    relatedGaps: ['Missing IDMZ Implementation', 'SIS Network Not Isolated'],
    implemented: false,
  },
  {
    id: 'rec-2',
    priority: 2,
    title: 'Deploy Protocol-Aware Firewall',
    description: 'Implement deep packet inspection for industrial protocols',
    category: 'strategic',
    timeframe: 'medium-term',
    cost: 'high',
    impact: 'high',
    steps: [
      'Evaluate OT firewall solutions',
      'Define protocol whitelist policies',
      'Configure function code filtering',
      'Set up alerting for anomalies',
      'Tune rules based on baseline traffic',
    ],
    benefits: [
      'Block malicious Modbus/EtherNet-IP commands',
      'Detect protocol-level attacks',
      'Provide visibility into OT traffic',
    ],
    relatedGaps: ['Uncontrolled Protocol Usage'],
    implemented: false,
  },
  {
    id: 'rec-3',
    priority: 3,
    title: 'Enable Multi-Factor Authentication',
    description: 'Require MFA for all remote and privileged access to OT systems',
    category: 'quick-win',
    timeframe: 'immediate',
    cost: 'low',
    impact: 'high',
    steps: [
      'Select MFA solution compatible with OT',
      'Deploy authentication server in IDMZ',
      'Configure MFA for jump servers',
      'Train users on MFA usage',
      'Establish backup authentication procedures',
    ],
    benefits: [
      'Prevents credential theft attacks',
      'Reduces insider threat risk',
      'Meets regulatory requirements',
    ],
    relatedGaps: ['No Multi-Factor Authentication'],
    implemented: false,
  },
  {
    id: 'rec-4',
    priority: 4,
    title: 'Deploy OT Network Monitoring',
    description: 'Implement passive network monitoring with industrial protocol support',
    category: 'strategic',
    timeframe: 'medium-term',
    cost: 'high',
    impact: 'high',
    steps: [
      'Evaluate OT-specific monitoring solutions',
      'Deploy network taps at strategic points',
      'Configure protocol parsers',
      'Establish behavioral baselines',
      'Integrate with SIEM/SOC',
    ],
    benefits: [
      'Real-time visibility into OT network',
      'Detect anomalous behavior',
      'Support incident response',
      'Asset discovery capability',
    ],
    relatedGaps: ['Insufficient OT Network Visibility'],
    implemented: false,
  },
  {
    id: 'rec-5',
    priority: 5,
    title: 'Establish Change Management',
    description: 'Implement formal change control for all OT system modifications',
    category: 'foundation',
    timeframe: 'short-term',
    cost: 'low',
    impact: 'medium',
    steps: [
      'Define change control procedures',
      'Establish change advisory board',
      'Implement change tracking system',
      'Train personnel on procedures',
      'Audit compliance regularly',
    ],
    benefits: [
      'Reduces unplanned downtime',
      'Improves security posture',
      'Supports compliance requirements',
      'Enables root cause analysis',
    ],
    relatedGaps: ['Incomplete Asset Inventory'],
    implemented: false,
  },
];

export function RecommendationsEngine() {
  const [recs, setRecs] = useState<Recommendation[]>(recommendations);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const toggleImplemented = (id: string) => {
    setRecs(prev =>
      prev.map(r => (r.id === id ? { ...r, implemented: !r.implemented } : r))
    );
  };

  const filteredRecs = recs
    .filter(r => filterCategory === 'all' || r.category === filterCategory)
    .sort((a, b) => a.priority - b.priority);

  const implementedCount = recs.filter(r => r.implemented).length;
  const progressPercent = Math.round((implementedCount / recs.length) * 100);

  const getCostIcon = (cost: Recommendation['cost']) => {
    const count = cost === 'high' ? 3 : cost === 'medium' ? 2 : 1;
    return Array(count).fill(0).map((_, i) => (
      <DollarSign key={i} size={12} className="text-amber-400" />
    ));
  };

  const getImpactColor = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-amber-400 bg-amber-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-emerald-400 bg-emerald-500/10';
    }
  };

  const getTimeframeLabel = (tf: Recommendation['timeframe']) => {
    switch (tf) {
      case 'immediate': return '< 1 week';
      case 'short-term': return '1-4 weeks';
      case 'medium-term': return '1-3 months';
      case 'long-term': return '3+ months';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Recommendations</p>
          <p className="text-2xl font-bold text-white">{recs.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Implemented</p>
          <p className="text-2xl font-bold text-emerald-400">{implementedCount}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{recs.length - implementedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Progress</p>
          <p className="text-2xl font-bold text-cyan-400">{progressPercent}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {['all', 'quick-win', 'foundation', 'strategic', 'advanced'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filterCategory === cat
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All' : cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {filteredRecs.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setSelectedRec(rec)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedRec?.id === rec.id
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : rec.implemented
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    rec.implemented ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {rec.priority}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{rec.title}</h3>
                    <p className="text-xs text-slate-400 capitalize">{rec.category.replace('-', ' ')}</p>
                  </div>
                </div>
                {rec.implemented && <CheckCircle2 size={18} className="text-emerald-400" />}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  <span className="text-xs text-slate-500">{getTimeframeLabel(rec.timeframe)}</span>
                </div>
                <div className="flex items-center">{getCostIcon(rec.cost)}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${getImpactColor(rec.impact)}`}>
                  {rec.impact} impact
                </span>
              </div>
            </button>
          ))}
        </div>

        <div>
          {selectedRec ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRec.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{selectedRec.description}</p>
                </div>
                <button
                  onClick={() => toggleImplemented(selectedRec.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRec.implemented
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {selectedRec.implemented ? 'Implemented' : 'Mark Complete'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 mb-1">Timeframe</p>
                  <p className="text-sm text-white">{getTimeframeLabel(selectedRec.timeframe)}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 mb-1">Cost</p>
                  <div className="flex justify-center">{getCostIcon(selectedRec.cost)}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 mb-1">Impact</p>
                  <p className={`text-sm capitalize ${getImpactColor(selectedRec.impact).split(' ')[0]}`}>
                    {selectedRec.impact}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Implementation Steps</h4>
                <div className="space-y-2">
                  {selectedRec.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Expected Benefits</h4>
                <ul className="space-y-2">
                  {selectedRec.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Addresses Gaps</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedRec.relatedGaps.map((gap) => (
                    <span key={gap} className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Lightbulb size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">Select a recommendation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
