import { useState, useEffect, useCallback } from 'react';

export type PLCType = 'MAIN' | 'SAFETY' | 'EFFECTS';

export interface PLCConnection {
  name: PLCType;
  host: string;
  port: number;
  connected: boolean;
  error: string | null;
  lastHeartbeat: number;
}

export interface ModbusOperation {
  timestamp: number;
  plc: PLCType;
  operation: 'READ_COILS' | 'WRITE_COIL' | 'READ_HOLDING' | 'WRITE_HOLDING';
  address: number;
  value?: number | boolean;
  count?: number;
}

const DEFAULT_PLCS: PLCConnection[] = [
  { name: 'MAIN', host: 'localhost', port: 502, connected: false, error: null, lastHeartbeat: 0 },
  { name: 'SAFETY', host: 'localhost', port: 503, connected: false, error: null, lastHeartbeat: 0 },
  { name: 'EFFECTS', host: 'localhost', port: 504, connected: false, error: null, lastHeartbeat: 0 },
];

export function useMultiPLCConnection() {
  const [plcs, setPlcs] = useState<PLCConnection[]>(DEFAULT_PLCS);
  const [operations, setOperations] = useState<ModbusOperation[]>([]);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  const logOperation = useCallback((op: ModbusOperation) => {
    setOperations(prev => [...prev.slice(-99), op]);
  }, []);

  const connectToPLC = useCallback(async (plcName: PLCType) => {
    setPlcs(prev => prev.map(plc =>
      plc.name === plcName
        ? { ...plc, connected: true, error: null, lastHeartbeat: Date.now() }
        : plc
    ));
  }, []);

  const disconnectFromPLC = useCallback((plcName: PLCType) => {
    setPlcs(prev => prev.map(plc =>
      plc.name === plcName
        ? { ...plc, connected: false, error: null }
        : plc
    ));
  }, []);

  const connectToAllPLCs = useCallback(async () => {
    for (const plc of DEFAULT_PLCS) {
      await connectToPLC(plc.name);
    }
  }, [connectToPLC]);

  const disconnectAllPLCs = useCallback(() => {
    setPlcs(DEFAULT_PLCS);
  }, []);

  const readCoils = useCallback(async (plc: PLCType, address: number, count: number): Promise<boolean[]> => {
    logOperation({
      timestamp: Date.now(),
      plc,
      operation: 'READ_COILS',
      address,
      count
    });
    return new Array(count).fill(false);
  }, [logOperation]);

  const writeCoil = useCallback(async (plc: PLCType, address: number, value: boolean): Promise<void> => {
    logOperation({
      timestamp: Date.now(),
      plc,
      operation: 'WRITE_COIL',
      address,
      value
    });
  }, [logOperation]);

  const readHoldingRegisters = useCallback(async (plc: PLCType, address: number, count: number): Promise<number[]> => {
    logOperation({
      timestamp: Date.now(),
      plc,
      operation: 'READ_HOLDING',
      address,
      count
    });
    return new Array(count).fill(0);
  }, [logOperation]);

  const writeHoldingRegister = useCallback(async (plc: PLCType, address: number, value: number): Promise<void> => {
    logOperation({
      timestamp: Date.now(),
      plc,
      operation: 'WRITE_HOLDING',
      address,
      value
    });
  }, [logOperation]);

  const clearOperationLog = useCallback(() => {
    setOperations([]);
  }, []);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      setPlcs(prev => prev.map(plc =>
        plc.connected ? { ...plc, lastHeartbeat: Date.now() } : plc
      ));
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  return {
    plcs,
    operations,
    isSimulationMode,
    setIsSimulationMode,
    connectToPLC,
    disconnectFromPLC,
    connectToAllPLCs,
    disconnectAllPLCs,
    readCoils,
    writeCoil,
    readHoldingRegisters,
    writeHoldingRegister,
    clearOperationLog,
  };
}
