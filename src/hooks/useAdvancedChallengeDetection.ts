import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface AdvancedChallengeDetectionProps {
  sessionId: string | null;
  carPosition: number;
  proxiSensor: boolean;
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
  proxiSensor,
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
  const lightsOutCompleted = useRef(false);
  const zoneManipulationCompleted = useRef(false);
  const emergencyOverrideCompleted = useRef(false);
  const speedControlCompleted = useRef(false);
  const safetyBypassCompleted = useRef(false);
  const stateMachineCompleted = useRef(false);
  const runtimeManipulationCompleted = useRef(false);
  const fullLapsSilentCompleted = useRef(false);

  const lastPosition = useRef(carPosition);
  const lapCounter = useRef(0);
  const flashActivatedThisSession = useRef(false);
  const proxiTriggersSeen = useRef(0);
  const proxiWithoutFlash = useRef(0);
  const initialSafetyState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) {
      lightsOutCompleted.current = false;
      zoneManipulationCompleted.current = false;
      emergencyOverrideCompleted.current = false;
      speedControlCompleted.current = false;
      safetyBypassCompleted.current = false;
      stateMachineCompleted.current = false;
      runtimeManipulationCompleted.current = false;
      fullLapsSilentCompleted.current = false;
      lapCounter.current = 0;
      flashActivatedThisSession.current = false;
      proxiTriggersSeen.current = 0;
      proxiWithoutFlash.current = 0;
      initialSafetyState.current = null;
    } else if (rideRunning && initialSafetyState.current === null) {
      // Capture initial safety state when ride first starts
      initialSafetyState.current = safetyGateClosed;
      console.log(`[Challenge] Session started with safety gate: ${safetyGateClosed}`);
    }
  }, [sessionId, rideRunning, safetyGateClosed]);

  useEffect(() => {
    if (!sessionId || !rideRunning) return;

    if (flashLight) {
      flashActivatedThisSession.current = true;
    }

    if (carPosition < lastPosition.current) {
      lapCounter.current++;
      console.log(`[Challenge] Lap completed: ${lapCounter.current}`);

      if (lapCounter.current >= 3 && !flashActivatedThisSession.current && !fullLapsSilentCompleted.current) {
        console.log('[Challenge] Full Laps Silent completed! 3 laps without flash');
        completeChallenge('Full Laps Silent', 'silent_operation');
        fullLapsSilentCompleted.current = true;
      }
    }
    lastPosition.current = carPosition;

    // Lights Out: Detect when proximity sensor is TRUE but flash light is FALSE
    // In normal operation, the flash light ALWAYS turns on when proximity sensor is TRUE
    // If the light stays off while the sensor is on, it's being blocked by an attack
    if (proxiSensor && !flashLight && rideRunning && state === 2 && !lightsOutCompleted.current) {
      proxiWithoutFlash.current++;
      console.log(`[Challenge] Proximity sensor TRUE but flash light FALSE: ${proxiWithoutFlash.current} times`);

      // If we've seen this condition persist, it's an attack
      if (proxiWithoutFlash.current >= 2) {
        console.log('[Challenge] Lights Out completed! Flash light blocked while proximity sensor active');
        completeChallenge('Lights Out', 'signal_suppression');
        lightsOutCompleted.current = true;
      }
    } else if (proxiSensor && flashLight) {
      // Reset counter when light is working normally
      proxiWithoutFlash.current = 0;
    }
  }, [sessionId, carPosition, proxiSensor, flashLight, rideRunning]);

  useEffect(() => {
    if (!sessionId || zoneManipulationCompleted.current) return;

    const zoneArray = [zones.zone1, zones.zone2, zones.zone3];
    const disabledCount = zoneArray.filter(z => !z).length;

    if (disabledCount > 0 && rideRunning) {
      console.log('[Challenge] Zone Manipulation completed! Modified zone states during operation');
      completeChallenge('Zone Manipulation', 'zone_control');
      zoneManipulationCompleted.current = true;
    }
  }, [sessionId, zones, rideRunning]);

  useEffect(() => {
    if (!sessionId || emergencyOverrideCompleted.current) return;

    // Only award if emergency stop triggered while ride running
    // Challenge detection will need to verify this wasn't from UI button
    if (emergencyStop && rideRunning) {
      // Check if this was triggered by UI button
      supabase
        .from('modbus_events')
        .select('source')
        .eq('session_id', sessionId)
        .eq('address', 2)
        .eq('source', 'hmi_emergency_button')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          // Only award challenge if NOT from UI button
          if (!data && !emergencyOverrideCompleted.current) {
            console.log('[Challenge] Emergency Override completed! Triggered emergency stop via Modbus');
            completeChallenge('Emergency Override', 'emergency_trigger');
            emergencyOverrideCompleted.current = true;
          } else if (data) {
            console.log('[Challenge] Emergency stop from UI button - challenge not awarded');
          }
        });
    }
  }, [sessionId, emergencyStop, rideRunning]);

  useEffect(() => {
    if (!sessionId || safetyBypassCompleted.current) return;

    // Only award challenge if ride started with safety gate closed=false (initial state)
    // This prevents awarding the challenge just for normal operation
    if (rideRunning && initialSafetyState.current === false && !safetyGateClosed) {
      console.log('[Challenge] Safety Bypass completed! Ride started with safety gate bypassed');
      completeChallenge('Safety Bypass', 'safety_override');
      safetyBypassCompleted.current = true;
    }
  }, [sessionId, rideRunning, safetyGateClosed]);

  useEffect(() => {
    if (!sessionId || stateMachineCompleted.current) return;

    if (state === 5) {
      console.log('[Challenge] State Machine Attack completed! Forced into maintenance mode');
      completeChallenge('State Machine Attack', 'state_manipulation');
      stateMachineCompleted.current = true;
    }
  }, [sessionId, state]);

  useEffect(() => {
    if (!sessionId || runtimeManipulationCompleted.current) return;

    if (maintenanceFlag && runtimeHours < 10) {
      console.log('[Challenge] Runtime Manipulation completed! Triggered maintenance flag');
      completeChallenge('Runtime Manipulation', 'counter_manipulation');
      runtimeManipulationCompleted.current = true;
    }
  }, [sessionId, maintenanceFlag, runtimeHours]);

  useEffect(() => {
    if (!sessionId || speedControlCompleted.current) return;

    if (speedSetpoint === 100 && rideRunning) {
      console.log('[Challenge] Speed Control completed! Speed setpoint set to 100%');
      completeChallenge('Speed Control', 'register_manipulation');
      speedControlCompleted.current = true;
    }
  }, [sessionId, speedSetpoint, rideRunning]);

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
      console.error('[Challenge] Error inserting completion:', error);
    } else {
      console.log(`[Challenge] ✓ "${title}" completed successfully!`);

      if (onFlagCapture) {
        onFlagCapture(title, challenge.points);
      }
    }
  };
}
