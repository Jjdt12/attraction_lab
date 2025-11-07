import { useState, useMemo } from 'react';
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

function App() {
  const [flagCapture, setFlagCapture] = useState<{ title: string; points: number } | null>(null);
  const {
    carPosition,
    rideRunning,
    flashLight,
    proxiSensor,
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
    proxiSensor,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <FlagNotificationManager trigger={flagCapture} />
      <div className="container mx-auto px-4 py-8">
        <Header
          wsConnected={wsConnected}
          plcConnected={plcConnected}
          plcHost={plcHost}
          plcPort={plcPort}
          sessionId={sessionId}
        />

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
                proxiSensor={proxiSensor}
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
      </div>
    </div>
  );
}

export default App;
