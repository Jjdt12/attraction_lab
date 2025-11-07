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
  const lightsOutCompleted = useRef(false);
  const zoneManipulationCompleted = useRef(false);
  const emergencyOverrideCompleted = useRef(false);
  const speedControlCompleted = useRef(false);
  const safetyBypassCompleted = useRef(false);
  const stateMachineCompleted = useRef(false);
  const eventDisableCompleted = useRef(false);
  const stealthModeCompleted = useRef(false);
  const positionTeleportCompleted = useRef(false);
  const ghostModeCompleted = useRef(false);

  const lastPosition = useRef(carPosition);
  const lapCounter = useRef(0);
  const flashActivatedThisSession = useRef(false);
  const initialSafetyState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) {
      lightsOutCompleted.current = false;
      zoneManipulationCompleted.current = false;
      emergencyOverrideCompleted.current = false;
      speedControlCompleted.current = false;
      safetyBypassCompleted.current = false;
      stateMachineCompleted.current = false;
      eventDisableCompleted.current = false;
      stealthModeCompleted.current = false;
      positionTeleportCompleted.current = false;
      ghostModeCompleted.current = false;
      lapCounter.current = 0;
      flashActivatedThisSession.current = false;
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

      if (lapCounter.current >= 3 && !flashActivatedThisSession.current && !stealthModeCompleted.current) {
        console.log('[Challenge] Stealth Mode completed! 3 laps without flash');
        completeChallenge('Stealth Mode', 'silent_operation');
        stealthModeCompleted.current = true;
      }
    }
    lastPosition.current = carPosition;

    // Lights Out: Detect when vehicle is in Event 4 zone (positions 9-11) but flash is disabled
    // Normal operation: flash_light turns ON when vehicle is at positions 9-11 and event_4_enable is TRUE
    // Attack: event_4_enable is FALSE, so flash_light stays OFF when vehicle passes through
    const inEvent4Zone = carPosition >= 9 && carPosition <= 11;
    const event4Enabled = coilStates[11] || false; // event_4_enable

    if (inEvent4Zone && rideRunning && state === 2 && !lightsOutCompleted.current) {
      if (!event4Enabled && !flashLight) {
        // Event 4 is disabled and flash is off - this is the attack!
        console.log('[Challenge] Vehicle at Event 4 zone but event disabled and flash off');
        completeChallenge('Lights Out', 'signal_suppression');
        lightsOutCompleted.current = true;
      } else if (event4Enabled && flashLight) {
        // Normal operation - event enabled and flash working
        console.log('[Challenge Debug] Event 4 zone: Normal operation (enabled + flash on)');
      } else if (!event4Enabled) {
        // Event disabled but we're in the zone - log for debugging
        console.log(`[Challenge Debug] Event 4 disabled in zone, flashLight=${flashLight}`);
      }
    }
  }, [sessionId, carPosition, flashLight, rideRunning, state, coilStates]);

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

  // Event Disable: Detect when any event is disabled while ride is running
  useEffect(() => {
    if (!sessionId || eventDisableCompleted.current || !rideRunning) return;

    // Check if any events (coils 8-16) are disabled
    const eventCoils = coilStates.slice(8, 17); // Events 1-9
    const disabledCount = eventCoils.filter(enabled => !enabled).length;

    if (disabledCount > 0) {
      console.log(`[Challenge] Event Disable completed! ${disabledCount} event(s) disabled during operation`);
      completeChallenge('Event Disable', 'event_manipulation');
      eventDisableCompleted.current = true;
    }
  }, [sessionId, coilStates, rideRunning]);

  // Position Teleport: Detect large position jumps
  useEffect(() => {
    if (!sessionId || positionTeleportCompleted.current || !rideRunning) return;

    const posDiff = Math.abs(carPosition - lastPosition.current);

    // Detect teleport (position jump > 5 units without wrapping)
    if (posDiff > 5 && posDiff < 20 && lastPosition.current > 0) {
      console.log(`[Challenge] Position Teleport completed! Position jumped ${posDiff} units`);
      completeChallenge('Position Teleport', 'position_manipulation');
      positionTeleportCompleted.current = true;
    }
  }, [sessionId, carPosition, rideRunning]);

  // Ghost Mode: Detect all 9 events disabled for multiple cycles
  useEffect(() => {
    if (!sessionId || ghostModeCompleted.current || !rideRunning) return;

    // Check if ALL 9 events are disabled
    const eventCoils = coilStates.slice(8, 17); // Events 1-9
    const allDisabled = eventCoils.every(enabled => !enabled);

    if (allDisabled && lapCounter.current >= 3) {
      console.log('[Challenge] Ghost Mode completed! All 9 events disabled for 3+ cycles');
      completeChallenge('Ghost Mode', 'stealth_mastery');
      ghostModeCompleted.current = true;
    }
  }, [sessionId, coilStates, lapCounter, rideRunning]);

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
      // Check if it's a duplicate (already completed)
      if (error.code === '23505') {
        console.log(`[Challenge] Challenge "${title}" was already completed in this session`);
      } else {
        console.error('[Challenge] Error inserting completion:', error);
      }
    } else {
      console.log(`[Challenge] ✓ "${title}" completed successfully!`);
      console.log(`[Challenge] Triggering flag capture notification for ${challenge.points} points`);

      if (onFlagCapture) {
        onFlagCapture(title, challenge.points);
      } else {
        console.warn('[Challenge] onFlagCapture callback is not defined!');
      }
    }
  };
}
