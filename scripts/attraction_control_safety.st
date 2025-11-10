PROGRAM attraction_control_safety
VAR_EXTERNAL
    safety_ok : BOOL;
    alert_active : BOOL;

    event_1_enable : BOOL;
    event_2_enable : BOOL;
    event_3_enable : BOOL;
    event_4_enable : BOOL;
    event_5_enable : BOOL;
    event_6_enable : BOOL;
    event_7_enable : BOOL;
    event_8_enable : BOOL;
    event_9_enable : BOOL;

    event_1_active : BOOL;
    event_2_active : BOOL;
    event_3_active : BOOL;
    event_4_active : BOOL;
    event_5_active : BOOL;
    event_6_active : BOOL;
    event_7_active : BOOL;
    event_8_active : BOOL;
    event_9_active : BOOL;

    event_1_counter : INT;
    event_2_counter : INT;
    event_3_counter : INT;
    event_4_counter : INT;
    event_5_counter : INT;
    event_6_counter : INT;
    event_7_counter : INT;
    event_8_counter : INT;
    event_9_counter : INT;

    current_position_from_main : INT;
    current_speed_from_main : INT;
    motor_running_from_main : BOOL;

    safety_violation_count : INT;
    alarm_register : INT;
    stealth_counter : INT;
    watchdog_timeout_seconds : INT;
END_VAR

VAR
    (* HMI Command Inputs - Written by SCADA via Modbus Coils *)
    (* Declared with AT addresses in CONFIGURATION section below *)
    master_enable : BOOL;
    emergency_stop_button : BOOL;
    safety_gate_closed : BOOL;

    scan_counter : DINT;
    last_event_1 : BOOL;
    last_event_4 : BOOL;
    safety_bypass_detected : BOOL;
    watchdog_counter : INT;
END_VAR

IF scan_counter = 0 THEN
    master_enable := FALSE;
    emergency_stop_button := FALSE;
    safety_gate_closed := TRUE;
    safety_ok := FALSE;
    alert_active := FALSE;

    event_1_enable := TRUE;
    event_2_enable := TRUE;
    event_3_enable := TRUE;
    event_4_enable := TRUE;
    event_5_enable := TRUE;
    event_6_enable := TRUE;
    event_7_enable := TRUE;
    event_8_enable := TRUE;
    event_9_enable := TRUE;

    event_1_counter := 0;
    event_2_counter := 0;
    event_3_counter := 0;
    event_4_counter := 0;
    event_5_counter := 0;
    event_6_counter := 0;
    event_7_counter := 0;
    event_8_counter := 0;
    event_9_counter := 0;

    safety_violation_count := 0;
    alarm_register := 0;
    stealth_counter := 0;
    watchdog_timeout_seconds := 30;
    watchdog_counter := 0;
END_IF;

scan_counter := scan_counter + 1;

safety_ok := FALSE;
IF safety_gate_closed THEN
    IF NOT emergency_stop_button THEN
        IF master_enable THEN
            safety_ok := TRUE;
        END_IF;
    END_IF;
END_IF;

IF motor_running_from_main THEN
    IF NOT safety_gate_closed THEN
        safety_bypass_detected := TRUE;
        stealth_counter := stealth_counter + 1;
        alarm_register := alarm_register + 1;
        safety_violation_count := safety_violation_count + 1;
    END_IF;
END_IF;

IF emergency_stop_button THEN
    alert_active := TRUE;
END_IF;

event_1_active := FALSE;
event_2_active := FALSE;
event_3_active := FALSE;
event_4_active := FALSE;
event_5_active := FALSE;
event_6_active := FALSE;
event_7_active := FALSE;
event_8_active := FALSE;
event_9_active := FALSE;

IF event_1_enable THEN
    IF current_position_from_main >= 0 AND current_position_from_main <= 2 THEN
        event_1_active := TRUE;
        IF NOT last_event_1 THEN
            event_1_counter := event_1_counter + 1;
        END_IF;
    END_IF;
END_IF;
last_event_1 := event_1_active;

IF event_2_enable THEN
    IF current_position_from_main >= 3 AND current_position_from_main <= 5 THEN
        event_2_active := TRUE;
        IF event_2_active THEN
            event_2_counter := event_2_counter + 1;
        END_IF;
        IF NOT safety_ok THEN
            alert_active := TRUE;
        END_IF;
    END_IF;
END_IF;

IF event_3_enable THEN
    IF current_position_from_main >= 6 AND current_position_from_main <= 8 THEN
        event_3_active := TRUE;
        IF event_3_active THEN
            event_3_counter := event_3_counter + 1;
        END_IF;
    END_IF;
END_IF;

IF event_4_enable THEN
    IF current_position_from_main >= 9 AND current_position_from_main <= 11 THEN
        event_4_active := TRUE;
        IF NOT last_event_4 THEN
            event_4_counter := event_4_counter + 1;
        END_IF;
    END_IF;
END_IF;
last_event_4 := event_4_active;

IF event_5_enable THEN
    IF current_position_from_main >= 12 AND current_position_from_main <= 14 THEN
        event_5_active := TRUE;
        IF event_5_active THEN
            event_5_counter := event_5_counter + 1;
        END_IF;
        IF current_speed_from_main > 70 THEN
            alert_active := TRUE;
            safety_violation_count := safety_violation_count + 1;
        END_IF;
    END_IF;
END_IF;

IF event_6_enable THEN
    IF current_position_from_main >= 15 AND current_position_from_main <= 17 THEN
        event_6_active := TRUE;
        IF event_6_active THEN
            event_6_counter := event_6_counter + 1;
        END_IF;
    END_IF;
END_IF;

IF event_7_enable THEN
    IF current_position_from_main >= 18 AND current_position_from_main <= 20 THEN
        event_7_active := TRUE;
        IF event_7_active THEN
            event_7_counter := event_7_counter + 1;
        END_IF;
        IF current_speed_from_main > 50 THEN
            alert_active := TRUE;
            safety_violation_count := safety_violation_count + 1;
        END_IF;
    END_IF;
END_IF;

IF event_8_enable THEN
    IF current_position_from_main >= 21 AND current_position_from_main <= 23 THEN
        event_8_active := TRUE;
        IF event_8_active THEN
            event_8_counter := event_8_counter + 1;
        END_IF;
        IF current_speed_from_main > 30 THEN
            alert_active := TRUE;
            safety_violation_count := safety_violation_count + 1;
        END_IF;
    END_IF;
END_IF;

IF event_9_enable THEN
    IF current_position_from_main >= 24 AND current_position_from_main <= 26 THEN
        event_9_active := TRUE;
        IF event_9_active THEN
            event_9_counter := event_9_counter + 1;
        END_IF;
    END_IF;
END_IF;

watchdog_counter := watchdog_counter + 1;
IF watchdog_counter >= 1500 THEN
    watchdog_counter := 0;
END_IF;

END_PROGRAM

CONFIGURATION Config0
    RESOURCE Res0 ON PLC
        VAR_GLOBAL
            master_enable AT %IX0.0 : BOOL;
            emergency_stop_button AT %IX0.3 : BOOL;
            safety_gate_closed AT %IX0.4 : BOOL;
            safety_ok AT %QX0.30 : BOOL;
            alert_active AT %QX0.29 : BOOL;

            event_1_enable AT %QX0.8 : BOOL;
            event_2_enable AT %QX0.9 : BOOL;
            event_3_enable AT %QX0.10 : BOOL;
            event_4_enable AT %QX0.11 : BOOL;
            event_5_enable AT %QX0.12 : BOOL;
            event_6_enable AT %QX0.13 : BOOL;
            event_7_enable AT %QX0.14 : BOOL;
            event_8_enable AT %QX0.15 : BOOL;
            event_9_enable AT %QX0.16 : BOOL;

            event_1_active AT %QX0.17 : BOOL;
            event_2_active AT %QX0.18 : BOOL;
            event_3_active AT %QX0.19 : BOOL;
            event_4_active AT %QX0.20 : BOOL;
            event_5_active AT %QX0.21 : BOOL;
            event_6_active AT %QX0.22 : BOOL;
            event_7_active AT %QX0.23 : BOOL;
            event_8_active AT %QX0.24 : BOOL;
            event_9_active AT %QX0.25 : BOOL;

            event_1_counter AT %MW20 : INT;
            event_2_counter AT %MW21 : INT;
            event_3_counter AT %MW22 : INT;
            event_4_counter AT %MW23 : INT;
            event_5_counter AT %MW24 : INT;
            event_6_counter AT %MW25 : INT;
            event_7_counter AT %MW26 : INT;
            event_8_counter AT %MW27 : INT;
            event_9_counter AT %MW28 : INT;

            current_position_from_main AT %IW10 : INT;
            current_speed_from_main AT %IW11 : INT;
            motor_running_from_main AT %IX0.50 : BOOL;

            safety_violation_count AT %MW50 : INT;
            alarm_register AT %MW30 : INT;
            stealth_counter AT %MW31 : INT;
            watchdog_timeout_seconds AT %MW51 : INT;
        END_VAR

        TASK task0(INTERVAL := T#20ms, PRIORITY := 0);
        PROGRAM instance0 : attraction_control_safety;
    END_RESOURCE
END_CONFIGURATION
