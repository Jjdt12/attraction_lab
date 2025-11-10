import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type AlarmSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type PLCName = 'MAIN' | 'SAFETY' | 'EFFECTS' | 'SYSTEM';

export interface Alarm {
  id: string;
  alarmCode: string;
  alarmName: string;
  alarmDescription: string;
  triggeredAt: Date;
  clearedAt: Date | null;
  plcName: PLCName;
  triggerValue: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  severity: AlarmSeverity;
}

export interface SystemEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  severity: AlarmSeverity;
  plcName: PLCName;
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
}

export function useAlarmSystem() {
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadActiveAlarms = useCallback(async () => {
    const { data, error } = await supabase
      .from('alarm_history')
      .select('*')
      .is('cleared_at', null)
      .order('triggered_at', { ascending: false });

    if (!error && data) {
      setActiveAlarms(data.map(alarm => ({
        id: alarm.id,
        alarmCode: alarm.alarm_code,
        alarmName: alarm.alarm_name,
        alarmDescription: alarm.alarm_description || '',
        triggeredAt: new Date(alarm.triggered_at),
        clearedAt: alarm.cleared_at ? new Date(alarm.cleared_at) : null,
        plcName: alarm.plc_name as PLCName,
        triggerValue: alarm.trigger_value || '',
        acknowledged: alarm.acknowledged,
        acknowledgedBy: alarm.acknowledged_by,
        severity: determineSeverity(alarm.alarm_code)
      })));
    }
  }, []);

  const loadAlarmHistory = useCallback(async (limit = 50) => {
    const { data, error } = await supabase
      .from('alarm_history')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setAlarmHistory(data.map(alarm => ({
        id: alarm.id,
        alarmCode: alarm.alarm_code,
        alarmName: alarm.alarm_name,
        alarmDescription: alarm.alarm_description || '',
        triggeredAt: new Date(alarm.triggered_at),
        clearedAt: alarm.cleared_at ? new Date(alarm.cleared_at) : null,
        plcName: alarm.plc_name as PLCName,
        triggerValue: alarm.trigger_value || '',
        acknowledged: alarm.acknowledged,
        acknowledgedBy: alarm.acknowledged_by,
        severity: determineSeverity(alarm.alarm_code)
      })));
    }
  }, []);

  const loadRecentEvents = useCallback(async (limit = 100) => {
    const { data, error } = await supabase
      .from('system_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setRecentEvents(data.map(event => ({
        id: event.id,
        timestamp: new Date(event.timestamp),
        eventType: event.event_type,
        severity: event.severity as AlarmSeverity,
        plcName: event.plc_name as PLCName,
        message: event.message,
        details: event.details || {},
        acknowledged: event.acknowledged,
        acknowledgedAt: event.acknowledged_at ? new Date(event.acknowledged_at) : null
      })));
    }
  }, []);

  const triggerAlarm = useCallback(async (
    alarmCode: string,
    alarmName: string,
    plcName: PLCName,
    triggerValue: string,
    description?: string
  ) => {
    const { error } = await supabase
      .from('alarm_history')
      .insert({
        alarm_code: alarmCode,
        alarm_name: alarmName,
        alarm_description: description,
        plc_name: plcName,
        trigger_value: triggerValue,
        acknowledged: false
      });

    if (!error) {
      await loadActiveAlarms();
      await logEvent('ALARM', determineSeverity(alarmCode), plcName, `Alarm triggered: ${alarmName}`);
    }
  }, [loadActiveAlarms]);

  const clearAlarm = useCallback(async (alarmId: string) => {
    const { error } = await supabase
      .from('alarm_history')
      .update({ cleared_at: new Date().toISOString() })
      .eq('id', alarmId);

    if (!error) {
      await loadActiveAlarms();
      await loadAlarmHistory();
    }
  }, [loadActiveAlarms, loadAlarmHistory]);

  const acknowledgeAlarm = useCallback(async (alarmId: string, acknowledgedBy = 'Operator') => {
    const { error } = await supabase
      .from('alarm_history')
      .update({ acknowledged: true, acknowledged_by: acknowledgedBy })
      .eq('id', alarmId);

    if (!error) {
      await loadActiveAlarms();
    }
  }, [loadActiveAlarms]);

  const logEvent = useCallback(async (
    eventType: string,
    severity: AlarmSeverity,
    plcName: PLCName,
    message: string,
    details?: Record<string, any>
  ) => {
    await supabase
      .from('system_events')
      .insert({
        event_type: eventType,
        severity,
        plc_name: plcName,
        message,
        details: details || {}
      });

    await loadRecentEvents();
  }, [loadRecentEvents]);

  useEffect(() => {
    loadActiveAlarms();
    loadAlarmHistory();
    loadRecentEvents();

    const alarmSubscription = supabase
      .channel('alarm-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_history' }, () => {
        loadActiveAlarms();
        loadAlarmHistory();
      })
      .subscribe();

    const eventSubscription = supabase
      .channel('event-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, () => {
        loadRecentEvents();
      })
      .subscribe();

    return () => {
      alarmSubscription.unsubscribe();
      eventSubscription.unsubscribe();
    };
  }, [loadActiveAlarms, loadAlarmHistory, loadRecentEvents]);

  return {
    activeAlarms,
    alarmHistory,
    recentEvents,
    soundEnabled,
    setSoundEnabled,
    triggerAlarm,
    clearAlarm,
    acknowledgeAlarm,
    logEvent,
    refreshAlarms: loadActiveAlarms,
    refreshEvents: loadRecentEvents
  };
}

function determineSeverity(alarmCode: string): AlarmSeverity {
  if (alarmCode.startsWith('CRIT') || alarmCode.includes('ESTOP') || alarmCode.includes('EMERGENCY')) {
    return 'CRITICAL';
  }
  if (alarmCode.startsWith('WARN') || alarmCode.includes('HIGH') || alarmCode.includes('LOW')) {
    return 'WARNING';
  }
  return 'INFO';
}
