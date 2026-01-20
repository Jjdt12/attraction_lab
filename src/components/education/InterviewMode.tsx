import { useState } from 'react';
import {
  Presentation,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  Target,
  Shield,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import type { ViewType } from '../../App';

interface TourStep {
  id: string;
  title: string;
  description: string;
  talkingPoints: string[];
  demonstrationView: ViewType;
  keyTakeaway: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'intro',
    title: 'Welcome to the ICS Security Engineering Lab',
    description: 'This interactive lab demonstrates how to design, implement, and defend industrial control system network architectures.',
    talkingPoints: [
      'This is not about hacking PLCs - it\'s about building secure architectures',
      'The focus is on defense-in-depth: multiple layers of security controls',
      'We use a realistic model based on the Purdue Enterprise Reference Architecture',
      'Every feature helps you understand both theory and practical implementation',
    ],
    demonstrationView: 'dashboard',
    keyTakeaway: 'The goal is to transform "I can hack PLCs" into "I can design secure ICS architectures"',
  },
  {
    id: 'architecture',
    title: 'Understanding the Purdue Model',
    description: 'The foundation of ICS security is proper network segmentation based on the Purdue model.',
    talkingPoints: [
      'Level 0-1: Physical process and basic control (PLCs, sensors, actuators)',
      'Level 2: Area supervisory control (HMIs, local control rooms)',
      'Level 3: Site operations (SCADA servers, historians)',
      'Level 4-5: Enterprise IT systems',
      'The IDMZ sits between IT and OT, preventing direct connections',
    ],
    demonstrationView: 'purdue-model',
    keyTakeaway: 'Network segmentation is the single most important control in ICS security',
  },
  {
    id: 'idmz',
    title: 'The Industrial DMZ',
    description: 'The IDMZ is the buffer zone that controls all communication between IT and OT networks.',
    talkingPoints: [
      'No direct paths should exist between IT and OT',
      'Data diodes provide hardware-enforced one-way communication',
      'Jump servers provide controlled access for administrators',
      'Historian mirrors allow IT systems to read OT data without direct access',
      'All traffic crossing the boundary should be inspected and logged',
    ],
    demonstrationView: 'idmz-designer',
    keyTakeaway: 'The IDMZ prevents IT compromises from becoming OT compromises',
  },
  {
    id: 'security-controls',
    title: 'Layered Security Controls',
    description: 'Defense in depth means implementing multiple overlapping security controls.',
    talkingPoints: [
      'Firewalls: Control traffic between zones based on rules',
      'Protocol filtering: Only allow necessary industrial protocols',
      'Access control: Role-based permissions for each zone',
      'Authentication: MFA for remote access, certificates for devices',
      'Each layer provides protection even if another layer fails',
    ],
    demonstrationView: 'firewall-manager',
    keyTakeaway: 'No single control is sufficient - security requires multiple layers',
  },
  {
    id: 'safety',
    title: 'Safety System Protection',
    description: 'Safety Instrumented Systems (SIS) require special protection because they protect human life.',
    talkingPoints: [
      'SIS must be isolated from both BPCS and IT networks',
      'TRITON malware showed that attackers will target safety systems',
      'Physical key switches can prevent remote changes to safety logic',
      'Redundancy (2oo3 voting) prevents single points of failure',
      'Proof testing ensures safety systems will work when needed',
    ],
    demonstrationView: 'sis-protection',
    keyTakeaway: 'Safety systems are the last line of defense - they must be protected above all else',
  },
  {
    id: 'validation',
    title: 'Validating Your Defenses',
    description: 'Attack testing validates that your security architecture actually works.',
    talkingPoints: [
      'Scenario simulation: Test against known attack patterns',
      'Lateral movement testing: Can ransomware reach OT?',
      'Protocol attacks: Does your filtering block malicious commands?',
      'Latency analysis: Will security break real-time control?',
      'These tools prove your defenses work, not just that they exist',
    ],
    demonstrationView: 'scenario-simulator',
    keyTakeaway: 'Security that isn\'t tested isn\'t security - validate your architecture',
  },
  {
    id: 'compliance',
    title: 'Compliance and Standards',
    description: 'Standards like IEC 62443 and NIST CSF provide frameworks for measuring security.',
    talkingPoints: [
      'IEC 62443 defines Security Levels (SL) for industrial systems',
      'NIST CSF covers Identify, Protect, Detect, Respond, Recover',
      'Gap analysis shows where your architecture needs improvement',
      'Recommendations provide actionable steps to close gaps',
      'Compliance isn\'t the goal - security is. Standards help measure it.',
    ],
    demonstrationView: 'iec-62443',
    keyTakeaway: 'Use standards as a framework, not a checklist',
  },
  {
    id: 'priorities',
    title: 'SAIC vs CIA: The Priority Inversion',
    description: 'OT security priorities differ fundamentally from IT security.',
    talkingPoints: [
      'IT prioritizes: Confidentiality > Integrity > Availability (CIA)',
      'OT prioritizes: Safety > Availability > Integrity > Confidentiality (SAIC)',
      'Safety comes first because OT can have physical consequences',
      'Availability is critical - processes often can\'t be paused for patching',
      'Security controls must enhance safety, never compromise it',
    ],
    demonstrationView: 'saic-vs-cia',
    keyTakeaway: 'Always ask: "Will this security control impact safety or availability?"',
  },
];

interface InterviewModeProps {
  onNavigate: (view: ViewType) => void;
}

export function InterviewMode({ onNavigate }: InterviewModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToDemo = () => {
    onNavigate(step.demonstrationView);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500/10 to-slate-900 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Presentation size={24} className="text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Interview Mode</h2>
              <p className="text-sm text-slate-400">Guided walkthrough for demonstrations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Step {currentStep + 1} of {tourSteps.length}</span>
          </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Tour Sections</h3>
          {tourSteps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${
                currentStep === idx
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : idx < currentStep
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                idx < currentStep
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : currentStep === idx
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {idx < currentStep ? <CheckCircle2 size={14} /> : idx + 1}
              </span>
              <span className={`text-sm ${
                currentStep === idx ? 'text-white' : 'text-slate-400'
              }`}>
                {s.title}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-slate-300 mb-6">{step.description}</p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">Talking Points</h3>
              <ul className="space-y-3">
                {step.talkingPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Key Takeaway</span>
              </div>
              <p className="text-sm text-white">{step.keyTakeaway}</p>
            </div>

            <button
              onClick={goToDemo}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              <span>Open Demonstration</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentStep(0)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={nextStep}
              disabled={currentStep === tourSteps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
