import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const TRACK_LENGTH = 27;
const TICK_INTERVAL = 33;
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765';

interface SimulationState {
  carPosition: number;
  rideRunning: boolean;
  flashLight: boolean;
  sessionId: string | null;
  wsConnected: boolean;
  plcConnected: boolean;
  plcHost: string | null;
  plcPort: number | null;
  attackActive: boolean;
  coilStates: boolean[];
  registerStates: number[];
  speedSetpoint: number;
  state: number;
  runtimeHours: number;
  maintenanceFlag: boolean;
  lastErrorCode: number;
}

export function useWebSocketSimulation() {
  const [state, setState] = useState<SimulationState>({
    carPosition: 0,
    rideRunning: false,
    flashLight: false,
    sessionId: null,
    wsConnected: false,
    plcConnected: false,
    plcHost: null,
    plcPort: null,
    attackActive: false,
    coilStates: Array(31).fill(false),
    registerStates: Array(100).fill(0),
    speedSetpoint: 50,
    state: 0,
    runtimeHours: 0,
    maintenanceFlag: false,
    lastErrorCode: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoConnectAttemptedRef = useRef(false);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, wsConnected: true }));

        // Auto-connect to PLC on WebSocket connection (only once)
        if (!autoConnectAttemptedRef.current) {
          autoConnectAttemptedRef.current = true;
          console.log('[Auto-Connect] Attempting to connect to PLC at localhost:502');
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                action: 'connect_plc',
                host: 'localhost',
                port: 502,
              }));
            }
          }, 500);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only log important messages, not every register change
          if (data.type !== 'register_change' && data.type !== 'coil_change' && data.type !== 'dint_change') {
            console.log('[WebSocket Message]', data);
          }

          if (data.type === 'connection_status' || data.type === 'connect_result') {
            setState(prev => ({
              ...prev,
              plcConnected: data.connected,
              plcHost: data.plc_host,
              plcPort: data.plc_port,
            }));

            // If this is an auto-connect success, trigger auto-reset
            if (data.connected && data.plc_host === 'localhost' && data.plc_port === 502) {
              console.log('[Auto-Connect] PLC connected successfully, performing auto-reset...');
              setTimeout(() => {
                // Trigger reset by sending reset commands
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  // Emergency stop first
                  wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 3, value: true }));
                  setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      // Release emergency stop
                      wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 3, value: false }));
                      setTimeout(() => {
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                          // Set baseline conditions
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 0, value: true }));   // master_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 1, value: false }));  // start_command
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 4, value: true }));   // safety_gate_closed
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 5, value: true }));   // zone_1_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 6, value: true }));   // zone_2_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 7, value: true }));   // zone_3_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 8, value: true }));   // event_1_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 9, value: true }));   // event_2_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 10, value: true }));  // event_3_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 11, value: true }));  // event_4_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 12, value: true }));  // event_5_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 13, value: true }));  // event_6_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 14, value: true }));  // event_7_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 15, value: true }));  // event_8_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_coil', address: 16, value: true }));  // event_9_enable
                          wsRef.current.send(JSON.stringify({ action: 'write_register', address: 1, value: 0 }));  // current_position = 0
                          console.log('[Auto-Connect] ✓ Auto-reset complete - lab ready to use!');
                        }
                      }, 300);
                    }
                  }, 300);
                }
              }, 500);
            }
          } else if (data.type === 'status') {
            setState(prev => ({
              ...prev,
              plcConnected: data.connected,
              plcHost: data.plc_host,
              plcPort: data.plc_port,
            }));
          } else if (data.type === 'coil_change') {
            const { address, name, value } = data;
            // Only log important coil changes
            if (name === 'motor_running' || name === 'emergency_stop_button' || name === 'master_enable') {
              console.log(`[PLC] ${name} = ${value}`);
            }

            setState(prev => {
              const newCoilStates = [...prev.coilStates];
              newCoilStates[address] = value;

              const updates: Partial<SimulationState> = {
                coilStates: newCoilStates,
              };

              if (name === 'master_enable' && value === true) {
                console.log('🎯 [CTF FLAG] master_enable detected as TRUE from external write!');
              }

              // Sync rideRunning with motor_running coil (coil 26)
              if (name === 'motor_running') {
                updates.rideRunning = value;
              }

              // Sync flashLight with flash_light coil (coil 28)
              if (name === 'flash_light') {
                updates.flashLight = value;
                if (value) {
                  console.log('[Challenge Debug] Flash light activated!');
                }
              }

              return { ...prev, ...updates };
            });
          } else if (data.type === 'register_change') {
            const { address, name, value } = data;
            // Only log position and state changes
            if (name === 'current_position' || name === 'state') {
              console.log(`[PLC] ${name} = ${value}`);
            }

            setState(prev => {
              const updates: Partial<SimulationState> = {};

              switch (name) {
                case 'current_position':
                  updates.carPosition = value;
                  break;
                case 'speed_setpoint':
                  updates.speedSetpoint = value;
                  break;
                case 'state':
                  updates.state = value;
                  break;
                case 'last_error_code':
                  updates.lastErrorCode = value;
                  break;
                case 'maintenance_flag':
                  updates.maintenanceFlag = value === 1;
                  break;
              }

              return { ...prev, ...updates };
            });
          } else if (data.type === 'dint_change') {
            const { address, name, value } = data;

            setState(prev => {
              const updates: Partial<SimulationState> = {};

              if (name === 'runtime_hours') {
                updates.runtimeHours = value;
              } else if (name === 'cycle_counter') {
                console.log(`[Cycle Counter] Cycle counter changed to ${value}`);
              }

              return { ...prev, ...updates };
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, wsConnected: false, plcConnected: false }));
        wsRef.current = null;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        wsRef.current?.removeEventListener('message', messageHandler);
        reject(new Error('Request timeout'));
      }, 5000);

      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'write_result' || data.type === 'read_result') {
            clearTimeout(timeout);
            wsRef.current?.removeEventListener('message', messageHandler);
            resolve(data.result);
          } else if (data.type === 'connect_result') {
            clearTimeout(timeout);
            wsRef.current?.removeEventListener('message', messageHandler);
            resolve(data);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      wsRef.current.addEventListener('message', messageHandler);
      wsRef.current.send(JSON.stringify(message));
    });
  }, []);

  const writeCoil = useCallback(async (address: number, value: boolean) => {
    try {
      const result = await sendMessage({
        action: 'write_coil',
        address,
        value,
      });

      if (result.success) {
        setState(prev => {
          const newCoilStates = [...prev.coilStates];
          newCoilStates[address] = value;

          if (address === 3 && value === true) {
            console.log('[Challenge] Coil 3 written to TRUE!');
          }

          return { ...prev, coilStates: newCoilStates };
        });
      }

      return result;
    } catch (error) {
      console.error('Error writing coil:', error);
      return { success: false, error: String(error) };
    }
  }, [sendMessage]);

  const readCoil = useCallback(async (address: number) => {
    try {
      const result = await sendMessage({
        action: 'read_coil',
        address,
      });
      return result.value || false;
    } catch (error) {
      console.error('Error reading coil:', error);
      return false;
    }
  }, [sendMessage]);

  const writeRegister = useCallback(async (address: number, value: number) => {
    try {
      const result = await sendMessage({
        action: 'write_register',
        address,
        value,
      });

      if (result.success) {
        setState(prev => {
          const newRegisterStates = [...prev.registerStates];
          newRegisterStates[address] = value;
          return { ...prev, registerStates: newRegisterStates };
        });
      }

      return result;
    } catch (error) {
      console.error('Error writing register:', error);
      return { success: false, error: String(error) };
    }
  }, [sendMessage]);

  const triggerEmergencyStop = useCallback(async () => {
    try {
      console.log('[HMI] Emergency stop triggered via UI button');
      await writeCoil(3, true);  // emergency_stop_button = TRUE (coil 3)

      // Mark as UI action for challenge detection
      await supabase.from('modbus_events').insert({
        session_id: state.sessionId,
        event_type: 'ui_action',
        address: 3,
        value: true,
        source: 'hmi_emergency_button',
      });

      // Don't manually set rideRunning - let motor_running coil sync handle it
    } catch (error) {
      console.error('Error triggering emergency stop:', error);
    }
  }, [writeCoil, state.sessionId]);

  const startRide = useCallback(async () => {
    try {
      const { data: session, error } = await supabase
        .from('lab_sessions')
        .insert({
          session_name: `Attraction Run ${new Date().toLocaleTimeString()}`,
          scenario_type: 'normal',
          plc_host: 'websocket',
          status: 'running',
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[Session] Created new session: ${session.id}`);

      setState(prev => ({
        ...prev,
        sessionId: session.id,
        carPosition: 0,
      }));

      // Write to coil 1 (start_command) - pulse it for 200ms
      await writeCoil(1, true);
      await new Promise(resolve => setTimeout(resolve, 200));
      await writeCoil(1, false);

      // Don't manually set rideRunning - let motor_running coil sync handle it
    } catch (error) {
      console.error('Error starting ride:', error);
    }
  }, [writeCoil]);

  const stopRide = useCallback(async () => {
    if (state.sessionId) {
      try {
        await supabase
          .from('lab_sessions')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('id', state.sessionId);

        // Write to coil 2 (stop_command) - pulse it for 200ms
        await writeCoil(2, true);
        await new Promise(resolve => setTimeout(resolve, 200));
        await writeCoil(2, false);

        // Clear session ID after stop command sent
        setState(prev => ({
          ...prev,
          sessionId: null,
        }));
      } catch (error) {
        console.error('Error stopping ride:', error);
      }
    }
    // Don't manually set rideRunning - let motor_running coil sync handle it
  }, [state.sessionId, writeCoil]);

  const resetRide = useCallback(async () => {
    try {
      console.log('[HMI] Resetting ride to Start of Day baseline');

      // STEP 1: Force emergency stop to halt any motion
      console.log('[HMI] Triggering emergency stop to halt motion...');
      await writeCoil(3, true);    // emergency_stop_button = TRUE
      await new Promise(resolve => setTimeout(resolve, 300));

      // STEP 2: Release emergency stop
      console.log('[HMI] Releasing emergency stop...');
      await writeCoil(3, false);   // emergency_stop_button = FALSE
      await new Promise(resolve => setTimeout(resolve, 300));

      // STEP 3: Set all INPUT coils to Start of Day baseline
      console.log('[HMI] Setting baseline conditions...');
      await writeCoil(0, true);    // master_enable = TRUE (QX0.0)
      await writeCoil(1, false);   // start_command = FALSE (QX0.1)
      await writeCoil(4, true);    // safety_gate_closed = TRUE (QX0.4)
      await writeCoil(5, true);    // zone_1_enable = TRUE (QX0.5)
      await writeCoil(6, true);    // zone_2_enable = TRUE (QX0.6)
      await writeCoil(7, true);    // zone_3_enable = TRUE (QX0.7)
      await writeCoil(8, true);    // event_1_enable = TRUE (QX0.8)
      await writeCoil(9, true);    // event_2_enable = TRUE (QX0.9)
      await writeCoil(10, true);   // event_3_enable = TRUE (QX0.10)
      await writeCoil(11, true);   // event_4_enable = TRUE (QX0.11)
      await writeCoil(12, true);   // event_5_enable = TRUE (QX0.12)
      await writeCoil(13, true);   // event_6_enable = TRUE (QX0.13)
      await writeCoil(14, true);   // event_7_enable = TRUE (QX0.14)
      await writeCoil(15, true);   // event_8_enable = TRUE (QX0.15)
      await writeCoil(16, true);   // event_9_enable = TRUE (QX0.16)

      // STEP 4: Reset position to 0
      console.log('[HMI] Resetting position to 0...');
      await writeRegister(1, 0);   // current_position = 0 (QW1 holding register)

      // Note: speed_setpoint is IW0 (input register) - read-only from Modbus client
      // The PLC controls speed internally, HMI cannot write to it

      // Reset local state
      setState(prev => ({
        ...prev,
        carPosition: 0,
        rideRunning: false,
        flashLight: false,
        sessionId: null,
        speedSetpoint: 50,
        state: 0,
      }));

      console.log('[HMI] ✓ Ride reset complete - ready for operation');
    } catch (error) {
      console.error('Error resetting ride:', error);
    }
  }, [writeCoil]);

  const setSafetyConditions = useCallback(async () => {
    try {
      console.log('[HMI] Initializing Safety Systems - Pre-Operational Checks');

      // Set PRE-START safety conditions (per plc_modbus_map.py)
      await writeCoil(0, true);     // master_enable = TRUE (coil 0)
      await writeCoil(3, false);    // emergency_stop_button = FALSE (coil 3)
      await writeCoil(4, true);     // safety_gate_closed = TRUE (coil 4)
      await writeCoil(5, true);     // zone_1_enable = TRUE (coil 5)
      await writeCoil(6, true);     // zone_2_enable = TRUE (coil 6)
      await writeCoil(7, true);     // zone_3_enable = TRUE (coil 7)

      console.log('[HMI] ✓ Safety systems initialized - ready for operation');
    } catch (error) {
      console.error('Error initializing safety systems:', error);
    }
  }, [writeCoil]);

  const connectToPLC = useCallback(async (host: string, port: number) => {
    try {
      await sendMessage({
        action: 'connect_plc',
        host,
        port,
      });

      // Auto-reset on connection
      console.log('[HMI] Auto-resetting ride on PLC connection');
      await new Promise(resolve => setTimeout(resolve, 500));
      await resetRide();
    } catch (error) {
      console.error('Error connecting to PLC:', error);
    }
  }, [sendMessage, resetRide]);

  return {
    ...state,
    trackLength: TRACK_LENGTH,
    startRide,
    stopRide,
    resetRide,
    connectToPLC,
    setSafetyConditions,
    triggerEmergencyStop,
    writeCoil,
  };
}
