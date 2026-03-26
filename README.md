# Attraction Technology Security Lab

A self-contained, modular web-based training platform for learning ICS/OT cybersecurity through hands-on practice with realistic attraction control systems. This interactive learning environment combines security training, architecture design, compliance assessment, and live attack/defense scenarios.

## Overview

This platform provides an immersive learning experience for securing industrial control systems in the entertainment and attractions industry. It features a simulated multi-PLC attraction control system with real-time monitoring, interactive security configuration, and guided training modules.

**Deployment Modes:**
- **Standalone Mode** - Runs completely locally with Python backend (no cloud dependencies)
- **Cloud-Enhanced Mode** - Optional Supabase integration for persistence and multi-user features

**Key Learning Areas:**
- ICS/OT Security Architecture & Design
- Network Segmentation & Defense-in-Depth
- Protocol Security (Modbus TCP)
- Safety Instrumented Systems (SIS)
- Attack Scenarios & Defense Strategies
- Compliance Frameworks (IEC 62443, NIST CSF)
- Real-world Incident Analysis (TRITON/TRISIS)

## Core Features

### 🎓 Interactive Training Modules

**Security Training Dashboard**
- Hands-on labs for building ICS security controls
- Firewall rule editor with real-time validation
- Protocol filter builder for Modbus security
- IDS signature creation and testing
- ACL (Access Control List) configuration
- Defense effectiveness scoring and feedback

**Architecture Training**
- Purdue Model visualization and design
- Industrial DMZ (IDMZ) configuration
- Network topology designer
- Zone-based segmentation editor
- Real-time architecture validation

**Educational Content**
- SAIC vs CIA security priorities comparison
- Modbus protocol deep-dive reference
- ICS/OT security glossary
- Interview preparation mode with Q&A scenarios
- Best practices and industry standards

### 🛡️ Security Configuration Tools

**Firewall Management**
- Create zone-based firewall rules
- Configure source/destination policies
- Test rule effectiveness against attacks
- Visualize traffic flow and blocking

**Protocol Security**
- Define allowed Modbus function codes
- Configure address range restrictions
- Set rate limiting policies
- Protocol-level access control

**Access Control Lists (ACLs)**
- Role-based access control design
- Resource-level permissions
- Subject/resource/operation policies
- Priority-based rule evaluation

**Authentication & Authorization**
- Multi-factor authentication design
- Certificate-based authentication
- Session management configuration
- Identity and access management (IAM) policies

### 🔬 Testing & Simulation

**Scenario Simulator**
- Test security controls against real attacks
- Simulate multi-stage attack campaigns
- Measure defense effectiveness
- Track attack success rates and blocked attempts

**Attack Testing Suite**
- Lateral movement simulation
- Protocol-specific attack vectors
- Safety system manipulation tests
- State machine exploitation

**Performance Analysis**
- Latency impact measurement
- Network performance monitoring
- Security overhead analysis
- Real-time vs safety-critical timing

### ⚠️ Safety Systems

**SIS Protection Panel**
- Safety Instrumented System configuration
- Independent safety logic design
- TRITON/TRISIS attack defense
- SIL (Safety Integrity Level) compliance

**Fail-Safe Design**
- Redundancy configuration
- Fault tolerance planning
- Graceful degradation strategies
- Emergency shutdown procedures

### 📊 Compliance & Assessment

**IEC 62443 Assessment**
- Security level maturity evaluation
- Foundational Requirements mapping
- Gap identification and remediation
- Compliance reporting

**NIST Cybersecurity Framework**
- Five function mapping (Identify, Protect, Detect, Respond, Recover)
- Control implementation tracking
- Maturity assessment
- Framework alignment

**Gap Analysis**
- Current vs target state comparison
- Risk prioritization
- Remediation roadmap
- Progress tracking

**Recommendations Engine**
- AI-powered security recommendations
- Risk-based prioritization
- Implementation guidance
- Best practice suggestions

### 🎮 Live Attraction HMI

**Real-Time Control Interface**
- Monitor 3-PLC distributed system (Main, Safety, Effects)
- Track vehicle position across 26-position track
- Control attraction states (Idle, Starting, Running, Stopping, Emergency)
- Manage safety interlocks and emergency stops
- Configure show effects and lighting
- View system health metrics

**System Monitoring**
- Live Modbus communication tracking
- PLC connection status for all 3 PLCs
- Safety system health monitoring
- Show control effects visualization
- Event timeline and logging

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

**Backend & Services:**
- Python backend for PLC simulation and WebSocket server
- Modbus TCP protocol implementation
- Real-time WebSocket communication
- Supabase (optional) - PostgreSQL database + Realtime subscriptions
- Edge Functions (optional) - Serverless functions for cloud mode
- Row Level Security (optional) - RLS for data protection in cloud mode

**Simulation & Control:**
- Multi-PLC coordination logic
- Realistic Modbus TCP protocol
- OpenPLC Runtime (optional for advanced users)

## Architecture

The platform supports two deployment modes:

### Standalone Mode (Recommended for Quick Start)

```
┌─────────────────────┐
│   Web Browser       │  ← User interface
│   localhost:8080    │
└──────────┬──────────┘
           │ HTTP + WebSocket
           ▼
┌─────────────────────┐
│  Python Backend     │  ← All-in-one server
│  standalone_server  │  - Serves web UI
└──────────┬──────────┘  - WebSocket server
           │ Modbus TCP   - PLC simulation
           ▼
┌─────────────────────┐
│   PLC Simulator     │  ← Industrial controller
│  (optional)         │
└─────────────────────┘
```

**Benefits:**
- No cloud dependencies
- Works completely offline
- Single Python script to run
- Perfect for workshops and isolated environments

### Cloud-Enhanced Mode (Optional)

```
┌─────────────────────┐
│   Web Browser       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   React Frontend    │
│   (Vite dev server) │
└──────────┬──────────┘
           │
           ├─────────────────────┐
           │                     │
           ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Supabase Cloud     │  │  Python Backend     │
│  - Database         │  │  - PLC Simulator    │
│  - Auth (optional)  │  │  - WebSocket        │
│  - Realtime         │  │  - Modbus TCP       │
└─────────────────────┘  └─────────────────────┘
```

**Benefits:**
- Persistent storage of configurations
- Multi-user support with authentication
- Progress tracking across sessions
- Real-time collaboration features
- Historical data analysis

## Getting Started

### Option 1: Standalone Mode (Quickest)

**Prerequisites:**
- Python 3.8+
- pip (Python package manager)

**Steps:**

1. **Clone the repository**
```bash
git clone <repository-url>
cd attraction-security-lab
```

2. **Install Python dependencies**
```bash
cd scripts
pip install -r requirements.txt
```

3. **Run the system**
```bash
python standalone_server.py
```

4. **Access the interface**
Open browser to `http://localhost:8080`

That's it! The system is fully functional without any cloud services.

See [SETUP.md](SETUP.md) for detailed standalone mode instructions.

### Option 2: Cloud-Enhanced Mode

**Prerequisites:**
- Node.js 18+ and npm
- Python 3.8+ and pip
- Modern web browser (Chrome, Firefox, Edge)
- Internet connection
- Supabase account (free tier available)

**Steps:**

1. **Clone the repository**
```bash
git clone <repository-url>
cd attraction-security-lab
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
cd scripts
pip install -r requirements.txt
cd ..
```

4. **Set up environment variables**

Create or edit `.env` file:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

5. **Run database migrations**

Migrations in `supabase/migrations/` will be applied automatically when you deploy to Supabase.

6. **Run the application**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Python Backend:
```bash
cd scripts
python standalone_server.py
```

7. **Access the interface**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

## Database Schema (Cloud Mode Only)

When using Supabase, the platform provides persistent storage:

**Core Tables:**
- `lab_sessions` - Training session management
- `security_configurations` - User-defined security setups
- `defense_rules` - Firewall, protocol filters, IDS signatures, ACLs
- `attack_logs` - Attack attempt tracking and analysis
- `security_scores` - Defense effectiveness metrics

**Challenge System:**
- `challenges` - CTF-style security challenges
- `challenge_completions` - Progress tracking
- `system_events` - Real-time event logging
- `alarm_history` - Alarm tracking and acknowledgment

**Attraction Simulation:**
- `attraction_states` - Historical state snapshots
- `modbus_events` - Protocol-level communication logs
- `process_trends` - Time-series process data
- `system_health_log` - Equipment health tracking

## Navigation Guide

The application uses a sidebar navigation system with the following sections:

**📊 Dashboard** - Overview and quick access to all features

**🎯 Training**
- Security Training Lab - Hands-on security configuration
- Defense Validator - Test your security setup
- Architecture Training - Network design and segmentation

**🏗️ Architecture**
- Purdue Model - Industrial control system reference architecture
- IDMZ Designer - Industrial DMZ configuration
- Network Topology - Visual network designer
- Zone Editor - Segmentation configuration

**🛡️ Security**
- Firewall Manager - Zone-based firewall rules
- Protocol Security - Modbus protocol policies
- Access Control - Role-based access control
- Authentication - Identity and access management

**⚠️ Safety**
- SIS Protection - Safety Instrumented System configuration
- Fail-Safe Simulator - Fault tolerance testing
- TRITON Defense - Attack-specific defenses
- Redundancy Config - High availability design

**🧪 Testing**
- Scenario Simulator - Attack simulation environment
- Lateral Movement - Network traversal testing
- Protocol Attacks - Modbus-specific attack vectors
- Latency Analysis - Performance impact measurement

**📋 Compliance**
- IEC 62443 Assessment - Industry standard evaluation
- NIST CSF Mapping - Framework alignment
- Gap Analysis - Security posture evaluation
- Recommendations - Improvement suggestions

**📚 Education**
- SAIC vs CIA - IT vs OT security priorities
- Protocol Reference - Modbus protocol guide
- Glossary - ICS/OT terminology
- Interview Mode - Job interview preparation

**🎮 Live System**
- Attraction HMI - Real-time control interface

## Learning Path

**Recommended progression for new users:**

1. **Start with Education** → SAIC vs CIA to understand OT security fundamentals
2. **Learn Architecture** → Purdue Model and IDMZ Designer
3. **Build Defenses** → Security Training Lab to configure controls
4. **Test Your Skills** → Defense Validator and Scenario Simulator
5. **Assess Compliance** → IEC 62443 and NIST CSF mapping
6. **Advanced Practice** → Attack testing and live HMI interaction

## Attack Scenarios

The platform includes realistic attack scenarios based on real-world incidents:

- **Safety System Bypass** - TRITON/TRISIS-style attacks on SIS
- **Register Scanning** - Reconnaissance and enumeration
- **Motor Manipulation** - Physical process control
- **Stealth Operations** - Evading detection systems
- **Lateral Movement** - Network traversal and pivoting
- **Protocol Manipulation** - Modbus function code abuse
- **State Machine Attacks** - Logic manipulation
- **Multi-Stage Campaigns** - Coordinated attack chains

## Security Best Practices Covered

- **Network Segmentation** - Purdue Model Levels 0-4
- **Defense in Depth** - Layered security controls
- **Protocol Security** - Function code and address filtering
- **Authentication** - Multi-factor and certificate-based
- **Intrusion Detection** - Pattern and anomaly-based signatures
- **Safety Independence** - Separate SIS from control systems
- **Least Privilege** - Role-based access control
- **Monitoring & Logging** - Comprehensive visibility
- **Incident Response** - Detection, analysis, and remediation

## Educational Use Cases

**Academic Institutions:**
- ICS security courses and labs
- Cybersecurity degree programs
- Engineering curriculum integration
- Research and thesis projects
- Standalone mode ideal for air-gapped lab environments

**Corporate Training:**
- Employee security awareness
- Operator training programs
- Security team skill development
- Red team / blue team exercises
- No internet required for sensitive environments

**Certification Prep:**
- GICSP (Global Industrial Cyber Security Professional)
- GRID (GIAC Response and Industrial Defense)
- ICS/OT security certifications
- Job interview preparation

**Self-Directed Learning:**
- Career development
- Skill building and practice
- Portfolio project showcase
- CTF preparation

## Deployment Flexibility

**Standalone Mode is ideal for:**
- Quick demos and presentations
- Workshops with limited internet
- Air-gapped training environments
- Single-user learning
- Portable USB stick distribution
- Conferences and trade shows

**Cloud-Enhanced Mode is ideal for:**
- Multi-user classrooms
- Progress tracking across sessions
- Remote learning environments
- Team collaboration
- Long-term data analysis
- Managed training programs

## Contributing

Contributions are welcome! Areas for enhancement:

- Additional attack scenarios
- New training modules
- Enhanced visualization
- Protocol support expansion
- Compliance framework updates
- Documentation improvements

## License

MIT

## Disclaimer

This is an **educational platform for defensive security training**. All attack scenarios and techniques are demonstrated in an isolated, simulated environment for learning purposes only.

**Do not** use these techniques on production systems, systems you don't own, or without explicit authorization. Unauthorized access to computer systems is illegal.

## Support & Documentation

- **In-App Help** - Click any "?" icon for contextual help
- **Training Modules** - Step-by-step guided learning
- **Glossary** - Comprehensive ICS/OT terminology
- **Protocol Reference** - Detailed Modbus documentation

## Acknowledgments

Built with inspiration from real-world ICS security research, NIST guidelines, IEC 62443 standards, and lessons learned from incidents like TRITON/TRISIS, Stuxnet, and other notable ICS attacks.
