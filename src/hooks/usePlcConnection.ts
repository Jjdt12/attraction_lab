import { useState, useEffect, useCallback, useRef } from 'react';

export interface PlcState {
  connected: boolean;
  coils: Record<number, boolean>;
  registers: Record<number, number>;
  lastUpdate: number | null;
}

export interface PlcConnectionState {
  main: PlcState;
  safety: PlcState;
  effects: PlcState;
}

const COIL_NAMES: Record<number, string> = {
  0: 'master_enable',
  1: 'start_command',
  2: 'stop_command',
  3: 'emergency_stop',
  4: 'safety_gate_closed',
  5: 'zone_1_enable',
  6: 'zone_2_enable',
  7: 'zone_3_enable',
  8: 'event_1_enable',
  9: 'event_2_enable',
  10: 'event_3_enable',
  11: 'event_4_enable',
  12: 'event_5_enable',
  13: 'event_6_enable',
  14: 'event_7_enable',
  15: 'event_8_enable',
  16: 'event_9_enable',
  17: 'event_1_active',
  18: 'event_2_active',
  19: 'event_3_active',
  20: 'event_4_active',
  21: 'event_5_active',
  22: 'event_6_active',
  23: 'event_7_active',
  24: 'event_8_active',
  25: 'event_9_active',
  26: 'motor_running',
  27: 'brake_engaged',
  28: 'flash_light',
  29: 'alert_active',
  30: 'safety_ok',
  31: 'safety_plc_ready',
  32: 'effects_plc_ready',
};

const REGISTER_NAMES: Record<number, string> = {
  1024: 'speed_setpoint',
  1025: 'current_position',
  1026: 'current_speed',
  1029: 'last_error_code',
  1039: 'state',
  1054: 'alarm_register',
  1055: 'stealth_counter',
  1064: 'motor_current',
  1065: 'hydraulic_pressure',
  1066: 'bearing_temp',
};

const STATE_NAMES: Record<number, string> = {
  0: 'IDLE',
  1: 'STARTING',
  2: 'RUNNING',
  3: 'STOPPING',
  4: 'EMERGENCY',
  5: 'MAINTENANCE',
};

const EVENT_NAMES = [
  'Loading Gate',
  'Safety Interlock',
  'Launch Accelerator',
  'Photo Flash',
  'Mid-Course Brake',
  'Track Switch',
  'Final Brake',
  'Station Approach',
  'Unload Platform',
];

const createEmptyPlcState = (): PlcState => ({
  connected: false,
  coils: {},
  registers: {},
  lastUpdate: null,
});

export function usePlcConnection(wsUrl: string = 'ws://localhost:8765') {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [plcStates, setPlcStates] = useState<PlcConnectionState>({
    main: createEmptyPlcState(),
    safety: createEmptyPlcState(),
    effects: createEmptyPlcState(),
  });
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const writeCoil = useCallback((plc: 'main' | 'safety' | 'effects', address: number, value: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'write_coil',
        plc,
        address,
        value,
      }));
    }
  }, []);

  const writeRegister = useCallback((plc: 'main' | 'safety' | 'effects', address: number, value: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'write_register',
        plc,
        address,
        value,
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;

    const attemptConnect = () => {
      if (!mounted) return;
      if (ws?.readyState === WebSocket.OPEN) return;

      setConnectionStatus('connecting');

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!mounted) return;
          setConnectionStatus('connected');
          setError(null);
          try {
            ws?.send(JSON.stringify({ action: 'connect_all_plcs' }));
          } catch (e) {
            console.warn('Failed to send initial message:', e);
          }
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'coil_change' || data.type === 'coil_update') {
              const plcKey = (data.plc?.toLowerCase() === 'safety') ? 'safety'
                : (data.plc?.toLowerCase() === 'effects') ? 'effects' : 'main';
              setPlcStates(prev => ({
                ...prev,
                [plcKey]: {
                  ...prev[plcKey],
                  connected: true,
                  coils: { ...prev[plcKey].coils, [data.address]: data.value },
                  lastUpdate: Date.now(),
                },
              }));
            } else if (data.type === 'register_change' || data.type === 'register_update' || data.type === 'dint_change') {
              const plcKey = (data.plc?.toLowerCase() === 'safety') ? 'safety'
                : (data.plc?.toLowerCase() === 'effects') ? 'effects' : 'main';
              setPlcStates(prev => ({
                ...prev,
                [plcKey]: {
                  ...prev[plcKey],
                  connected: true,
                  registers: { ...prev[plcKey].registers, [data.address]: data.value },
                  lastUpdate: Date.now(),
                },
              }));
            } else if (data.type === 'event_change') {
              setPlcStates(prev => ({
                ...prev,
                effects: {
                  ...prev.effects,
                  connected: true,
                  coils: { ...prev.effects.coils, [data.address]: data.value },
                  lastUpdate: Date.now(),
                },
              }));
            } else if (data.type === 'connection_status') {
              setPlcStates(prev => ({
                ...prev,
                main: { ...prev.main, connected: data.connected ?? prev.main.connected },
              }));
            } else if (data.type === 'multi_plc_connect_result') {
              setPlcStates(prev => ({
                ...prev,
                main: { ...prev.main, connected: data.results?.MAIN ?? prev.main.connected },
                safety: { ...prev.safety, connected: data.results?.SAFETY ?? prev.safety.connected },
                effects: { ...prev.effects, connected: data.results?.EFFECTS ?? prev.effects.connected },
              }));
            } else if (data.type === 'initial_state') {
              const plcKey = data.plc === 'main' ? 'main' : data.plc === 'safety' ? 'safety' : 'effects';
              const coils: Record<number, boolean> = {};
              const registers: Record<number, number> = {};

              if (data.coils) {
                Object.entries(data.coils).forEach(([addr, val]) => {
                  coils[parseInt(addr)] = val as boolean;
                });
              }
              if (data.registers) {
                Object.entries(data.registers).forEach(([addr, val]) => {
                  registers[parseInt(addr)] = val as number;
                });
              }

              setPlcStates(prev => ({
                ...prev,
                [plcKey]: {
                  connected: true,
                  coils,
                  registers,
                  lastUpdate: Date.now(),
                },
              }));
            } else if (data.type === 'plc_status') {
              setPlcStates(prev => ({
                ...prev,
                main: { ...prev.main, connected: data.main?.connected ?? prev.main.connected },
                safety: { ...prev.safety, connected: data.safety?.connected ?? prev.safety.connected },
                effects: { ...prev.effects, connected: data.effects?.connected ?? prev.effects.connected },
              }));
            }
          } catch {
            console.warn('Failed to parse WebSocket message');
          }
        };

        ws.onerror = () => {
          if (!mounted) return;
          setConnectionStatus('disconnected');
        };

        ws.onclose = () => {
          if (!mounted) return;
          setConnectionStatus('disconnected');
          ws = null;
          wsRef.current = null;
          reconnectTimeout = window.setTimeout(attemptConnect, 5000);
        };

        wsRef.current = ws;
      } catch (e) {
        console.warn('WebSocket creation failed:', e);
        if (!mounted) return;
        setConnectionStatus('disconnected');
        reconnectTimeout = window.setTimeout(attemptConnect, 5000);
      }
    };

    const initTimeout = setTimeout(attemptConnect, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
      wsRef.current = null;
    };
  }, [wsUrl]);

  const getCoilName = (address: number) => COIL_NAMES[address] || `coil_${address}`;
  const getRegisterName = (address: number) => REGISTER_NAMES[address] || `reg_${address}`;
  const getStateName = (state: number) => STATE_NAMES[state] || `UNKNOWN(${state})`;
  const getEventName = (index: number) => EVENT_NAMES[index] || `Event ${index + 1}`;

  return {
    connectionStatus,
    plcStates,
    error,
    writeCoil,
    writeRegister,
    getCoilName,
    getRegisterName,
    getStateName,
    getEventName,
  };
}
