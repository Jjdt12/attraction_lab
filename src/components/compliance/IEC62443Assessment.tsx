import { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface SecurityRequirement {
  id: string;
  name: string;
  description: string;
  sl1: boolean;
  sl2: boolean;
  sl3: boolean;
  sl4: boolean;
  implemented: boolean;
}

interface FRCategory {
  id: string;
  name: string;
  description: string;
  requirements: SecurityRequirement[];
}

const frCategories: FRCategory[] = [
  {
    id: 'fr1',
    name: 'FR 1: Identification and Authentication Control',
    description: 'Identify and authenticate all users (humans, software processes, devices)',
    requirements: [
      { id: 'fr1-1', name: 'Human user identification', description: 'Unique identification for all human users', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr1-2', name: 'Software process identification', description: 'Identification of software processes', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr1-3', name: 'Device identification', description: 'Identification of all devices', sl1: false, sl2: true, sl3: true, sl4: true, implemented: false },
      { id: 'fr1-4', name: 'Authenticator management', description: 'Secure management of authenticators', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
    ],
  },
  {
    id: 'fr2',
    name: 'FR 2: Use Control',
    description: 'Enforce assigned privileges of authenticated users',
    requirements: [
      { id: 'fr2-1', name: 'Authorization enforcement', description: 'Enforce authorization for users', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr2-2', name: 'Wireless use control', description: 'Control wireless access', sl1: false, sl2: true, sl3: true, sl4: true, implemented: false },
      { id: 'fr2-3', name: 'Portable device use control', description: 'Control portable device access', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
    ],
  },
  {
    id: 'fr3',
    name: 'FR 3: System Integrity',
    description: 'Ensure integrity of the IACS',
    requirements: [
      { id: 'fr3-1', name: 'Communication integrity', description: 'Protect integrity of communications', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr3-2', name: 'Malicious code protection', description: 'Protection against malware', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr3-3', name: 'Security functionality verification', description: 'Verify security mechanisms', sl1: false, sl2: true, sl3: true, sl4: true, implemented: false },
    ],
  },
  {
    id: 'fr4',
    name: 'FR 4: Data Confidentiality',
    description: 'Ensure confidentiality of information',
    requirements: [
      { id: 'fr4-1', name: 'Information confidentiality', description: 'Protect confidential information', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr4-2', name: 'Cryptography use', description: 'Use appropriate cryptography', sl1: false, sl2: false, sl3: true, sl4: true, implemented: false },
    ],
  },
  {
    id: 'fr5',
    name: 'FR 5: Restricted Data Flow',
    description: 'Segment and isolate networks to restrict data flows',
    requirements: [
      { id: 'fr5-1', name: 'Network segmentation', description: 'Segment IACS networks', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr5-2', name: 'Zone boundary protection', description: 'Protect zone boundaries', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr5-3', name: 'General purpose person-to-person communication', description: 'Control P2P communication', sl1: false, sl2: true, sl3: true, sl4: true, implemented: false },
    ],
  },
  {
    id: 'fr6',
    name: 'FR 6: Timely Response to Events',
    description: 'Respond to security violations',
    requirements: [
      { id: 'fr6-1', name: 'Audit log accessibility', description: 'Make audit logs accessible', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr6-2', name: 'Continuous monitoring', description: 'Monitor for security events', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
    ],
  },
  {
    id: 'fr7',
    name: 'FR 7: Resource Availability',
    description: 'Ensure availability of IACS resources',
    requirements: [
      { id: 'fr7-1', name: 'DoS protection', description: 'Protection against denial of service', sl1: false, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr7-2', name: 'Resource management', description: 'Manage IACS resources', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
      { id: 'fr7-3', name: 'System backup', description: 'Backup IACS data and configuration', sl1: true, sl2: true, sl3: true, sl4: true, implemented: true },
    ],
  },
];

export function IEC62443Assessment() {
  const { assessment, recalculateAssessment } = useLabEnvironment();
  const [categories, setCategories] = useState<FRCategory[]>(frCategories);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [targetSL, setTargetSL] = useState<1 | 2 | 3 | 4>(2);

  const toggleRequirement = (categoryId: string, reqId: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            requirements: cat.requirements.map(req =>
              req.id === reqId ? { ...req, implemented: !req.implemented } : req
            ),
          };
        }
        return cat;
      })
    );
  };

  const getRequirementsForSL = (sl: number) => {
    return categories.flatMap(cat =>
      cat.requirements.filter(req => {
        switch (sl) {
          case 1: return req.sl1;
          case 2: return req.sl2;
          case 3: return req.sl3;
          case 4: return req.sl4;
          default: return false;
        }
      })
    );
  };

  const getComplianceScore = (sl: number) => {
    const reqs = getRequirementsForSL(sl);
    if (reqs.length === 0) return 0;
    const implemented = reqs.filter(r => r.implemented).length;
    return Math.round((implemented / reqs.length) * 100);
  };

  const totalReqs = getRequirementsForSL(targetSL);
  const implementedReqs = totalReqs.filter(r => r.implemented);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Target SL</p>
          <select
            value={targetSL}
            onChange={(e) => setTargetSL(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-lg font-bold text-white"
          >
            {[1, 2, 3, 4].map(sl => (
              <option key={sl} value={sl}>SL {sl}</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Compliance</p>
          <p className="text-2xl font-bold text-white">{getComplianceScore(targetSL)}%</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Implemented</p>
          <p className="text-2xl font-bold text-emerald-400">{implementedReqs.length}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-amber-400">{totalReqs.length - implementedReqs.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Requirements</p>
          <p className="text-2xl font-bold text-cyan-400">{totalReqs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(sl => {
          const score = getComplianceScore(sl);
          return (
            <div
              key={sl}
              className={`p-4 rounded-xl border ${
                targetSL === sl
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">SL {sl}</span>
                <span className={`text-sm ${
                  score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {score}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {sl === 1 && 'Basic protection'}
                {sl === 2 && 'Protection against intentional violation'}
                {sl === 3 && 'Protection against sophisticated attacks'}
                {sl === 4 && 'State-level threat protection'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const categoryReqs = category.requirements.filter(req => {
            switch (targetSL) {
              case 1: return req.sl1;
              case 2: return req.sl2;
              case 3: return req.sl3;
              case 4: return req.sl4;
              default: return false;
            }
          });
          if (categoryReqs.length === 0) return null;

          const implemented = categoryReqs.filter(r => r.implemented).length;
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    implemented === categoryReqs.length
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : implemented > 0
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    <ClipboardCheck size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">{category.name}</h3>
                    <p className="text-xs text-slate-400">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {implemented}/{categoryReqs.length}
                  </span>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-2">
                  {categoryReqs.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => toggleRequirement(category.id, req.id)}
                      className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                        req.implemented
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{req.name}</p>
                        <p className="text-xs text-slate-400">{req.description}</p>
                      </div>
                      {req.implemented ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <XCircle size={18} className="text-slate-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
