import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface AdvancedChallengeDetectionProps {
  sessionId: string | null;
  carPosition: number;
  flashLight: boolean;
  rideRunning: boolean;
  attackActive: boolean;
  coilStates: boolean[];
  emergencyStop: boolean;
  safetyGateClosed: boolean;
  state: number;
  runtimeHours: number;
  maintenanceFlag: boolean;
  speedSetpoint: number;
  zones: {
    zone1: boolean;
    zone2: boolean;
    zone3: boolean;
  };
  onFlagCapture?: (title: string, points: number) => void;
}

export function useAdvancedChallengeDetection({
  sessionId,
  carPosition,
  flashLight,
  rideRunning,
  attackActive,
  coilStates,
  emergencyStop,
  safetyGateClosed,
  state,
  runtimeHours,
  maintenanceFlag,
  speedSetpoint,
  zones,
  onFlagCapture,
}: AdvancedChallengeDetectionProps) {
  // Challenge completion flags
  const firstContactCompleted = useRef(false);
  const portalDisruptionCompleted = useRef(false);
  const emergencyOverrideCompleted = useRef(false);
  const zoneLockoutCompleted = useRef(false);
  const launchOverrideCompleted = useRef(false);
  const realityShiftCompleted = useRef(false);
  const sceneBlackoutCompleted = useRef(false);
  const heartbeatHijackCompleted = useRef(false);
  const safetyBypassCompleted = useRef(false);
  const nexusCoreCompleted = useRef(false);
  const plcImpersonationCompleted = useRef(false);
  const ghostRideCompleted = useRef(false);
  const stealthOperatorCompleted = useRef(false);
  const convergenceCompleted = useRef(false);
  const realityJunctionCompleted = useRef(false);

  // State tracking
  const lastPosition = useRef(carPosition);
  const lapCounter = useRef(0);
  const ghostModeLaps = useRef(0);
  const stealthManipulations = useRef(0);
  const flashActivatedThisSession = useRef(false);
  const initialSafetyState = useRef<boolean | null>(null);
  const lastZoneState = useRef({ zone1: true, zone2: true, zone3: true });
  const lastCoilStates = useRef<boolean[]>([]);
  const lastSpeed = useRef(speedSetpoint);
  const consecutiveAnomalyFreeScans = useRef(0);

  // Reset challenge states when session changes
  useEffect(() => {
    if (!sessionId) {
      // Reset all completion flags
      firstContactCompleted.current = false;
      portalDisruptionCompleted.current = false;
      emergencyOverrideCompleted.current = false;
      zoneLockoutCompleted.current = false;
      launchOverrideCompleted.current = false;
      realityShiftCompleted.current = false;
      sceneBlackoutCompleted.current = false;
      heartbeatHijackCompleted.current = false;
      safetyBypassCompleted.current = false;
      nexusCoreCompleted.current = false;
      plcImpersonationCompleted.current = false;
      ghostRideCompleted.current = false;
      stealthOperatorCompleted.current = false;
      convergenceCompleted.current = false;
      realityJunctionCompleted.current = false;

      // Reset state tracking
      lapCounter.current = 0;
      ghostModeLaps.current = 0;
      stealthManipulations.current = 0;
      flashActivatedThisSession.current = false;
      initialSafetyState.current = null;
      lastCoilStates.current = [];
      consecutiveAnomalyFreeScans.current = 0;
    } else if (rideRunning && initialSafetyState.current === null) {
      // Capture initial safety state when ride first starts
      initialSafetyState.current = safetyGateClosed;
      console.log(`[Challenge] Session started with safety gate: ${safetyGateClosed}`);
    }
  }, [sessionId, rideRunning, safetyGateClosed]);

  // Update last states for comparison
  useEffect(() => {
    lastZoneState.current = { ...zones };
    lastCoilStates.current = [...coilStates];
    lastSpeed.current = speedSetpoint;
  }, [zones, coilStates, speedSetpoint]);

  // Lap counter and position tracking
  useEffect(() => {
    if (!sessionId || !rideRunning) return;

    // Detect lap completion (position wraps from 26 -> 0)
    if (carPosition < lastPosition.current && lastPosition.current > 20) {
      lapCounter.current++;
      console.log(`[Challenge] Lap completed: ${lapCounter.current}`);

      // Check if this lap was a ghost mode lap (all events disabled)
      const eventCoils = coilStates.slice(8, 17); // Events 1-9 (coils 8-16)
      const allDisabled = eventCoils.every(enabled => !enabled);
      if (allDisabled) {
        ghostModeLaps.current++;
        console.log(`[Challenge] Ghost mode lap: ${ghostModeLaps.current}/3`);
      } else {
        ghostModeLaps.current = 0; // Reset if events are enabled
      }
    }
    lastPosition.current = carPosition;
  }, [sessionId, carPosition, rideRunning, coilStates]);

  // BEGINNER CHALLENGES

  // 1. First Contact (50pts) - Read data from all 3 PLCs via Modbus
  useEffect(() => {
    if (!sessionId || firstContactCompleted.current) return;

    // Check if user has read from Main (502), Safety (503), and Effects (504) PLCs
    // For now, we only connect to Main PLC, so check for multiple register reads
    supabase
      .from('modbus_events')
      .select('address, event_type')
      .eq('session_id', sessionId)
      .eq('event_type', 'read_registers')
      .then(({ data }) => {
        if (data && data.length >= 5 && !firstContactCompleted.current) {
          // User has performed multiple reads, indicating they're exploring the system
          console.log('[Challenge] First Contact completed! Explored PLC network via Modbus reads');
          completeChallenge('First Contact', 'network_connection');
          firstContactCompleted.current = true;
        }
      });
  }, [sessionId, coilStates]);

  // 2. Portal Disruption (100pts) - Disable event 4 (Photo Flash at position 9) via Modbus
  useEffect(() => {
    if (!sessionId || portalDisruptionCompleted.current || !rideRunning) return;

    const inEvent4Zone = carPosition >= 9 && carPosition <= 11;
    const event4Enabled = coilStates[11] || false; // event_4_enable (coil 11)

    if (inEvent4Zone && !event4Enabled && state === 2) {
      // Verify this was done via Modbus write, not UI
      supabase
        .from('modbus_events')
        .select('source')
        .eq('session_id', sessionId)
        .eq('address', 11) // event_4_enable coil
        .eq('event_type', 'write_coil')
        .neq('source', 'hmi_ui')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !portalDisruptionCompleted.current) {
            console.log('[Challenge] Portal Disruption completed! Photo flash event disabled via Modbus');
            completeChallenge('Portal Disruption', 'event_disable');
            portalDisruptionCompleted.current = true;
          }
        });
    }
  }, [sessionId, carPosition, coilStates, rideRunning, state]);

  // 3. Emergency Override (150pts) - Trigger emergency stop via Modbus (not UI button)
  useEffect(() => {
    if (!sessionId || emergencyOverrideCompleted.current) return;

    if (emergencyStop && rideRunning) {
      // Check if this was triggered by UI button
      supabase
        .from('modbus_events')
        .select('source')
        .eq('session_id', sessionId)
        .eq('address', 3) // Emergency stop is coil 3
        .eq('source', 'hmi_emergency_button')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!data && !emergencyOverrideCompleted.current) {
            console.log('[Challenge] Emergency Override completed! E-stop triggered via Modbus');
            completeChallenge('Emergency Override', 'emergency_trigger');
            emergencyOverrideCompleted.current = true;
          }
        });
    }
  }, [sessionId, emergencyStop, rideRunning]);

  // 4. Zone Lockout (200pts) - Disable Zone 2 while vehicle is in it via Modbus
  useEffect(() => {
    if (!sessionId || zoneLockoutCompleted.current || !rideRunning) return;

    const inZone2 = carPosition >= 9 && carPosition <= 17;
    if (inZone2 && !zones.zone2) {
      // Verify this was done via Modbus write, not UI
      supabase
        .from('modbus_events')
        .select('source')
        .eq('session_id', sessionId)
        .eq('address', 6) // zone_2_enable coil
        .eq('event_type', 'write_coil')
        .eq('value', false)
        .neq('source', 'hmi_ui')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !zoneLockoutCompleted.current) {
            console.log('[Challenge] Zone Lockout completed! Zone 2 disabled via Modbus while vehicle inside');
            completeChallenge('Zone Lockout', 'zone_manipulation');
            zoneLockoutCompleted.current = true;
          }
        });
    }
  }, [sessionId, carPosition, zones, rideRunning]);

  // INTERMEDIATE CHALLENGES

  // 5. Launch Override (250pts) - Set speed to extreme values via Modbus during operation
  useEffect(() => {
    if (!sessionId || launchOverrideCompleted.current || !rideRunning) return;

    if (speedSetpoint > 80 || speedSetpoint < 10) {
      // Verify this was done via Modbus write, not UI
      supabase
        .from('modbus_events')
        .select('source, value')
        .eq('session_id', sessionId)
        .eq('address', 0) // speed_setpoint register
        .eq('event_type', 'write_register')
        .neq('source', 'hmi_ui')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && (data.value > 80 || data.value < 10) && !launchOverrideCompleted.current) {
            console.log(`[Challenge] Launch Override completed! Speed set to ${data.value}% via Modbus`);
            completeChallenge('Launch Override', 'speed_manipulation');
            launchOverrideCompleted.current = true;
          }
        });
    }
  }, [sessionId, speedSetpoint, rideRunning]);

  // 6. Reality Shift (250pts) - Teleport across zones via direct position write
  useEffect(() => {
    if (!sessionId || realityShiftCompleted.current || !rideRunning) return;

    const posDiff = Math.abs(carPosition - lastPosition.current);

    // Detect teleport: jump > 5 positions (not wrap-around)
    if (posDiff > 5 && posDiff < 20 && lastPosition.current > 0) {
      // Verify this was done via Modbus write to position register
      supabase
        .from('modbus_events')
        .select('value')
        .eq('session_id', sessionId)
        .eq('address', 1) // current_position register
        .eq('event_type', 'write_register')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !realityShiftCompleted.current) {
            console.log(`[Challenge] Reality Shift completed! Position manually set to ${data.value} via Modbus`);
            completeChallenge('Reality Shift', 'position_manipulation');
            realityShiftCompleted.current = true;
          }
        });
    }
  }, [sessionId, carPosition, rideRunning]);

  // 7. Scene Blackout (300pts) - Disable 3+ events simultaneously via Modbus
  useEffect(() => {
    if (!sessionId || sceneBlackoutCompleted.current || !rideRunning) return;

    const eventCoils = coilStates.slice(8, 17); // Events 1-9
    const disabledCount = eventCoils.filter(enabled => !enabled).length;

    if (disabledCount >= 3) {
      // Verify at least 3 events were disabled via Modbus (not UI)
      supabase
        .from('modbus_events')
        .select('address')
        .eq('session_id', sessionId)
        .in('address', [8, 9, 10, 11, 12, 13, 14, 15, 16]) // event enable coils
        .eq('event_type', 'write_coil')
        .eq('value', false)
        .neq('source', 'hmi_ui')
        .then(({ data }) => {
          if (data && data.length >= 3 && !sceneBlackoutCompleted.current) {
            console.log(`[Challenge] Scene Blackout completed! ${disabledCount} events disabled via Modbus`);
            completeChallenge('Scene Blackout', 'multi_event_disable');
            sceneBlackoutCompleted.current = true;
          }
        });
    }
  }, [sessionId, coilStates, rideRunning]);

  // 8. Heartbeat Hijack (350pts) - Fake Safety PLC Ready signal (coil 31)
  useEffect(() => {
    if (!sessionId || heartbeatHijackCompleted.current) return;

    // Coil 31 is safety_plc_ready
    // If it's FALSE when the ride is trying to start or running, and then gets set TRUE via Modbus write...
    // We need to check modbus_events for a write to coil 31
    if (coilStates[31]) {
      supabase
        .from('modbus_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('address', 31)
        .eq('event_type', 'write_coil')
        .eq('value', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !heartbeatHijackCompleted.current) {
            console.log('[Challenge] Heartbeat Hijack completed! Spoofed Safety PLC Ready signal');
            completeChallenge('Heartbeat Hijack', 'heartbeat_spoof');
            heartbeatHijackCompleted.current = true;
          }
        });
    }
  }, [sessionId, coilStates]);

  // ADVANCED CHALLENGES

  // 9. Safety Bypass (400pts) - Start ride with safety gate open
  useEffect(() => {
    if (!sessionId || safetyBypassCompleted.current) return;

    if (rideRunning && !safetyGateClosed && initialSafetyState.current === false) {
      console.log('[Challenge] Safety Bypass completed! Ride started with safety gate open');
      completeChallenge('Safety Bypass', 'safety_override');
      safetyBypassCompleted.current = true;
    }
  }, [sessionId, rideRunning, safetyGateClosed]);

  // 10. The Nexus Core (450pts) - Force state machine to state 5 (MAINTENANCE)
  useEffect(() => {
    if (!sessionId || nexusCoreCompleted.current) return;

    if (state === 5) {
      console.log('[Challenge] The Nexus Core completed! Forced into MAINTENANCE mode (state 5)');
      completeChallenge('The Nexus Core', 'state_manipulation');
      nexusCoreCompleted.current = true;
    }
  }, [sessionId, state]);

  // 11. PLC Impersonation (450pts) - Manipulate event_active coils (17-25)
  useEffect(() => {
    if (!sessionId || plcImpersonationCompleted.current || !rideRunning) return;

    // Check if any event_active coils (17-25) are TRUE without corresponding event_enable
    // Event active coils should only be TRUE when Safety PLC validates them
    for (let i = 17; i <= 25; i++) {
      const eventActive = coilStates[i];
      const eventEnable = coilStates[i - 9]; // event_1_enable is coil 8, event_1_active is coil 17

      // If event is active but NOT enabled, or vehicle not at right position, this is impersonation
      if (eventActive && !eventEnable) {
        console.log(`[Challenge] PLC Impersonation completed! Event ${i - 16} active without being enabled`);
        completeChallenge('PLC Impersonation', 'coil_spoofing');
        plcImpersonationCompleted.current = true;
        break;
      }
    }
  }, [sessionId, coilStates, rideRunning]);

  // 12. Ghost Ride (500pts) - 3 complete cycles with ALL events disabled
  useEffect(() => {
    if (!sessionId || ghostRideCompleted.current || !rideRunning) return;

    if (ghostModeLaps.current >= 3) {
      console.log('[Challenge] Ghost Ride completed! 3 cycles with all 9 events disabled');
      completeChallenge('Ghost Ride', 'stealth_operation');
      ghostRideCompleted.current = true;
    }
  }, [sessionId, ghostModeLaps, rideRunning]);

  // EXPERT CHALLENGES

  // 13. Stealth Operator (550pts) - 5 cycles with continuous manipulation without detection
  useEffect(() => {
    if (!sessionId || stealthOperatorCompleted.current || !rideRunning) return;

    // Track if user is making changes without triggering obvious anomalies
    // Count subtle manipulations (small speed changes, single event disables)
    const speedChanged = Math.abs(speedSetpoint - lastSpeed.current) > 0 && Math.abs(speedSetpoint - lastSpeed.current) < 20;
    const singleEventChanged = coilStates.some((state, idx) => {
      return idx >= 8 && idx <= 16 && state !== (lastCoilStates.current[idx] || true);
    });

    if (speedChanged || singleEventChanged) {
      stealthManipulations.current++;
      consecutiveAnomalyFreeScans.current = 0; // Reset counter if manipulation detected
    } else if (stealthManipulations.current > 0) {
      consecutiveAnomalyFreeScans.current++;
    }

    // Award if 5+ laps with subtle manipulations and no major alerts
    if (lapCounter.current >= 5 && stealthManipulations.current >= 10) {
      console.log('[Challenge] Stealth Operator completed! 5 cycles with subtle manipulations');
      completeChallenge('Stealth Operator', 'advanced_stealth');
      stealthOperatorCompleted.current = true;
    }
  }, [sessionId, speedSetpoint, coilStates, lapCounter, rideRunning]);

  // 14. The Convergence (650pts) - Multi-PLC coordinated attack
  useEffect(() => {
    if (!sessionId || convergenceCompleted.current) return;

    // Simultaneous attack on all three PLCs:
    // 1. Disable Safety heartbeat (coil 31 = FALSE)
    // 2. Force Main to maintenance (state 5)
    // 3. Disable Effects heartbeat (coil 32 = FALSE)
    const safetyDisabled = !coilStates[31]; // safety_plc_ready
    const effectsDisabled = !coilStates[32]; // effects_plc_ready
    const maintenanceMode = state === 5;

    if (safetyDisabled && effectsDisabled && maintenanceMode) {
      console.log('[Challenge] The Convergence completed! Coordinated attack on all three PLCs');
      completeChallenge('The Convergence', 'multi_plc_attack');
      convergenceCompleted.current = true;
    }
  }, [sessionId, coilStates, state]);

  // 15. Reality Junction (750pts) - Create position desynchronization
  useEffect(() => {
    if (!sessionId || realityJunctionCompleted.current) return;

    // This is the ultimate challenge - create a state where systems disagree
    // We can detect if position was manually set to 15 while Safety thinks it's at 0
    // This would require checking modbus_events for direct position writes

    if (carPosition === 15 && rideRunning) {
      supabase
        .from('modbus_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('address', 1) // current_position register
        .eq('event_type', 'write_register')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !realityJunctionCompleted.current) {
            console.log('[Challenge] Reality Junction completed! Created PLC position desynchronization');
            completeChallenge('Reality Junction', 'reality_manipulation');
            realityJunctionCompleted.current = true;
          }
        });
    }
  }, [sessionId, carPosition, rideRunning]);

  const completeChallenge = async (title: string, method: string) => {
    if (!sessionId) {
      console.error('[Challenge] No sessionId, cannot complete challenge');
      return;
    }

    console.log(`[Challenge] Attempting to complete "${title}"...`);

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, points')
      .eq('title', title)
      .maybeSingle();

    if (challengeError || !challenge) {
      console.error(`[Challenge] Error finding challenge "${title}":`, challengeError);
      return;
    }

    const { error } = await supabase
      .from('challenge_completions')
      .insert({
        challenge_id: challenge.id,
        session_id: sessionId,
        method_used: method,
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`[Challenge] Challenge "${title}" was already completed in this session`);
      } else {
        console.error('[Challenge] Error inserting completion:', error);
      }
    } else {
      console.log(`[Challenge] ✓ "${title}" completed successfully! (+${challenge.points} points)`);

      if (onFlagCapture) {
        onFlagCapture(title, challenge.points);
      }
    }
  };
}
