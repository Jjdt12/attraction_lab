import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import AttractionVisualizer from './components/AttractionVisualizer';
import ControlPanel from './components/ControlPanel';
import CoilStatus from './components/CoilStatus';
import PLCStateMonitor from './components/PLCStateMonitor';
import RideEventsMonitor from './components/RideEventsMonitor';
import FlagNotificationManager from './components/FlagNotificationManager';
import { useWebSocketSimulation } from './hooks/useWebSocketSimulation';
import { useAdvancedChallengeDetection } from './hooks/useAdvancedChallengeDetection';
import { ALL_EVENTS } from './types/rideEvents';
import { TabNavigation, TabType } from './components/TabNavigation';
import { AlarmPanel, AlarmList } from './components/AlarmPanel';
import { EventLog } from './components/EventLog';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { NetworkMonitor } from './components/NetworkMonitor';
import { TrendChart, useTrendData } from './components/TrendChart';
import { DocumentationViewer } from './components/DocumentationViewer';
import { MultiPLCStatus } from './components/MultiPLCStatus';
import { useMultiPLCConnection } from './hooks/useMultiPLCConnection';
import { useAlarmSystem } from './hooks/useAlarmSystem';
import { ProcessSimulator } from './utils/processSimulation';

function App() {
  const [flagCapture, setFlagCapture] = useState<{ title: string; points: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [processSimulator] = useState(() => new ProcessSimulator());
  const {
    carPosition,
    rideRunning,
    flashLight,
    sessionId,
    wsConnected,
    plcConnected,
    plcHost,
    plcPort,
    attackActive,
    coilStates,
    speedSetpoint,
    state: plcState,
    runtimeHours,
    maintenanceFlag,
    lastErrorCode,
    trackLength,
    startRide,
    stopRide,
    resetRide,
    connectToPLC,
    setSafetyConditions,
    triggerEmergencyStop,
  } = useWebSocketSimulation();

  const multiPLC = useMultiPLCConnection();
  const alarmSystem = useAlarmSystem();

  const positionTrend = useTrendData(60);
  const speedTrend = useTrendData(60);
  const tempTrend = useTrendData(60);
  const currentTrend = useTrendData(60);

  useEffect(() => {
    const interval = setInterval(() => {
      positionTrend.addDataPoint(carPosition);
      speedTrend.addDataPoint(speedSetpoint);
    }, 1000);
    return () => clearInterval(interval);
  }, [carPosition, speedSetpoint]);

  const processVars = processSimulator.update(rideRunning, speedSetpoint, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      tempTrend.addDataPoint(processVars.bearingTempCelsius);
      currentTrend.addDataPoint(processVars.motorCurrentAmps);
    }, 1000);
    return () => clearInterval(interval);
  }, [processVars.bearingTempCelsius, processVars.motorCurrentAmps]);

  const activeEvents = useMemo(() => {
    const events = new Set<string>();
    if (rideRunning) {
      ALL_EVENTS.filter(event => {
        const [start, end] = event.position;
        return carPosition >= start && carPosition <= end;
      }).forEach(event => {
        events.add(event.id);
      });
    }
    return events;
  }, [carPosition, rideRunning]);

  useAdvancedChallengeDetection({
    sessionId,
    carPosition,
    flashLight,
    rideRunning,
    attackActive,
    coilStates,
    emergencyStop: coilStates[3] || false,      // Coil 3 = emergency_stop_button (QX0.3)
    safetyGateClosed: coilStates[4] || false,   // Coil 4 = safety_gate_closed (QX0.4)
    state: plcState,
    runtimeHours,
    maintenanceFlag,
    speedSetpoint,
    zones: {
      zone1: coilStates[5] || true,   // Coil 5 = zone_1_enable (QX0.5)
      zone2: coilStates[6] || true,   // Coil 6 = zone_2_enable (QX0.6)
      zone3: coilStates[7] || true,   // Coil 7 = zone_3_enable (QX0.7)
    },
    onFlagCapture: (title: string, points: number) => {
      console.log('[App] Flag captured:', title, points);
      setFlagCapture({ title, points });
      // Don't clear immediately - let the notification manager handle it
      setTimeout(() => setFlagCapture(null), 500);
    },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <FlagNotificationManager trigger={flagCapture} />
      <AlarmPanel />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Header
          wsConnected={wsConnected}
          plcConnected={plcConnected}
          plcHost={plcHost}
          plcPort={plcPort}
          sessionId={sessionId}
        />

        <div className="mb-6">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <AttractionVisualizer
              carPosition={carPosition}
              activeEvents={activeEvents}
              rideRunning={rideRunning}
              trackLength={trackLength}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CoilStatus
                flashLight={flashLight}
                coilStates={coilStates}
              />
              <PLCStateMonitor
                state={plcState}
                speedSetpoint={speedSetpoint}
                safetyOk={coilStates[0] && !coilStates[3] && coilStates[4]}
                emergencyStop={coilStates[3] || false}
                safetyGate={coilStates[4] || false}
                masterEnable={coilStates[0] || false}
                motorRunning={coilStates[26] || false}
                brakeEngaged={coilStates[27] || false}
                runtimeHours={runtimeHours}
                cycleCounter={0}
                maintenanceFlag={maintenanceFlag}
                lastErrorCode={lastErrorCode}
                zones={{
                  zone1: coilStates[5] !== false,
                  zone2: coilStates[6] !== false,
                  zone3: coilStates[7] !== false,
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <ControlPanel
              rideRunning={rideRunning}
              wsConnected={wsConnected}
              plcConnected={plcConnected}
              coilStates={coilStates}
              onStart={startRide}
              onStop={stopRide}
              onReset={resetRide}
              onConnectPLC={connectToPLC}
              onEmergencyStop={triggerEmergencyStop}
              onSetSafetyConditions={setSafetyConditions}
            />
            <RideEventsMonitor
              activeEvents={activeEvents}
              allEvents={ALL_EVENTS}
              rideRunning={rideRunning}
            />
          </div>
        </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <MultiPLCStatus
              plcs={multiPLC.plcs}
              onConnect={multiPLC.connectToPLC}
              onDisconnect={multiPLC.disconnectFromPLC}
              onConnectAll={multiPLC.connectToAllPLCs}
              onDisconnectAll={multiPLC.disconnectAllPLCs}
            />
            <SystemHealthDashboard
              processVars={processVars}
              runtimeHours={runtimeHours}
              cycleCount={0}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CoilStatus flashLight={flashLight} coilStates={coilStates} />
              <PLCStateMonitor
                state={plcState}
                speedSetpoint={speedSetpoint}
                safetyOk={coilStates[0] && !coilStates[3] && coilStates[4]}
                emergencyStop={coilStates[3] || false}
                safetyGate={coilStates[4] || false}
                masterEnable={coilStates[0] || false}
                motorRunning={coilStates[26] || false}
                brakeEngaged={coilStates[27] || false}
                runtimeHours={runtimeHours}
                cycleCounter={0}
                maintenanceFlag={maintenanceFlag}
                lastErrorCode={lastErrorCode}
                zones={{
                  zone1: coilStates[5] !== false,
                  zone2: coilStates[6] !== false,
                  zone3: coilStates[7] !== false,
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              title="Vehicle Position"
              data={positionTrend.data}
              unit="pos"
              color="#3b82f6"
              minValue={0}
              maxValue={27}
            />
            <TrendChart
              title="Speed Setpoint"
              data={speedTrend.data}
              unit="%"
              color="#10b981"
              minValue={0}
              maxValue={100}
            />
            <TrendChart
              title="Bearing Temperature"
              data={tempTrend.data}
              unit="°C"
              color="#f59e0b"
              minValue={0}
              maxValue={100}
            />
            <TrendChart
              title="Motor Current"
              data={currentTrend.data}
              unit="A"
              color="#eab308"
              minValue={0}
              maxValue={150}
            />
          </div>
        )}

        {activeTab === 'alarms' && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Active Alarms</h2>
              <AlarmList showHistory={false} />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Alarm History</h2>
              <AlarmList showHistory={true} />
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-[calc(100vh-250px)]">
            <EventLog />
          </div>
        )}

        {activeTab === 'network' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-[calc(100vh-250px)]">
            <NetworkMonitor
              operations={multiPLC.operations}
              onClear={multiPLC.clearOperationLog}
            />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="h-[calc(100vh-250px)]">
            <DocumentationViewer />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
