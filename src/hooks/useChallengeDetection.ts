import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ChallengeDetectionProps {
  sessionId: string | null;
  carPosition: number;
  proxiSensor: boolean;
  flashLight: boolean;
  rideRunning: boolean;
  attackActive: boolean;
  coil3Written: boolean;
}

export function useChallengeDetection({
  sessionId,
  carPosition,
  proxiSensor,
  flashLight,
  rideRunning,
  attackActive,
  coil3Written,
}: ChallengeDetectionProps) {
  const lightsOutCompleted = useRef(false);
  const coilOverrideCompleted = useRef(false);
  const lastPosition = useRef(carPosition);
  const lightsOutTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log(`[Challenge Hook] SessionId changed: ${sessionId}`);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !coil3Written || coilOverrideCompleted.current) return;

    console.log('[Challenge] Coil 3 written! Completing Coil Override challenge...');
    completeChallenge('Coil Override', 'write_coil_3');
    coilOverrideCompleted.current = true;
  }, [sessionId, coil3Written]);

  useEffect(() => {
    if (!sessionId || !rideRunning || lightsOutCompleted.current) {
      // Clear timer if ride stops
      if (lightsOutTimer.current) {
        clearTimeout(lightsOutTimer.current);
        lightsOutTimer.current = null;
      }
      return;
    }

    // Challenge: Detect when proximity sensor is TRUE but flash light is FALSE
    // In normal operation, flash light SHOULD turn on when proximity sensor is TRUE
    // If the light stays off while sensor is on, it's likely being blocked by an attack
    if (proxiSensor && !flashLight) {
      if (!lightsOutTimer.current) {
        console.log(`[Challenge Debug] Proximity sensor TRUE, flash light FALSE - starting 1000ms timer`);
        // Start timer to check if this persists
        lightsOutTimer.current = setTimeout(() => {
          console.log(`[Challenge] Lights Out completed! Flash light blocked while proximity sensor active`);
          completeChallenge('Lights Out', 'mitm_attack');
          lightsOutCompleted.current = true;
          lightsOutTimer.current = null;
        }, 1000);
      }
    } else {
      // If light turns on or sensor turns off, clear the timer
      if (lightsOutTimer.current) {
        console.log(`[Challenge Debug] Clearing timer - sensor: ${proxiSensor}, light: ${flashLight}`);
        clearTimeout(lightsOutTimer.current);
        lightsOutTimer.current = null;
      }
    }
  }, [sessionId, proxiSensor, flashLight, rideRunning]);

  const completeChallenge = async (title: string, method: string) => {
    if (!sessionId) {
      console.error('[Challenge] No sessionId, cannot complete challenge');
      return;
    }

    console.log(`[Challenge] Attempting to complete "${title}"...`);

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id')
      .eq('title', title)
      .maybeSingle();

    if (challengeError) {
      console.error('[Challenge] Error fetching challenge:', challengeError);
      return;
    }

    if (!challenge) {
      console.error(`[Challenge] Challenge "${title}" not found in database`);
      return;
    }

    console.log(`[Challenge] Found challenge ID: ${challenge.id}, inserting completion...`);

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
    }
  };

  useEffect(() => {
    if (!sessionId) {
      lightsOutCompleted.current = false;
      coilOverrideCompleted.current = false;
      if (lightsOutTimer.current) {
        clearTimeout(lightsOutTimer.current);
        lightsOutTimer.current = null;
      }
    }
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lightsOutTimer.current) {
        clearTimeout(lightsOutTimer.current);
      }
    };
  }, []);
}
