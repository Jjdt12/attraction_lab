import { useState } from 'react';
import {
  Scale,
  Shield,
  Eye,
  Lock,
  AlertTriangle,
  Activity,
  Server,
  CheckCircle2,
} from 'lucide-react';

export function SAICvsCIA() {
  const [selectedView, setSelectedView] = useState<'comparison' | 'ot' | 'it'>('comparison');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500/10 to-slate-900 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Scale size={24} className="text-cyan-400" />
          <div>
            <h2 className="text-lg font-bold text-white">SAIC vs CIA: The Priority Inversion</h2>
            <p className="text-sm text-slate-400">
              Understanding why OT security priorities differ from IT security
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          In traditional IT security, the CIA triad (Confidentiality, Integrity, Availability) prioritizes
          protecting data. In OT/ICS environments, we use SAIC (Safety, Availability, Integrity, Confidentiality)
          because the priorities are inverted - protecting physical processes and human safety comes first.
        </p>
      </div>

      <div className="flex gap-2">
        {(['comparison', 'ot', 'it'] as const).map(view => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedView === view
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {view === 'comparison' ? 'Side by Side' : view === 'ot' ? 'OT (SAIC)' : 'IT (CIA)'}
          </button>
        ))}
      </div>

      {selectedView === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server size={20} className="text-amber-400" />
              <h3 className="font-semibold text-amber-400">OT/ICS: SAIC Model</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Priority order for industrial control systems</p>

            <div className="space-y-4">
              {[
                {
                  letter: 'S',
                  name: 'Safety',
                  priority: 1,
                  color: 'red',
                  description: 'Protection of human life and the environment',
                  examples: ['Safety Instrumented Systems (SIS)', 'Emergency shutdown', 'Physical interlocks'],
                },
                {
                  letter: 'A',
                  name: 'Availability',
                  priority: 2,
                  color: 'amber',
                  description: 'Continuous operation of critical processes',
                  examples: ['24/7 uptime', 'Redundant systems', 'Failover capability'],
                },
                {
                  letter: 'I',
                  name: 'Integrity',
                  priority: 3,
                  color: 'emerald',
                  description: 'Accuracy and reliability of process data',
                  examples: ['Sensor accuracy', 'Control signal integrity', 'Data validation'],
                },
                {
                  letter: 'C',
                  name: 'Confidentiality',
                  priority: 4,
                  color: 'cyan',
                  description: 'Protection of proprietary information',
                  examples: ['Process recipes', 'Production data', 'Business intelligence'],
                },
              ].map(({ letter, name, priority, color, description, examples }) => (
                <div key={letter} className={`p-4 bg-${color}-500/5 border border-${color}-500/20 rounded-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center font-bold text-${color}-400`}>
                      {letter}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                          Priority {priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{description}</p>
                  <div className="flex flex-wrap gap-1">
                    {examples.map(ex => (
                      <span key={ex} className="text-xs px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-blue-400" />
              <h3 className="font-semibold text-blue-400">IT: CIA Triad</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Priority order for enterprise IT systems</p>

            <div className="space-y-4">
              {[
                {
                  letter: 'C',
                  name: 'Confidentiality',
                  priority: 1,
                  color: 'blue',
                  description: 'Protection of sensitive data from unauthorized access',
                  examples: ['Encryption', 'Access controls', 'Data classification'],
                },
                {
                  letter: 'I',
                  name: 'Integrity',
                  priority: 2,
                  color: 'emerald',
                  description: 'Ensuring data accuracy and trustworthiness',
                  examples: ['Hash verification', 'Digital signatures', 'Change detection'],
                },
                {
                  letter: 'A',
                  name: 'Availability',
                  priority: 3,
                  color: 'amber',
                  description: 'Ensuring systems are accessible when needed',
                  examples: ['Uptime SLAs', 'DR planning', 'Load balancing'],
                },
              ].map(({ letter, name, priority, color, description, examples }) => (
                <div key={letter} className={`p-4 bg-${color}-500/5 border border-${color}-500/20 rounded-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center font-bold text-${color}-400`}>
                      {letter}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                          Priority {priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{description}</p>
                  <div className="flex flex-wrap gap-1">
                    {examples.map(ex => (
                      <span key={ex} className="text-xs px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg mt-4">
                <p className="text-xs text-slate-400 italic">
                  Note: IT traditionally doesn't include Safety as a core principle because IT systems
                  rarely have direct physical consequences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'ot' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Why Safety Comes First in OT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-3">Physical Consequences</h4>
              <ul className="space-y-2">
                {[
                  'A compromised PLC can cause physical damage',
                  'Process failures can release hazardous materials',
                  'Safety system bypass can cause injury or death',
                  'Equipment damage costs millions',
                  'Environmental disasters affect communities',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-400 mb-3">Real-World Examples</h4>
              <div className="space-y-3">
                {[
                  { name: 'Stuxnet (2010)', impact: 'Destroyed centrifuges at nuclear facility' },
                  { name: 'German Steel Mill (2014)', impact: 'Physical damage to blast furnace' },
                  { name: 'Ukraine Power Grid (2015)', impact: '230,000 people without power' },
                  { name: 'TRITON/TRISIS (2017)', impact: 'Targeted safety systems at petrochemical plant' },
                  { name: 'Oldsmar Water (2021)', impact: 'Attempted to poison water supply' },
                ].map(({ name, impact }) => (
                  <div key={name} className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-slate-400">{impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'it' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Why Confidentiality Comes First in IT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-3">Data-Centric Risks</h4>
              <ul className="space-y-2">
                {[
                  'Data breaches expose customer information',
                  'Intellectual property theft impacts competitiveness',
                  'Regulatory fines for privacy violations',
                  'Reputational damage from exposed data',
                  'Financial fraud from stolen credentials',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <Lock size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-emerald-400 mb-3">Key Differences from OT</h4>
              <div className="space-y-3">
                {[
                  { aspect: 'Downtime Impact', it: 'Lost productivity', ot: 'Safety risk, equipment damage' },
                  { aspect: 'Patch Cycle', it: 'Weekly/monthly', ot: 'Annual turnaround only' },
                  { aspect: 'System Lifespan', it: '3-5 years', ot: '15-30 years' },
                  { aspect: 'Network Priority', it: 'Block threats', ot: 'Ensure availability' },
                ].map(({ aspect, it, ot }) => (
                  <div key={aspect} className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">{aspect}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-blue-400">IT: {it}</span>
                      <span className="text-amber-400">OT: {ot}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-400 mb-2">Key Takeaway</h4>
            <p className="text-sm text-slate-300">
              When securing OT environments, always consider: "Could this security control interfere
              with safety or availability?" If encrypting traffic adds latency that affects safety
              response times, you may need to find alternative controls. The goal is security that
              enhances safety, not security that compromises it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
