import { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface CSFSubcategory {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  maturityLevel: 0 | 1 | 2 | 3 | 4;
}

interface CSFCategory {
  id: string;
  name: string;
  description: string;
  subcategories: CSFSubcategory[];
}

interface CSFFunction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  categories: CSFCategory[];
}

const csfFramework: CSFFunction[] = [
  {
    id: 'identify',
    name: 'Identify',
    description: 'Develop organizational understanding of cybersecurity risk',
    icon: Eye,
    color: 'blue',
    categories: [
      {
        id: 'id-am',
        name: 'Asset Management',
        description: 'Data, personnel, devices, systems, and facilities are identified',
        subcategories: [
          { id: 'id-am-1', name: 'Physical devices inventoried', description: 'Inventory of physical devices and systems', implemented: true, maturityLevel: 3 },
          { id: 'id-am-2', name: 'Software platforms inventoried', description: 'Software platforms and applications mapped', implemented: true, maturityLevel: 2 },
          { id: 'id-am-3', name: 'Data flows mapped', description: 'Organizational communication and data flows mapped', implemented: false, maturityLevel: 1 },
        ],
      },
      {
        id: 'id-ra',
        name: 'Risk Assessment',
        description: 'Organization understands cybersecurity risk',
        subcategories: [
          { id: 'id-ra-1', name: 'Vulnerabilities identified', description: 'Asset vulnerabilities are identified', implemented: true, maturityLevel: 2 },
          { id: 'id-ra-2', name: 'Threat intelligence', description: 'Cyber threat intelligence is received', implemented: false, maturityLevel: 1 },
        ],
      },
    ],
  },
  {
    id: 'protect',
    name: 'Protect',
    description: 'Develop safeguards to ensure delivery of critical services',
    icon: Shield,
    color: 'emerald',
    categories: [
      {
        id: 'pr-ac',
        name: 'Access Control',
        description: 'Access to assets is limited to authorized users',
        subcategories: [
          { id: 'pr-ac-1', name: 'Identities managed', description: 'Identities and credentials are issued and managed', implemented: true, maturityLevel: 3 },
          { id: 'pr-ac-2', name: 'Physical access managed', description: 'Physical access to assets is managed', implemented: true, maturityLevel: 2 },
          { id: 'pr-ac-3', name: 'Remote access managed', description: 'Remote access is managed', implemented: true, maturityLevel: 2 },
          { id: 'pr-ac-4', name: 'Least privilege', description: 'Access permissions managed with least privilege', implemented: false, maturityLevel: 1 },
        ],
      },
      {
        id: 'pr-ds',
        name: 'Data Security',
        description: 'Information and records are managed consistent with risk',
        subcategories: [
          { id: 'pr-ds-1', name: 'Data at rest protected', description: 'Data-at-rest is protected', implemented: true, maturityLevel: 2 },
          { id: 'pr-ds-2', name: 'Data in transit protected', description: 'Data-in-transit is protected', implemented: true, maturityLevel: 3 },
        ],
      },
    ],
  },
  {
    id: 'detect',
    name: 'Detect',
    description: 'Develop activities to identify cybersecurity events',
    icon: Activity,
    color: 'amber',
    categories: [
      {
        id: 'de-ae',
        name: 'Anomalies and Events',
        description: 'Anomalous activity is detected',
        subcategories: [
          { id: 'de-ae-1', name: 'Baseline established', description: 'Network operations baseline established', implemented: true, maturityLevel: 2 },
          { id: 'de-ae-2', name: 'Events analyzed', description: 'Detected events are analyzed', implemented: true, maturityLevel: 2 },
        ],
      },
      {
        id: 'de-cm',
        name: 'Continuous Monitoring',
        description: 'Information system monitored for cybersecurity events',
        subcategories: [
          { id: 'de-cm-1', name: 'Network monitored', description: 'Network is monitored for events', implemented: true, maturityLevel: 2 },
          { id: 'de-cm-2', name: 'Physical monitored', description: 'Physical environment monitored', implemented: false, maturityLevel: 1 },
        ],
      },
    ],
  },
  {
    id: 'respond',
    name: 'Respond',
    description: 'Develop activities to take action regarding detected events',
    icon: AlertTriangle,
    color: 'red',
    categories: [
      {
        id: 'rs-rp',
        name: 'Response Planning',
        description: 'Response processes are executed during/after incident',
        subcategories: [
          { id: 'rs-rp-1', name: 'Response plan executed', description: 'Response plan is executed during incident', implemented: true, maturityLevel: 2 },
        ],
      },
      {
        id: 'rs-co',
        name: 'Communications',
        description: 'Response activities coordinated with stakeholders',
        subcategories: [
          { id: 'rs-co-1', name: 'Personnel know roles', description: 'Personnel know their roles and operations', implemented: true, maturityLevel: 2 },
          { id: 'rs-co-2', name: 'Events reported', description: 'Incidents are reported per criteria', implemented: false, maturityLevel: 1 },
        ],
      },
    ],
  },
  {
    id: 'recover',
    name: 'Recover',
    description: 'Develop activities to maintain resilience and restore capabilities',
    icon: RefreshCw,
    color: 'cyan',
    categories: [
      {
        id: 'rc-rp',
        name: 'Recovery Planning',
        description: 'Recovery processes executed to restore systems',
        subcategories: [
          { id: 'rc-rp-1', name: 'Recovery plan executed', description: 'Recovery plan is executed during incident', implemented: true, maturityLevel: 2 },
        ],
      },
      {
        id: 'rc-im',
        name: 'Improvements',
        description: 'Recovery planning incorporates lessons learned',
        subcategories: [
          { id: 'rc-im-1', name: 'Plans incorporate lessons', description: 'Recovery plans incorporate lessons learned', implemented: false, maturityLevel: 1 },
        ],
      },
    ],
  },
];

export function NISTCSFMapping() {
  const { assessment } = useLabEnvironment();
  const [framework, setFramework] = useState<CSFFunction[]>(csfFramework);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleSubcategory = (funcId: string, catId: string, subId: string) => {
    setFramework(prev =>
      prev.map(func => {
        if (func.id === funcId) {
          return {
            ...func,
            categories: func.categories.map(cat => {
              if (cat.id === catId) {
                return {
                  ...cat,
                  subcategories: cat.subcategories.map(sub =>
                    sub.id === subId ? { ...sub, implemented: !sub.implemented } : sub
                  ),
                };
              }
              return cat;
            }),
          };
        }
        return func;
      })
    );
  };

  const getFunctionScore = (func: CSFFunction) => {
    const allSubs = func.categories.flatMap(c => c.subcategories);
    if (allSubs.length === 0) return 0;
    const implemented = allSubs.filter(s => s.implemented).length;
    return Math.round((implemented / allSubs.length) * 100);
  };

  const getOverallScore = () => {
    const allSubs = framework.flatMap(f => f.categories.flatMap(c => c.subcategories));
    if (allSubs.length === 0) return 0;
    const implemented = allSubs.filter(s => s.implemented).length;
    return Math.round((implemented / allSubs.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Overall Score</p>
          <p className="text-2xl font-bold text-white">{getOverallScore()}%</p>
        </div>
        {framework.map(func => {
          const score = getFunctionScore(func);
          const Icon = func.icon;
          return (
            <div key={func.id} className={`bg-slate-900 border border-${func.color}-500/20 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={`text-${func.color}-400`} />
                <p className="text-xs text-slate-400">{func.name}</p>
              </div>
              <p className={`text-xl font-bold text-${func.color}-400`}>{score}%</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {framework.map(func => {
          const Icon = func.icon;
          const score = getFunctionScore(func);
          const isExpanded = expandedFunction === func.id;

          return (
            <div key={func.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFunction(isExpanded ? null : func.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${func.color}-500/10`}>
                    <Icon size={20} className={`text-${func.color}-400`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">{func.name}</h3>
                    <p className="text-xs text-slate-400">{func.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${func.color}-500 rounded-full`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-sm text-white w-10">{score}%</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-3">
                  {func.categories.map(cat => {
                    const catExpanded = expandedCategory === cat.id;
                    const catImplemented = cat.subcategories.filter(s => s.implemented).length;

                    return (
                      <div key={cat.id} className="bg-slate-800/30 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedCategory(catExpanded ? null : cat.id)}
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{cat.name}</p>
                            <p className="text-xs text-slate-500">{cat.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {catImplemented}/{cat.subcategories.length}
                            </span>
                            {catExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                          </div>
                        </button>

                        {catExpanded && (
                          <div className="border-t border-slate-700/50 p-3 space-y-2">
                            {cat.subcategories.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => toggleSubcategory(func.id, cat.id, sub.id)}
                                className={`w-full p-2 rounded flex items-center justify-between transition-colors ${
                                  sub.implemented
                                    ? 'bg-emerald-500/10'
                                    : 'bg-slate-800/50 hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {sub.implemented ? (
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                  ) : (
                                    <Circle size={14} className="text-slate-500" />
                                  )}
                                  <span className="text-xs text-slate-300">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4].map(level => (
                                    <div
                                      key={level}
                                      className={`w-1.5 h-3 rounded-sm ${
                                        level <= sub.maturityLevel
                                          ? `bg-${func.color}-400`
                                          : 'bg-slate-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
