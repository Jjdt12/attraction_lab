import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import AttractionVisualizer from './components/AttractionVisualizer';
import ControlPanel from './components/ControlPanel';
import CoilStatus from './components/CoilStatus';
import PLCStateMonitor from './components/PLCStateMonitor';
import RideEventsMonitor from './components/RideEventsMonitor';
import SecurityArchitecture from './components/SecurityArchitecture';
import { useWebSocketSimulation } from './hooks/useWebSocketSimulation';
import { ALL_EVENTS } from './types/rideEvents';
import { TabNavigation, TabType } from './components/TabNavigation';
import { AlarmPanel, AlarmList } from './components/AlarmPanel';
import { EventLog } from './components/EventLog';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { NetworkMonitor } from './components/NetworkMonitor';
import { TrendChart, useTrendData } from './components/TrendChart';
import { DocumentationViewer } from './components/DocumentationViewer';
import { MultiPLCStatus } from './components/MultiPLCStatus';
import { useAlarmSystem } from './hooks/useAlarmSystem';
import { ProcessSimulator } from './utils/processSimulation';
import type { PLCConnection } from './hooks/useMultiPLCConnection';

function App() {
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
    coilStates,
    speedSetpoint,
    state: plcState,
    runtimeHours,
    cycleCounter,
    maintenanceFlag,
    lastErrorCode,
    trackLength,
    activeEvents: plcActiveEvents,
    multiPLCStatus,
    modbusOperations,
    startRide,
    stopRide,
    resetRide,
    connectToPLC,
    setSafetyConditions,
    triggerEmergencyStop,
    clearModbusOperations,
  } = useWebSocketSimulation();

  useAlarmSystem();

  const plcsForDisplay: PLCConnection[] = [
    { name: 'MAIN', host: multiPLCStatus.MAIN.host, port: multiPLCStatus.MAIN.port, connected: multiPLCStatus.MAIN.connected, error: null, lastHeartbeat: Date.now() },
    { name: 'SAFETY', host: multiPLCStatus.SAFETY.host, port: multiPLCStatus.SAFETY.port, connected: multiPLCStatus.SAFETY.connected, error: null, lastHeartbeat: Date.now() },
    { name: 'EFFECTS', host: multiPLCStatus.EFFECTS.host, port: multiPLCStatus.EFFECTS.port, connected: multiPLCStatus.EFFECTS.connected, error: null, lastHeartbeat: Date.now() },
  ];

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

  const processVars = processSimulator.update(
    rideRunning,
    speedSetpoint,
    cycleCounter,
    carPosition,
    coilStates[27] || false,
    runtimeHours
  );

  useEffect(() => {
    const interval = setInterval(() => {
      tempTrend.addDataPoint(processVars.bearingTempCelsius);
      currentTrend.addDataPoint(processVars.motorCurrentAmps);
    }, 1000);
    return () => clearInterval(interval);
  }, [processVars.bearingTempCelsius, processVars.motorCurrentAmps]);

  const activeEvents = useMemo(() => {
    const events = new Set<string>();
    plcActiveEvents.forEach(eventNum => {
      const event = ALL_EVENTS.find(e => e.eventNumber === eventNum);
      if (event) {
        events.add(event.id);
      }
    });
    return events;
  }, [plcActiveEvents]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AlarmPanel />
      <div className="container mx-auto px-4 py-6 pt-20">
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
                coilStates={coilStates}
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
                  cycleCounter={cycleCounter}
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
              plcs={plcsForDisplay}
              onConnect={() => {}}
              onDisconnect={() => {}}
              onConnectAll={() => {}}
              onDisconnectAll={() => {}}
            />
            <SystemHealthDashboard
              processVars={processVars}
              runtimeHours={runtimeHours}
              cycleCount={cycleCounter}
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
                cycleCounter={cycleCounter}
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
              color="#06b6d4"
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
              unit="deg C"
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
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Active Alarms</h2>
              <AlarmList showHistory={false} />
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Alarm History</h2>
              <AlarmList showHistory={true} />
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 h-[calc(100vh-250px)]">
            <EventLog />
          </div>
        )}

        {activeTab === 'network' && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 h-[calc(100vh-250px)]">
            <NetworkMonitor
              operations={modbusOperations}
              onClear={clearModbusOperations}
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Security Overview</h2>
                <p className="text-sm text-slate-400 mb-6">
                  This lab environment demonstrates industrial control system security architecture.
                  The attraction simulation uses real Modbus TCP/IP communication with PLCs,
                  providing hands-on experience with ICS protocols and security considerations.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Protocol Analysis</h3>
                    <p className="text-xs text-slate-500">
                      Monitor Modbus TCP traffic in the Network tab to understand register/coil operations
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Safety Systems</h3>
                    <p className="text-xs text-slate-500">
                      Observe interlock behavior and safety PLC redundancy in the Diagnostics tab
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">State Monitoring</h3>
                    <p className="text-xs text-slate-500">
                      Track PLC state machine transitions and zone control logic in real-time
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Event Correlation</h3>
                    <p className="text-xs text-slate-500">
                      Analyze system events and alarms to understand operational patterns
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <SecurityArchitecture
                wsConnected={wsConnected}
                plcConnected={plcConnected}
                coilStates={coilStates}
              />
            </div>
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
