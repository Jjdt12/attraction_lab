import { useState } from 'react';
import { HelpCircle, Search, BookOpen } from 'lucide-react';

interface GlossaryTerm {
  term: string;
  acronym?: string;
  definition: string;
  category: 'device' | 'protocol' | 'security' | 'safety' | 'standard' | 'general';
  relatedTerms?: string[];
}

const glossaryTerms: GlossaryTerm[] = [
  { term: 'Programmable Logic Controller', acronym: 'PLC', definition: 'An industrial digital computer designed for controlling manufacturing processes or machinery. PLCs are ruggedized and designed for real-time, deterministic control.', category: 'device', relatedTerms: ['DCS', 'RTU', 'PAC'] },
  { term: 'Human Machine Interface', acronym: 'HMI', definition: 'The user interface that connects an operator to a controller for an industrial system. Typically displays process status and allows operator input.', category: 'device', relatedTerms: ['SCADA', 'OWS'] },
  { term: 'Supervisory Control and Data Acquisition', acronym: 'SCADA', definition: 'A control system architecture that uses computers, networked data communications, and graphical user interfaces for high-level supervision of machines and processes.', category: 'device', relatedTerms: ['HMI', 'RTU', 'MTU'] },
  { term: 'Distributed Control System', acronym: 'DCS', definition: 'A computerized control system for a process or plant, where controller elements are distributed throughout the system. Common in process industries.', category: 'device', relatedTerms: ['PLC', 'SCADA'] },
  { term: 'Remote Terminal Unit', acronym: 'RTU', definition: 'A microprocessor-controlled electronic device that interfaces physical objects to a DCS or SCADA system by transmitting telemetry data.', category: 'device', relatedTerms: ['PLC', 'IED'] },
  { term: 'Safety Instrumented System', acronym: 'SIS', definition: 'An instrumented system used to implement one or more safety instrumented functions. Designed to bring a process to a safe state when predetermined conditions are violated.', category: 'safety', relatedTerms: ['SIF', 'SIL', 'ESD'] },
  { term: 'Safety Integrity Level', acronym: 'SIL', definition: 'A measurement of performance required for a safety instrumented function (SIF). Ranges from SIL 1 (lowest) to SIL 4 (highest).', category: 'safety', relatedTerms: ['SIS', 'SIF', 'PFD'] },
  { term: 'Safety Instrumented Function', acronym: 'SIF', definition: 'A specific safety function implemented by a SIS designed to achieve or maintain a safe state for the process.', category: 'safety', relatedTerms: ['SIS', 'SIL'] },
  { term: 'Emergency Shutdown', acronym: 'ESD', definition: 'A safety system designed to protect personnel, the environment, and assets by shutting down equipment when an unsafe condition is detected.', category: 'safety', relatedTerms: ['SIS', 'HIPPS'] },
  { term: 'Basic Process Control System', acronym: 'BPCS', definition: 'The system which controls the process and keeps it operating within normal bounds. Separate from the Safety Instrumented System.', category: 'device', relatedTerms: ['SIS', 'DCS', 'PLC'] },
  { term: 'Modbus', definition: 'A serial communication protocol developed in 1979 for use with PLCs. Modbus TCP is the TCP/IP implementation. Simple but lacks built-in security.', category: 'protocol', relatedTerms: ['Ethernet/IP', 'OPC UA'] },
  { term: 'OPC Unified Architecture', acronym: 'OPC UA', definition: 'A machine-to-machine communication protocol for industrial automation. Includes built-in security features like encryption and authentication.', category: 'protocol', relatedTerms: ['Modbus', 'Ethernet/IP'] },
  { term: 'Industrial Demilitarized Zone', acronym: 'IDMZ', definition: 'A buffer network segment between the enterprise (IT) and industrial control system (OT) networks. Contains systems that need to communicate between both zones.', category: 'security', relatedTerms: ['Purdue Model', 'Firewall'] },
  { term: 'Purdue Enterprise Reference Architecture', acronym: 'PERA', definition: 'A reference model for enterprise architecture that shows different levels of a manufacturing enterprise, from the physical process (Level 0) to the enterprise network (Level 5).', category: 'standard', relatedTerms: ['IDMZ', 'IEC 62443'] },
  { term: 'IEC 62443', definition: 'International series of standards addressing cybersecurity for industrial automation and control systems. Covers policy, procedures, and technical requirements.', category: 'standard', relatedTerms: ['NIST CSF', 'NERC CIP'] },
  { term: 'Operational Technology', acronym: 'OT', definition: 'Hardware and software that detects or causes change through direct monitoring and/or control of physical devices, processes and events.', category: 'general', relatedTerms: ['IT', 'ICS', 'SCADA'] },
  { term: 'Industrial Control System', acronym: 'ICS', definition: 'A general term encompassing several types of control systems including SCADA, DCS, and other control system configurations.', category: 'general', relatedTerms: ['SCADA', 'DCS', 'OT'] },
  { term: 'Historian', definition: 'A database application that records time-series process data from industrial control systems. Used for analysis, reporting, and optimization.', category: 'device', relatedTerms: ['SCADA', 'DCS', 'PI'] },
  { term: 'Air Gap', definition: 'A network security measure that ensures a secure computer network is physically isolated from unsecured networks. Often impractical in modern OT environments.', category: 'security', relatedTerms: ['IDMZ', 'Network Segmentation'] },
  { term: 'Fail-Safe', definition: 'A design feature or practice that ensures a predictable, safe system response in the event of a component or power failure.', category: 'safety', relatedTerms: ['SIS', 'ESD', 'Redundancy'] },
];

export function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filteredTerms = glossaryTerms
    .filter(t =>
      t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.acronym && t.acronym.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(t => filterCategory === 'all' || t.category === filterCategory)
    .sort((a, b) => a.term.localeCompare(b.term));

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'device', label: 'Devices' },
    { id: 'protocol', label: 'Protocols' },
    { id: 'security', label: 'Security' },
    { id: 'safety', label: 'Safety' },
    { id: 'standard', label: 'Standards' },
    { id: 'general', label: 'General' },
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'device': return 'bg-cyan-500/10 text-cyan-400';
      case 'protocol': return 'bg-blue-500/10 text-blue-400';
      case 'security': return 'bg-emerald-500/10 text-emerald-400';
      case 'safety': return 'bg-red-500/10 text-red-400';
      case 'standard': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((term) => (
          <div
            key={term.term}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
              className="w-full p-4 text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{term.term}</h3>
                    {term.acronym && (
                      <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-cyan-400 font-mono">
                        {term.acronym}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs px-2 py-0.5 rounded w-fit ${getCategoryColor(term.category)}`}>
                    {term.category}
                  </p>
                </div>
                <HelpCircle size={16} className="text-slate-500 shrink-0" />
              </div>

              {expandedTerm === term.term && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-sm text-slate-300 mb-3">{term.definition}</p>
                  {term.relatedTerms && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Related:</p>
                      <div className="flex flex-wrap gap-1">
                        {term.relatedTerms.map(rt => (
                          <span key={rt} className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                            {rt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No terms match your search</p>
        </div>
      )}
    </div>
  );
}
