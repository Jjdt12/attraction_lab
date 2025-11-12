PROGRAM attraction_control_safety
VAR_EXTERNAL
    (* Reference to global variables declared in CONFIGURATION section *)
    master_enable : BOOL;
    emergency_stop_button : BOOL;
    safety_gate_closed : BOOL;
    safety_ok_reg : INT;

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

    proximity_sensor_1_from_main : INT;
    proximity_sensor_2_from_main : INT;
    proximity_sensor_3_from_main : INT;
    proximity_sensor_4_from_main : INT;
    proximity_sensor_5_from_main : INT;
    proximity_sensor_6_from_main : INT;
    proximity_sensor_7_from_main : INT;
    proximity_sensor_8_from_main : INT;
    proximity_sensor_9_from_main : INT;

    safety_violation_count : INT;
    alarm_register : INT;
    stealth_counter : INT;
    watchdog_timeout_seconds : INT;

    (* Local-only variables - not mapped to Modbus *)
    scan_counter : DINT;
    last_event_1 : BOOL;
    last_event_4 : BOOL;
    safety_bypass_detected : BOOL;
    watchdog_counter : INT;
    safety_ok : BOOL;
    alert_active : BOOL;
END_VAR

IF scan_counter = 0 THEN
    (* master_enable, emergency_stop_button, safety_gate_closed are written by HMI *)
    safety_ok := FALSE;

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

(* Write safety_ok to holding register for SCADA bridge *)
IF safety_ok THEN
    safety_ok_reg := 1;
ELSE
    safety_ok_reg := 0;
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

(* ============================================== *)
(* PROXIMITY SENSOR-BASED EVENT DETECTION        *)
(* Events trigger when sensors detect the car    *)
(* Counter increments on rising edge only        *)
(* ============================================== *)

event_1_active := FALSE;
event_2_active := FALSE;
event_3_active := FALSE;
event_4_active := FALSE;
event_5_active := FALSE;
event_6_active := FALSE;
event_7_active := FALSE;
event_8_active := FALSE;
event_9_active := FALSE;

IF event_1_enable AND (proximity_sensor_1_from_main <> 0) THEN
    event_1_active := TRUE;
    IF NOT last_event_1 THEN
        event_1_counter := event_1_counter + 1;
    END_IF;
END_IF;
last_event_1 := event_1_active;

IF event_2_enable AND (proximity_sensor_2_from_main <> 0) THEN
    event_2_active := TRUE;
    IF NOT last_event_1 THEN
        event_2_counter := event_2_counter + 1;
    END_IF;
    IF NOT safety_ok THEN
        alert_active := TRUE;
    END_IF;
END_IF;

IF event_3_enable AND (proximity_sensor_3_from_main <> 0) THEN
    event_3_active := TRUE;
    IF NOT last_event_1 THEN
        event_3_counter := event_3_counter + 1;
    END_IF;
END_IF;

IF event_4_enable AND (proximity_sensor_4_from_main <> 0) THEN
    event_4_active := TRUE;
    IF NOT last_event_4 THEN
        event_4_counter := event_4_counter + 1;
    END_IF;
END_IF;
last_event_4 := event_4_active;

IF event_5_enable AND (proximity_sensor_5_from_main <> 0) THEN
    event_5_active := TRUE;
    IF NOT last_event_4 THEN
        event_5_counter := event_5_counter + 1;
    END_IF;
    IF current_speed_from_main > 70 THEN
        alert_active := TRUE;
        safety_violation_count := safety_violation_count + 1;
    END_IF;
END_IF;

IF event_6_enable AND (proximity_sensor_6_from_main <> 0) THEN
    event_6_active := TRUE;
    IF NOT last_event_4 THEN
        event_6_counter := event_6_counter + 1;
    END_IF;
END_IF;

IF event_7_enable AND (proximity_sensor_7_from_main <> 0) THEN
    event_7_active := TRUE;
    IF NOT last_event_4 THEN
        event_7_counter := event_7_counter + 1;
    END_IF;
    IF current_speed_from_main > 50 THEN
        alert_active := TRUE;
        safety_violation_count := safety_violation_count + 1;
    END_IF;
END_IF;

IF event_8_enable AND (proximity_sensor_8_from_main <> 0) THEN
    event_8_active := TRUE;
    IF NOT last_event_4 THEN
        event_8_counter := event_8_counter + 1;
    END_IF;
    IF current_speed_from_main > 30 THEN
        alert_active := TRUE;
        safety_violation_count := safety_violation_count + 1;
    END_IF;
END_IF;

IF event_9_enable AND (proximity_sensor_9_from_main <> 0) THEN
    event_9_active := TRUE;
    IF NOT last_event_4 THEN
        event_9_counter := event_9_counter + 1;
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
            (* Control inputs from MAIN PLC via Modbus - using %MX for inter-PLC communication *)
            master_enable AT %MX0.0 : BOOL;
            emergency_stop_button AT %MX0.1 : BOOL;
            safety_gate_closed AT %MX0.2 : BOOL;

            (* Output register for MAIN PLC to read *)
            safety_ok_reg AT %MW100 : INT;

            event_1_enable AT %QX1.0 : BOOL;  (* bit 8 = byte 1, bit 0 *)
            event_2_enable AT %QX1.1 : BOOL;  (* bit 9 = byte 1, bit 1 *)
            event_3_enable AT %QX1.2 : BOOL;  (* bit 10 = byte 1, bit 2 *)
            event_4_enable AT %QX1.3 : BOOL;  (* bit 11 = byte 1, bit 3 *)
            event_5_enable AT %QX1.4 : BOOL;  (* bit 12 = byte 1, bit 4 *)
            event_6_enable AT %QX1.5 : BOOL;  (* bit 13 = byte 1, bit 5 *)
            event_7_enable AT %QX1.6 : BOOL;  (* bit 14 = byte 1, bit 6 *)
            event_8_enable AT %QX1.7 : BOOL;  (* bit 15 = byte 1, bit 7 *)
            event_9_enable AT %QX2.0 : BOOL;  (* bit 16 = byte 2, bit 0 *)

            event_1_active AT %QX2.1 : BOOL;  (* bit 17 = byte 2, bit 1 *)
            event_2_active AT %QX2.2 : BOOL;  (* bit 18 = byte 2, bit 2 *)
            event_3_active AT %QX2.3 : BOOL;  (* bit 19 = byte 2, bit 3 *)
            event_4_active AT %QX2.4 : BOOL;  (* bit 20 = byte 2, bit 4 *)
            event_5_active AT %QX2.5 : BOOL;  (* bit 21 = byte 2, bit 5 *)
            event_6_active AT %QX2.6 : BOOL;  (* bit 22 = byte 2, bit 6 *)
            event_7_active AT %QX2.7 : BOOL;  (* bit 23 = byte 2, bit 7 *)
            event_8_active AT %QX3.0 : BOOL;  (* bit 24 = byte 3, bit 0 *)
            event_9_active AT %QX3.1 : BOOL;  (* bit 25 = byte 3, bit 1 *)

            event_1_counter AT %MW20 : INT;
            event_2_counter AT %MW21 : INT;
            event_3_counter AT %MW22 : INT;
            event_4_counter AT %MW23 : INT;
            event_5_counter AT %MW24 : INT;
            event_6_counter AT %MW25 : INT;
            event_7_counter AT %MW26 : INT;
            event_8_counter AT %MW27 : INT;
            event_9_counter AT %MW28 : INT;

            current_position_from_main AT %MW10 : INT;
            current_speed_from_main AT %MW11 : INT;
            motor_running_from_main AT %MX50.0 : BOOL;  (* bit 50 via bridge *)

            proximity_sensor_1_from_main AT %MW80 : INT;
            proximity_sensor_2_from_main AT %MW81 : INT;
            proximity_sensor_3_from_main AT %MW82 : INT;
            proximity_sensor_4_from_main AT %MW83 : INT;
            proximity_sensor_5_from_main AT %MW84 : INT;
            proximity_sensor_6_from_main AT %MW85 : INT;
            proximity_sensor_7_from_main AT %MW86 : INT;
            proximity_sensor_8_from_main AT %MW87 : INT;
            proximity_sensor_9_from_main AT %MW88 : INT;

            safety_violation_count AT %MW50 : INT;
            alarm_register AT %MW30 : INT;
            stealth_counter AT %MW31 : INT;
            watchdog_timeout_seconds AT %MW51 : INT;
        END_VAR

        TASK task0(INTERVAL := T#20ms, PRIORITY := 0);
        PROGRAM instance0 : attraction_control_safety;
    END_RESOURCE
END_CONFIGURATION
