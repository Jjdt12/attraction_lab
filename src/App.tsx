import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { PurdueModel } from './components/architecture/PurdueModel';
import { IDMZDesigner } from './components/architecture/IDMZDesigner';
import { NetworkTopology } from './components/architecture/NetworkTopology';
import { ZoneEditor } from './components/architecture/ZoneEditor';
import { ArchitectureTrainingDashboard } from './components/architecture/ArchitectureTrainingDashboard';
import { FirewallManager } from './components/security/FirewallManager';
import { ProtocolSecurity } from './components/security/ProtocolSecurity';
import { AccessControlLists } from './components/security/AccessControlLists';
import { AuthenticationConfig } from './components/security/AuthenticationConfig';
import { SISProtectionPanel } from './components/safety/SISProtectionPanel';
import { FailSafeSimulator } from './components/safety/FailSafeSimulator';
import { TRITONDefense } from './components/safety/TRITONDefense';
import { RedundancyConfig } from './components/safety/RedundancyConfig';
import { ScenarioSimulator } from './components/testing/ScenarioSimulator';
import { LateralMovementTest } from './components/testing/LateralMovementTest';
import { ProtocolAttackTest } from './components/testing/ProtocolAttackTest';
import { LatencyAnalysis } from './components/testing/LatencyAnalysis';
import { IEC62443Assessment } from './components/compliance/IEC62443Assessment';
import { NISTCSFMapping } from './components/compliance/NISTCSFMapping';
import { GapAnalysis } from './components/compliance/GapAnalysis';
import { RecommendationsEngine } from './components/compliance/RecommendationsEngine';
import { SAICvsCIA } from './components/education/SAICvsCIA';
import { ProtocolReference } from './components/education/ProtocolReference';
import { Glossary } from './components/education/Glossary';
import { InterviewMode } from './components/education/InterviewMode';
import { Dashboard } from './components/Dashboard';
import { AttractionHMI } from './components/hmi/AttractionHMI';
import { SecurityTrainingDashboard } from './components/training/SecurityTrainingDashboard';
import { DefenseValidator } from './components/training/DefenseValidator';
import { LabEnvironmentProvider } from './contexts/LabEnvironmentContext';
import { SecurityProvider } from './contexts/SecurityContext';

export type ViewType =
  | 'dashboard'
  | 'attraction-hmi'
  | 'security-training'
  | 'defense-validator'
  | 'architecture-training'
  | 'purdue-model'
  | 'idmz-designer'
  | 'network-topology'
  | 'zone-editor'
  | 'firewall-manager'
  | 'protocol-security'
  | 'access-control'
  | 'authentication'
  | 'sis-protection'
  | 'fail-safe'
  | 'triton-defense'
  | 'redundancy'
  | 'scenario-simulator'
  | 'lateral-movement'
  | 'protocol-attack'
  | 'latency-analysis'
  | 'iec-62443'
  | 'nist-csf'
  | 'gap-analysis'
  | 'recommendations'
  | 'saic-vs-cia'
  | 'protocol-reference'
  | 'glossary'
  | 'interview-mode';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'attraction-hmi':
        return <AttractionHMI />;
      case 'security-training':
        return <SecurityTrainingDashboard />;
      case 'defense-validator':
        return <DefenseValidator />;
      case 'architecture-training':
        return <ArchitectureTrainingDashboard />;
      case 'purdue-model':
        return <PurdueModel />;
      case 'idmz-designer':
        return <IDMZDesigner />;
      case 'network-topology':
        return <NetworkTopology />;
      case 'zone-editor':
        return <ZoneEditor />;
      case 'firewall-manager':
        return <FirewallManager />;
      case 'protocol-security':
        return <ProtocolSecurity />;
      case 'access-control':
        return <AccessControlLists />;
      case 'authentication':
        return <AuthenticationConfig />;
      case 'sis-protection':
        return <SISProtectionPanel />;
      case 'fail-safe':
        return <FailSafeSimulator />;
      case 'triton-defense':
        return <TRITONDefense />;
      case 'redundancy':
        return <RedundancyConfig />;
      case 'scenario-simulator':
        return <ScenarioSimulator />;
      case 'lateral-movement':
        return <LateralMovementTest />;
      case 'protocol-attack':
        return <ProtocolAttackTest />;
      case 'latency-analysis':
        return <LatencyAnalysis />;
      case 'iec-62443':
        return <IEC62443Assessment />;
      case 'nist-csf':
        return <NISTCSFMapping />;
      case 'gap-analysis':
        return <GapAnalysis />;
      case 'recommendations':
        return <RecommendationsEngine />;
      case 'saic-vs-cia':
        return <SAICvsCIA />;
      case 'protocol-reference':
        return <ProtocolReference />;
      case 'glossary':
        return <Glossary />;
      case 'interview-mode':
        return <InterviewMode onNavigate={setCurrentView} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <LabEnvironmentProvider>
      <SecurityProvider>
        <div className="min-h-screen bg-slate-950 flex">
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <TopBar currentView={currentView} />
            <main className="flex-1 p-6 overflow-auto">
              {renderView()}
            </main>
          </div>
        </div>
      </SecurityProvider>
    </LabEnvironmentProvider>
  );
}

export default App;
