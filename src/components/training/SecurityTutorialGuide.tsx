import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  AlertTriangle,
  Shield,
  Layers,
  Filter,
  Eye,
  Lock,
  Target,
  Zap,
  Server,
  Network,
  FileWarning,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

interface TutorialChapter {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lessons: TutorialLesson[];
}

interface TutorialLesson {
  id: string;
  title: string;
  duration: string;
  content: React.ReactNode;
  objectives: string[];
  keyTakeaways: string[];
}

const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 'intro',
    title: 'Introduction to ICS Security',
    icon: Shield,
    description: 'Understand the unique challenges of securing industrial control systems',
    lessons: [
      {
        id: 'intro-1',
        title: 'Why ICS Security is Different',
        duration: '10 min',
        objectives: [
          'Understand the CIA vs SAIC priority difference',
          'Learn why traditional IT security approaches fail in OT',
          'Recognize the consequences of ICS attacks',
        ],
        keyTakeaways: [
          'Safety and Availability come before Confidentiality in ICS',
          'Downtime can cause physical harm or death',
          'Legacy systems cannot be easily patched or updated',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">The IT/OT Divide</h4>
              <p className="text-slate-300 mb-4">
                Traditional IT security focuses on the CIA triad: <strong>Confidentiality, Integrity, and Availability</strong>.
                In Industrial Control Systems (ICS) and Operational Technology (OT), these priorities are fundamentally different.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="font-semibold text-blue-300 mb-2">IT Security (CIA)</h5>
                  <ol className="text-sm text-slate-300 space-y-1">
                    <li>1. <strong>Confidentiality</strong> - Protect data from unauthorized access</li>
                    <li>2. <strong>Integrity</strong> - Ensure data hasn't been modified</li>
                    <li>3. <strong>Availability</strong> - Keep systems accessible</li>
                  </ol>
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <h5 className="font-semibold text-orange-300 mb-2">OT Security (SAIC)</h5>
                  <ol className="text-sm text-slate-300 space-y-1">
                    <li>1. <strong>Safety</strong> - Prevent harm to people and environment</li>
                    <li>2. <strong>Availability</strong> - Keep physical processes running</li>
                    <li>3. <strong>Integrity</strong> - Ensure control commands are accurate</li>
                    <li>4. <strong>Confidentiality</strong> - Protect proprietary processes</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h5 className="font-semibold text-red-300 mb-1">Why This Matters</h5>
                    <p className="text-sm text-slate-300">
                      In a theme park attraction, if you prioritize confidentiality over safety, you might
                      encrypt communications so thoroughly that safety systems can't respond in time to an
                      emergency. A 100ms delay in IT is acceptable; in OT controlling an attraction vehicle traveling
                      at high speed, it could mean the difference between a safe stop and a collision.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">The Attraction Control System</h4>
              <p className="text-slate-300 mb-4">
                In this lab, you're securing an attraction control system. The system consists of:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Server className="text-cyan-400 shrink-0 mt-1" size={18} />
                  <div>
                    <h5 className="font-medium text-white">Main PLC (Port 502)</h5>
                    <p className="text-sm text-slate-400">
                      Controls attraction vehicles, motor speeds, zone occupancy, and dispatch sequences.
                      Handles the core attraction experience and vehicle movement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Shield className="text-red-400 shrink-0 mt-1" size={18} />
                  <div>
                    <h5 className="font-medium text-white">Safety PLC (Port 503)</h5>
                    <p className="text-sm text-slate-400">
                      Manages E-stops, door interlocks, restraint sensors, and safety overrides.
                      This is a Safety Instrumented System (SIS) - it must operate independently and fail-safe.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Zap className="text-amber-400 shrink-0 mt-1" size={18} />
                  <div>
                    <h5 className="font-medium text-white">Effects PLC (Port 504)</h5>
                    <p className="text-sm text-slate-400">
                      Controls lighting, audio, animatronics, fog machines, and show effects.
                      Lower criticality but still important for guest experience.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Real-World Attack Consequences</h4>
              <p className="text-slate-300 mb-4">
                ICS attacks have real physical consequences. Consider these scenarios:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-red-500">
                  <h5 className="font-medium text-white">Stuxnet (2010)</h5>
                  <p className="text-sm text-slate-400">
                    Malware that targeted Iranian nuclear centrifuges. It modified PLC code to spin
                    centrifuges at incorrect speeds while reporting normal values to operators.
                    Physical equipment was destroyed while monitors showed everything was fine.
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-orange-500">
                  <h5 className="font-medium text-white">TRITON/TRISIS (2017)</h5>
                  <p className="text-sm text-slate-400">
                    Attacked Safety Instrumented Systems at a petrochemical plant. The malware
                    attempted to disable safety systems that prevent explosions and toxic releases.
                    This is the first known malware designed to cause physical harm to humans.
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-amber-500">
                  <h5 className="font-medium text-white">Ukraine Power Grid (2015, 2016)</h5>
                  <p className="text-sm text-slate-400">
                    Attackers used spear-phishing to gain access, then pivoted to SCADA systems.
                    They opened circuit breakers remotely, cutting power to 230,000 customers in winter.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ),
      },
      {
        id: 'intro-2',
        title: 'The Purdue Model & Network Segmentation',
        duration: '12 min',
        objectives: [
          'Understand the Purdue Enterprise Reference Architecture',
          'Learn why network segmentation is critical',
          'Identify the role of the Industrial DMZ (IDMZ)',
        ],
        keyTakeaways: [
          'Never allow direct communication between IT and control networks',
          'The IDMZ acts as a secure buffer zone',
          'Each level should only communicate with adjacent levels',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">The Purdue Model</h4>
              <p className="text-slate-300 mb-4">
                The Purdue Enterprise Reference Architecture (PERA) defines a hierarchical model for
                industrial network segmentation. It's the foundation of ICS network security.
              </p>

              <div className="space-y-2 mb-6">
                {[
                  { level: '5', name: 'Enterprise Network', color: 'blue', desc: 'Corporate IT, email, ERP systems', ip: '10.0.0.0/16' },
                  { level: '4', name: 'Site Business Planning', color: 'blue', desc: 'Site-level IT systems, reporting', ip: '10.0.0.0/16' },
                  { level: '3.5', name: 'Industrial DMZ', color: 'amber', desc: 'Firewalls, jump servers, historians', ip: '10.1.0.0/24' },
                  { level: '3', name: 'Site Operations', color: 'green', desc: 'HMI, SCADA, engineering workstations', ip: '10.2.0.0/24' },
                  { level: '2', name: 'Area Control', color: 'green', desc: 'PLCs, RTUs, control systems', ip: '10.3.0.0/24' },
                  { level: '1', name: 'Basic Control', color: 'green', desc: 'Sensors, actuators, I/O modules', ip: '10.4.0.0/24' },
                  { level: '0', name: 'Physical Process', color: 'red', desc: 'Physical equipment, ride vehicles', ip: 'N/A' },
                ].map((item) => (
                  <div key={item.level} className={`flex items-center gap-4 p-3 rounded-lg border ${
                    item.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                    item.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
                    item.color === 'green' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                      item.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                      item.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                      item.color === 'green' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      L{item.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{item.ip}</span>
                      </div>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">The Industrial DMZ (IDMZ)</h4>
              <p className="text-slate-300 mb-4">
                The IDMZ (Level 3.5) is the critical security boundary between IT and OT networks.
                It should contain:
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-amber-300 mb-2">Required Components</h5>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Industrial Firewalls (both sides)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Data Diodes for one-way data flow
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Jump Servers for remote access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Historians for data replication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Patch Management servers
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h5 className="font-medium text-red-300 mb-2">Never Allowed</h5>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      Direct IT to OT connections
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      VPN tunnels bypassing the DMZ
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      Shared credentials across zones
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      Dual-homed systems (connected to both)
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      Internet-connected OT devices
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="text-cyan-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h5 className="font-semibold text-cyan-300 mb-1">Application to Attractions</h5>
                    <p className="text-sm text-slate-300">
                      In our theme park scenario, the corporate network (where marketing accesses
                      ride wait time data) should NEVER directly connect to the ride control PLCs.
                      Data flows up through historians in the IDMZ, and any remote maintenance
                      happens through secured jump servers with multi-factor authentication.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ),
      },
    ],
  },
  {
    id: 'firewall',
    title: 'Implementing Firewall Rules',
    icon: Layers,
    description: 'Learn to create effective network access controls between zones',
    lessons: [
      {
        id: 'fw-1',
        title: 'Firewall Fundamentals for ICS',
        duration: '15 min',
        objectives: [
          'Understand stateful vs stateless firewalls',
          'Learn the deny-by-default principle',
          'Master rule ordering and priority',
        ],
        keyTakeaways: [
          'Always start with deny-all, then add specific allows',
          'Rule order matters - first match wins',
          'Log everything for forensics and detection',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Defense in Depth</h4>
              <p className="text-slate-300 mb-4">
                Firewalls are your first line of defense, but they're not enough alone. ICS security
                requires multiple layers of protection. Even if one layer fails, others should catch the attack.
              </p>

              <div className="p-4 bg-slate-800/50 rounded-lg mb-6">
                <h5 className="font-medium text-white mb-3">The Onion Model</h5>
                <div className="flex items-center justify-center gap-2">
                  {['Firewall', 'Protocol Filter', 'Authentication', 'IDS/IPS', 'Application'].map((layer, i) => (
                    <div key={layer} className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xs font-medium ${
                        i === 0 ? 'bg-orange-500/30 text-orange-300 border-2 border-orange-500' :
                        i === 1 ? 'bg-blue-500/30 text-blue-300 border-2 border-blue-500' :
                        i === 2 ? 'bg-green-500/30 text-green-300 border-2 border-green-500' :
                        i === 3 ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-500' :
                        'bg-cyan-500/30 text-cyan-300 border-2 border-cyan-500'
                      }`}>
                        {layer}
                      </div>
                      <span className="text-[10px] text-slate-500">Layer {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Rule Structure</h4>
              <p className="text-slate-300 mb-4">
                Every firewall rule has these components:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400">Component</th>
                      <th className="text-left py-2 px-3 text-slate-400">Description</th>
                      <th className="text-left py-2 px-3 text-slate-400">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3 font-mono text-cyan-300">Priority</td>
                      <td className="py-2 px-3">Order of evaluation (lower = first)</td>
                      <td className="py-2 px-3">10, 20, 100</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3 font-mono text-cyan-300">Source IP/CIDR</td>
                      <td className="py-2 px-3">Where traffic originates</td>
                      <td className="py-2 px-3">10.0.0.0/16, 10.2.0.50</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3 font-mono text-cyan-300">Dest IP/CIDR</td>
                      <td className="py-2 px-3">Where traffic is going</td>
                      <td className="py-2 px-3">10.3.0.0/24</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3 font-mono text-cyan-300">Dest Port</td>
                      <td className="py-2 px-3">Service/protocol port</td>
                      <td className="py-2 px-3">502 (Modbus), 443 (HTTPS)</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3 font-mono text-cyan-300">Protocol</td>
                      <td className="py-2 px-3">TCP, UDP, or any</td>
                      <td className="py-2 px-3">TCP</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-cyan-300">Action</td>
                      <td className="py-2 px-3">What to do with matching traffic</td>
                      <td className="py-2 px-3">ALLOW, DENY, LOG</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Creating Your First Rule</h4>
              <p className="text-slate-300 mb-4">
                Let's create a rule to block enterprise network from directly accessing the Control Zone:
              </p>

              <div className="p-4 bg-slate-900 rounded-lg font-mono text-sm space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Name:</span>
                  <span className="text-amber-300">"Block Enterprise to Control"</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Priority:</span>
                  <span className="text-cyan-300">10</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Source:</span>
                  <span className="text-emerald-300">10.0.0.0/16</span>
                  <span className="text-slate-500">(Enterprise Zone)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Destination:</span>
                  <span className="text-emerald-300">10.3.0.0/24</span>
                  <span className="text-slate-500">(Control Zone)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Port:</span>
                  <span className="text-cyan-300">any</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">Action:</span>
                  <span className="text-red-400">DENY</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h5 className="font-semibold text-amber-300 mb-1">Rule Order Matters!</h5>
                    <p className="text-sm text-slate-300">
                      If you have an ALLOW rule at priority 5 and a DENY rule at priority 10,
                      the ALLOW will match first. Always put your most restrictive rules
                      (DENY) at lower priority numbers, and specific ALLOW exceptions above them.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Recommended Rule Set</h4>
              <p className="text-slate-300 mb-4">
                For our attraction, implement these rules in order:
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <span className="font-medium text-white">DENY Enterprise to Control Zone</span>
                    <p className="text-slate-400">Block all direct traffic from L4-5 to L2</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <span className="font-medium text-white">DENY Enterprise to Safety PLC</span>
                    <p className="text-slate-400">Extra protection for safety-critical systems</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <span className="font-medium text-white">ALLOW Operations to Main PLC (TCP/502)</span>
                    <p className="text-slate-400">HMI needs to communicate with the main controller</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <span className="font-medium text-white">LOG All Other Traffic</span>
                    <p className="text-slate-400">Capture any unexpected communication attempts</p>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        ),
      },
    ],
  },
  {
    id: 'protocol',
    title: 'Protocol Filtering & Deep Packet Inspection',
    icon: Filter,
    description: 'Control Modbus function codes and register access at the application layer',
    lessons: [
      {
        id: 'proto-1',
        title: 'Understanding Modbus TCP',
        duration: '20 min',
        objectives: [
          'Learn the Modbus protocol structure',
          'Understand function codes and their purposes',
          'Identify security implications of each function code',
        ],
        keyTakeaways: [
          'Modbus has no built-in authentication or encryption',
          'Write function codes are the most dangerous',
          'DPI can filter malicious commands that pass firewall rules',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Modbus Protocol Overview</h4>
              <p className="text-slate-300 mb-4">
                Modbus is a serial communication protocol from 1979, later adapted for TCP/IP.
                It's simple, reliable, and ubiquitous in industrial systems - but it has <strong>zero
                security features</strong>. No authentication, no encryption, no integrity checking.
              </p>

              <div className="p-4 bg-slate-800/50 rounded-lg mb-6">
                <h5 className="font-medium text-white mb-3">Modbus TCP Packet Structure</h5>
                <div className="flex gap-1 text-xs">
                  {[
                    { name: 'Transaction ID', size: '2 bytes', color: 'blue' },
                    { name: 'Protocol ID', size: '2 bytes', color: 'slate' },
                    { name: 'Length', size: '2 bytes', color: 'slate' },
                    { name: 'Unit ID', size: '1 byte', color: 'green' },
                    { name: 'Function Code', size: '1 byte', color: 'red' },
                    { name: 'Data', size: 'Variable', color: 'amber' },
                  ].map((field) => (
                    <div key={field.name} className={`flex-1 p-2 rounded text-center ${
                      field.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                      field.color === 'green' ? 'bg-emerald-500/20 text-emerald-300' :
                      field.color === 'red' ? 'bg-red-500/20 text-red-300' :
                      field.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      <div className="font-medium">{field.name}</div>
                      <div className="text-[10px] opacity-70">{field.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Function Codes Explained</h4>
              <p className="text-slate-300 mb-4">
                The function code determines what operation is performed. This is critical for security:
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="font-medium text-blue-300 mb-2">Read Operations (Lower Risk)</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">FC 01</span>
                      Read Coils (discrete outputs)
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">FC 02</span>
                      Read Discrete Inputs
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">FC 03</span>
                      Read Holding Registers
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">FC 04</span>
                      Read Input Registers
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h5 className="font-medium text-red-300 mb-2">Write Operations (HIGH RISK)</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded">FC 05</span>
                      Write Single Coil
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded">FC 06</span>
                      Write Single Register
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded">FC 15</span>
                      Write Multiple Coils
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded">FC 16</span>
                      Write Multiple Registers
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h5 className="font-semibold text-red-300 mb-1">Why Writes Are Dangerous</h5>
                    <p className="text-sm text-slate-300">
                      FC 05 (Write Single Coil) to address 100 on the Safety PLC could disable the
                      safety override. An attacker with network access can send this command directly -
                      there's no authentication required. The PLC will execute it immediately.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Register Address Mapping</h4>
              <p className="text-slate-300 mb-4">
                Different register addresses control different functions. Our attraction uses:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400">PLC</th>
                      <th className="text-left py-2 px-3 text-slate-400">Address Range</th>
                      <th className="text-left py-2 px-3 text-slate-400">Function</th>
                      <th className="text-left py-2 px-3 text-slate-400">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Safety PLC</td>
                      <td className="py-2 px-3 font-mono">Coils 0-3</td>
                      <td className="py-2 px-3">E-Stop Status</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">CRITICAL</span></td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Safety PLC</td>
                      <td className="py-2 px-3 font-mono">Coil 100</td>
                      <td className="py-2 px-3">Safety Override</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">CRITICAL</span></td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Main PLC</td>
                      <td className="py-2 px-3 font-mono">Registers 0-9</td>
                      <td className="py-2 px-3">System Mode/State</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">HIGH</span></td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Main PLC</td>
                      <td className="py-2 px-3 font-mono">Registers 10-19</td>
                      <td className="py-2 px-3">Motor Speeds</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">HIGH</span></td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Effects PLC</td>
                      <td className="py-2 px-3 font-mono">Registers 0-9</td>
                      <td className="py-2 px-3">Lighting Scenes</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">MEDIUM</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Implementing Protocol Filters</h4>
              <p className="text-slate-300 mb-4">
                Create filters to restrict which function codes are allowed from each source:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Filter 1: HMI Read-Only Access</h5>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p><span className="text-slate-500">Source:</span> HMI Stations (10.3.0.10-11)</p>
                    <p><span className="text-slate-500">Allowed:</span> FC 1, 2, 3, 4 (read operations only)</p>
                    <p><span className="text-slate-500">Blocked:</span> FC 5, 6, 15, 16 (all writes)</p>
                    <p><span className="text-slate-500">Purpose:</span> Operators can monitor but not modify</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Filter 2: Engineering Write Access</h5>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p><span className="text-slate-500">Source:</span> Engineering Workstations (10.2.0.20-21)</p>
                    <p><span className="text-slate-500">Allowed:</span> FC 1, 2, 3, 4, 5, 6, 15, 16</p>
                    <p><span className="text-slate-500">Address Restriction:</span> Only Main PLC registers 0-199</p>
                    <p><span className="text-slate-500">Purpose:</span> Engineers can tune parameters but not safety</p>
                  </div>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h5 className="font-medium text-red-300 mb-2">Filter 3: Block Safety PLC Writes</h5>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p><span className="text-slate-500">Source:</span> ANY</p>
                    <p><span className="text-slate-500">Destination:</span> Safety PLC (Port 503)</p>
                    <p><span className="text-slate-500">Blocked:</span> All write function codes</p>
                    <p><span className="text-slate-500">Purpose:</span> Safety PLC should only accept local writes</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ),
      },
    ],
  },
  {
    id: 'ids',
    title: 'Intrusion Detection Systems',
    icon: Eye,
    description: 'Create signatures to detect attacks and anomalous behavior',
    lessons: [
      {
        id: 'ids-1',
        title: 'IDS Detection Strategies',
        duration: '18 min',
        objectives: [
          'Understand pattern-based vs anomaly detection',
          'Learn to create effective IDS signatures',
          'Map detections to MITRE ATT&CK framework',
        ],
        keyTakeaways: [
          'Combine multiple detection types for best coverage',
          'Threshold detection catches reconnaissance and DoS',
          'Sequence detection identifies multi-stage attacks',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Detection Types</h4>
              <p className="text-slate-300 mb-4">
                IDS systems use multiple detection strategies. Each has strengths and weaknesses:
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-cyan-300 mb-2">Pattern/Signature-Based</h5>
                  <p className="text-sm text-slate-400 mb-2">
                    Matches known attack signatures in network traffic.
                  </p>
                  <div className="text-xs text-slate-500">
                    <p className="text-emerald-400">+ Fast and accurate for known attacks</p>
                    <p className="text-emerald-400">+ Low false positives when tuned</p>
                    <p className="text-red-400">- Cannot detect new/unknown attacks</p>
                    <p className="text-red-400">- Requires signature updates</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-purple-300 mb-2">Threshold-Based</h5>
                  <p className="text-sm text-slate-400 mb-2">
                    Alerts when activity exceeds defined limits.
                  </p>
                  <div className="text-xs text-slate-500">
                    <p className="text-emerald-400">+ Catches scanning and DoS attacks</p>
                    <p className="text-emerald-400">+ Simple to implement and understand</p>
                    <p className="text-red-400">- May miss slow/patient attacks</p>
                    <p className="text-red-400">- Thresholds need tuning</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-amber-300 mb-2">Anomaly-Based</h5>
                  <p className="text-sm text-slate-400 mb-2">
                    Learns normal behavior, alerts on deviations.
                  </p>
                  <div className="text-xs text-slate-500">
                    <p className="text-emerald-400">+ Can detect unknown attacks</p>
                    <p className="text-emerald-400">+ Adapts to environment</p>
                    <p className="text-red-400">- Higher false positive rate</p>
                    <p className="text-red-400">- Requires training period</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h5 className="font-medium text-green-300 mb-2">Sequence-Based</h5>
                  <p className="text-sm text-slate-400 mb-2">
                    Detects specific sequences of events over time.
                  </p>
                  <div className="text-xs text-slate-500">
                    <p className="text-emerald-400">+ Catches multi-stage attacks</p>
                    <p className="text-emerald-400">+ Reduces false positives</p>
                    <p className="text-red-400">- Complex to configure</p>
                    <p className="text-red-400">- May miss out-of-order events</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Creating Signatures for Our Attraction</h4>

              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h5 className="font-medium text-red-300 mb-2">Signature: Safety Override Detection (CRITICAL)</h5>
                  <div className="text-sm text-slate-300 space-y-2 mb-3">
                    <p><span className="text-slate-500">Type:</span> Pattern-based</p>
                    <p><span className="text-slate-500">Pattern:</span> <code className="bg-slate-800 px-1 rounded">00 05 00 64 FF 00</code></p>
                    <p><span className="text-slate-500">Translation:</span> FC 05 (Write Coil) to Address 100 (0x64) with value ON (0xFF00)</p>
                    <p><span className="text-slate-500">Action:</span> Alert & Block immediately</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    This detects any attempt to enable the safety override coil. This should NEVER
                    happen during normal operations and indicates a direct attack on safety systems.
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <h5 className="font-medium text-orange-300 mb-2">Signature: Register Scanning (HIGH)</h5>
                  <div className="text-sm text-slate-300 space-y-2 mb-3">
                    <p><span className="text-slate-500">Type:</span> Threshold-based</p>
                    <p><span className="text-slate-500">Metric:</span> Requests per second from single source</p>
                    <p><span className="text-slate-500">Threshold:</span> &gt; 50 requests/second</p>
                    <p><span className="text-slate-500">Action:</span> Alert, block after 5 seconds</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Attackers often scan PLCs to map register values before launching attacks.
                    Normal HMI polling is ~10 requests/sec. 50+ indicates scanning/reconnaissance.
                  </p>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <h5 className="font-medium text-purple-300 mb-2">Signature: E-Stop Manipulation Sequence (CRITICAL)</h5>
                  <div className="text-sm text-slate-300 space-y-2 mb-3">
                    <p><span className="text-slate-500">Type:</span> Sequence-based</p>
                    <p><span className="text-slate-500">Events:</span></p>
                    <ol className="pl-4 space-y-1">
                      <li>1. Read Coils 0-3 (FC 01) - Attacker checks E-stop status</li>
                      <li>2. Write Coil in range 0-3 (FC 05) - Attacker manipulates E-stop</li>
                    </ol>
                    <p><span className="text-slate-500">Time window:</span> 10 seconds</p>
                    <p><span className="text-slate-500">Action:</span> Alert & Block</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Reading E-stop status followed by writing is a classic attack pattern.
                    Normal operations don't write to E-stop coils from the network.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">MITRE ATT&CK for ICS</h4>
              <p className="text-slate-300 mb-4">
                Map your signatures to MITRE ATT&CK techniques for standardized threat classification:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400">Technique</th>
                      <th className="text-left py-2 px-3 text-slate-400">ID</th>
                      <th className="text-left py-2 px-3 text-slate-400">Description</th>
                      <th className="text-left py-2 px-3 text-slate-400">Detection</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Point & Tag Identification</td>
                      <td className="py-2 px-3 font-mono text-cyan-300">T0861</td>
                      <td className="py-2 px-3">Scanning for register addresses</td>
                      <td className="py-2 px-3">Threshold (requests/sec)</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Manipulation of Control</td>
                      <td className="py-2 px-3 font-mono text-cyan-300">T0831</td>
                      <td className="py-2 px-3">Modifying control logic/values</td>
                      <td className="py-2 px-3">Pattern (write commands)</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 px-3">Safety System Bypass</td>
                      <td className="py-2 px-3 font-mono text-cyan-300">T0816</td>
                      <td className="py-2 px-3">Disabling safety interlocks</td>
                      <td className="py-2 px-3">Pattern + Sequence</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Denial of Service</td>
                      <td className="py-2 px-3 font-mono text-cyan-300">T0814</td>
                      <td className="py-2 px-3">Overwhelming control systems</td>
                      <td className="py-2 px-3">Threshold (volume)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ),
      },
    ],
  },
  {
    id: 'acl',
    title: 'Access Control Implementation',
    icon: Lock,
    description: 'Define role-based access and authentication requirements',
    lessons: [
      {
        id: 'acl-1',
        title: 'Principle of Least Privilege',
        duration: '15 min',
        objectives: [
          'Understand role-based access control (RBAC)',
          'Implement the principle of least privilege',
          'Configure time-based and conditional access',
        ],
        keyTakeaways: [
          'Users should only have access they need for their job',
          'Write access requires stronger authentication',
          'Time restrictions limit the attack window',
        ],
        content: (
          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Why Access Control Matters</h4>
              <p className="text-slate-300 mb-4">
                Even with firewalls and protocol filters, you need to control WHO can do WHAT.
                The principle of least privilege states: every user, program, and system should
                operate using the minimum privileges necessary.
              </p>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h5 className="font-semibold text-amber-300 mb-1">Real-World Example: Maroochy Shire</h5>
                    <p className="text-sm text-slate-300">
                      In 2000, a disgruntled former contractor used his still-valid credentials to
                      release 800,000 liters of raw sewage into Australian waterways. He had retained
                      full access after his employment ended. Proper access control would have
                      revoked his permissions immediately upon termination.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Role Definitions for Attractions</h4>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-300 text-sm font-bold">O</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-white">Operator</h5>
                      <p className="text-xs text-slate-500">Day-to-day ride operations</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1 ml-11">
                    <p><span className="text-emerald-400">CAN:</span> View all status, dispatch vehicles, E-stop</p>
                    <p><span className="text-red-400">CANNOT:</span> Modify setpoints, access Safety PLC, change modes</p>
                    <p><span className="text-slate-500">Auth:</span> Badge + PIN</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-300 text-sm font-bold">M</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-white">Maintenance Tech</h5>
                      <p className="text-xs text-slate-500">Scheduled maintenance tasks</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1 ml-11">
                    <p><span className="text-emerald-400">CAN:</span> View diagnostics, test effects, read maintenance logs</p>
                    <p><span className="text-red-400">CANNOT:</span> Operate ride, modify control parameters</p>
                    <p><span className="text-slate-500">Auth:</span> Badge + PIN, restricted hours (6AM-10PM)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-300 text-sm font-bold">E</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-white">Control Engineer</h5>
                      <p className="text-xs text-slate-500">PLC programming and tuning</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1 ml-11">
                    <p><span className="text-emerald-400">CAN:</span> Full access to Main/Effects PLC, modify setpoints</p>
                    <p><span className="text-red-400">CANNOT:</span> Modify Safety PLC (requires supervisor override)</p>
                    <p><span className="text-slate-500">Auth:</span> MFA required, from Engineering WS only</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-300 text-sm font-bold">S</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-white">Supervisor</h5>
                      <p className="text-xs text-slate-500">Override and emergency access</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1 ml-11">
                    <p><span className="text-emerald-400">CAN:</span> Override safety interlocks (with logging), all operations</p>
                    <p><span className="text-slate-500">Auth:</span> MFA + physical key, logged and audited</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Implementing ACL Entries</h4>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <h5 className="font-medium text-emerald-300 mb-2">ACL 1: Operator Read Access</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Subject</p>
                      <p className="text-slate-300">Role: Operator</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resource</p>
                      <p className="text-slate-300">All PLCs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Operations</p>
                      <p className="text-slate-300">READ only</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Conditions</p>
                      <p className="text-slate-300">Basic auth, HMI only</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h5 className="font-medium text-red-300 mb-2">ACL 2: Block Enterprise Zone Writes</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Subject</p>
                      <p className="text-slate-300">Zone: Enterprise (10.0.0.0/16)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resource</p>
                      <p className="text-slate-300">All PLCs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Operations</p>
                      <p className="text-slate-300">WRITE (DENY)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Priority</p>
                      <p className="text-slate-300">10 (high priority deny)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h5 className="font-medium text-amber-300 mb-2">ACL 3: Engineer Time-Restricted Access</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Subject</p>
                      <p className="text-slate-300">Role: Engineer</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resource</p>
                      <p className="text-slate-300">Main PLC, Effects PLC</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Operations</p>
                      <p className="text-slate-300">READ, WRITE</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Conditions</p>
                      <p className="text-slate-300">MFA, Mon-Fri 6AM-10PM, Eng WS only</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-white mb-3">Authentication Levels</h4>
              <p className="text-slate-300 mb-4">
                Stronger operations require stronger authentication:
              </p>

              <div className="space-y-2">
                {[
                  { level: 'None', desc: 'Anonymous access', use: 'Public status displays only', risk: 'high' },
                  { level: 'Basic', desc: 'Username + Password', use: 'Read operations, operator monitoring', risk: 'medium' },
                  { level: 'MFA', desc: 'Password + Token/App', use: 'Write operations, parameter changes', risk: 'low' },
                  { level: 'Certificate', desc: 'PKI + Smart Card', use: 'Safety system access, emergency override', risk: 'lowest' },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      item.risk === 'high' ? 'bg-red-500' :
                      item.risk === 'medium' ? 'bg-amber-500' :
                      item.risk === 'low' ? 'bg-emerald-500' :
                      'bg-cyan-500'
                    }`} />
                    <div className="w-24 font-medium text-white">{item.level}</div>
                    <div className="flex-1 text-sm text-slate-400">{item.desc}</div>
                    <div className="text-xs text-slate-500">{item.use}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ),
      },
    ],
  },
];

export function SecurityTutorialGuide() {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['intro']));
  const [activeLesson, setActiveLesson] = useState<string | null>('intro-1');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const markComplete = (lessonId: string) => {
    setCompletedLessons(new Set([...completedLessons, lessonId]));
  };

  const currentLesson = TUTORIAL_CHAPTERS
    .flatMap(c => c.lessons)
    .find(l => l.id === activeLesson);

  const progress = (completedLessons.size / TUTORIAL_CHAPTERS.flatMap(c => c.lessons).length) * 100;

  return (
    <div className="flex h-full gap-6">
      <div className="w-80 shrink-0 space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="text-cyan-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Security Training</h2>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {TUTORIAL_CHAPTERS.map((chapter) => (
            <div key={chapter.id} className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors"
              >
                <chapter.icon size={18} className="text-slate-400" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{chapter.title}</div>
                  <div className="text-[10px] text-slate-500">{chapter.lessons.length} lessons</div>
                </div>
                {expandedChapters.has(chapter.id) ? (
                  <ChevronDown size={16} className="text-slate-500" />
                ) : (
                  <ChevronRight size={16} className="text-slate-500" />
                )}
              </button>

              {expandedChapters.has(chapter.id) && (
                <div className="border-t border-slate-700/50">
                  {chapter.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        activeLesson === lesson.id
                          ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                          : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                      }`}
                    >
                      {completedLessons.has(lesson.id) ? (
                        <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Circle size={14} className="text-slate-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs truncate ${
                          activeLesson === lesson.id ? 'text-cyan-300' : 'text-slate-300'
                        }`}>
                          {lesson.title}
                        </div>
                        <div className="text-[10px] text-slate-500">{lesson.duration}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {currentLesson ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{currentLesson.title}</h1>
                <p className="text-slate-400 text-sm mt-1">Estimated time: {currentLesson.duration}</p>
              </div>
              {!completedLessons.has(currentLesson.id) && (
                <button
                  onClick={() => markComplete(currentLesson.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  <CheckCircle size={16} />
                  Mark Complete
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target size={16} className="text-amber-400" />
                  Learning Objectives
                </h3>
                <ul className="space-y-2">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <ChevronRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-cyan-400" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {currentLesson.keyTakeaways.map((key, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              {currentLesson.content}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select a lesson to begin
          </div>
        )}
      </div>
    </div>
  );
}
