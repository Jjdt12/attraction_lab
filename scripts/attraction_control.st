PROGRAM attraction_control
VAR_EXTERNAL
    (* Core Control Inputs *)
    master_enable : BOOL;
    start_command : BOOL;
    stop_command : BOOL;
    emergency_stop_button : BOOL;
    safety_gate_closed : BOOL;

    (* Zone Enable/Disable *)
    zone_1_enable : BOOL;
    zone_2_enable : BOOL;
    zone_3_enable : BOOL;

    (* Event Enable/Disable - 9 events total *)
    event_1_enable : BOOL;  (* Loading Gate *)
    event_2_enable : BOOL;  (* Safety Interlock *)
    event_3_enable : BOOL;  (* Launch Accelerator *)
    event_4_enable : BOOL;  (* Photo Flash *)
    event_5_enable : BOOL;  (* Mid-Course Brake *)
    event_6_enable : BOOL;  (* Track Switch *)
    event_7_enable : BOOL;  (* Final Brake *)
    event_8_enable : BOOL;  (* Station Approach *)
    event_9_enable : BOOL;  (* Unload Platform *)

    (* Event Triggered States - READ-ONLY outputs *)
    event_1_active : BOOL;
    event_2_active : BOOL;
    event_3_active : BOOL;
    event_4_active : BOOL;
    event_5_active : BOOL;
    event_6_active : BOOL;
    event_7_active : BOOL;
    event_8_active : BOOL;
    event_9_active : BOOL;

    (* System Outputs *)
    motor_running : BOOL;
    brake_engaged : BOOL;
    flash_light : BOOL;
    alert_active : BOOL;
    safety_ok : BOOL;

    (* Registers *)
    speed_setpoint : INT;        (* IW0: Input speed 0-100% *)
    current_position : INT;      (* QW1: Current position 0-26 (27 positions total) *)
    current_speed : INT;         (* QW2: Actual speed after ramping *)
    state : INT;                 (* MW15: State machine *)

    (* Zone Position Indicators *)
    zone_1_position : INT;  (* QW10: 1 if in zone 1, else 0 *)
    zone_2_position : INT;  (* QW11: 1 if in zone 2, else 0 *)
    zone_3_position : INT;  (* QW12: 1 if in zone 3, else 0 *)

    (* HMI Command Inputs - map coils to inputs internally *)
    hmi_master_enable AT %QX0.0 : BOOL;
    hmi_start_cmd AT %QX0.1 : BOOL;
    hmi_stop_cmd AT %QX0.2 : BOOL;
    hmi_estop_cmd AT %QX0.3 : BOOL;
    hmi_gate_cmd AT %QX0.4 : BOOL;

    (* Event Counters - track how many times each event triggered *)
    event_1_counter : INT;  (* MW20 *)
    event_2_counter : INT;  (* MW21 *)
    event_3_counter : INT;  (* MW22 *)
    event_4_counter : INT;  (* MW23 *)
    event_5_counter : INT;  (* MW24 *)
    event_6_counter : INT;  (* MW25 *)
    event_7_counter : INT;  (* MW26 *)
    event_8_counter : INT;  (* MW27 *)
    event_9_counter : INT;  (* MW28 *)

    (* System Counters *)
    cycle_counter : DINT;        (* MD3: Total laps completed *)
    runtime_hours : DINT;        (* MD2: Runtime hours *)
    last_error_code : INT;       (* MW5: Last error *)
    alarm_register : INT;        (* MW30: Alarm flags bitfield *)
    stealth_counter : INT;       (* MW31: Counts unauthorized changes *)
END_VAR

VAR
    (* Internal state tracking *)
    scan_counter : DINT;
    position_accumulator : INT;
    runtime_accumulator : DINT;

    (* Speed ramping *)
    target_speed : INT;
    actual_speed : INT;
    speed_ramp_rate : INT;

    (* Timers *)
    start_timer : INT;
    warmup_timer : INT;
    flash_timer : INT;
    event_timer : INT;

    (* Event position tracking *)
    last_position : INT;
    current_zone : INT;
    last_event_1 : BOOL;
    last_event_4 : BOOL;

    (* Safety interlock logic *)
    safety_bypass_detected : BOOL;
    unauthorized_speed_change : BOOL;

    (* Multi-event sequence tracking for CTF *)
    event_sequence_step : INT;
    event_out_of_order : BOOL;
END_VAR

(* ============================================ *)
(* HMI COMMAND MAPPING *)
(* Copy coil values written by HMI to internal variables *)
(* ============================================ *)
master_enable := hmi_master_enable;
start_command := hmi_start_cmd;
stop_command := hmi_stop_cmd;
emergency_stop_button := hmi_estop_cmd;
safety_gate_closed := hmi_gate_cmd;

(* ============================================ *)
(* INITIALIZATION ON FIRST SCAN *)
(* ============================================ *)
IF scan_counter = 0 THEN
    (* Set defaults *)
    speed_setpoint := 50;
    current_position := 0;
    current_speed := 0;
    cycle_counter := 0;
    runtime_hours := 0;
    last_error_code := 0;
    alarm_register := 0;
    stealth_counter := 0;

    (* Enable all zones and events by default *)
    zone_1_enable := TRUE;
    zone_2_enable := TRUE;
    zone_3_enable := TRUE;

    event_1_enable := TRUE;
    event_2_enable := TRUE;
    event_3_enable := TRUE;
    event_4_enable := TRUE;
    event_5_enable := TRUE;
    event_6_enable := TRUE;
    event_7_enable := TRUE;
    event_8_enable := TRUE;
    event_9_enable := TRUE;

    (* Initialize outputs *)
    motor_running := FALSE;
    brake_engaged := TRUE;
    flash_light := FALSE;
    alert_active := FALSE;
    state := 0;

    (* Reset event counters *)
    event_1_counter := 0;
    event_2_counter := 0;
    event_3_counter := 0;
    event_4_counter := 0;
    event_5_counter := 0;
    event_6_counter := 0;
    event_7_counter := 0;
    event_8_counter := 0;
    event_9_counter := 0;

    (* Internal variables *)
    actual_speed := 0;
    target_speed := 50;
    speed_ramp_rate := 2;
    event_sequence_step := 0;
END_IF;

scan_counter := scan_counter + 1;

(* ============================================ *)
(* SAFETY INTERLOCK SYSTEM *)
(* Multi-condition check for safe operation *)
(* ============================================ *)
safety_ok := FALSE;
IF safety_gate_closed THEN
    IF NOT emergency_stop_button THEN
        IF master_enable THEN
            safety_ok := TRUE;
        END_IF;
    END_IF;
END_IF;

(* Detect safety bypass attempts - CTF hook *)
IF state = 2 THEN  (* Running *)
    IF NOT safety_gate_closed THEN
        safety_bypass_detected := TRUE;
        stealth_counter := stealth_counter + 1;
        alarm_register := alarm_register + 1;  (* Set bit 0 *)
    END_IF;
END_IF;

(* ============================================ *)
(* ZONE CALCULATION based on position *)
(* Zone 1: 0-8, Zone 2: 9-17, Zone 3: 18-26 *)
(* ============================================ *)
zone_1_position := 0;
zone_2_position := 0;
zone_3_position := 0;
current_zone := 0;

IF current_position >= 0 AND current_position <= 8 THEN
    zone_1_position := 1;
    current_zone := 1;
ELSIF current_position >= 9 AND current_position <= 17 THEN
    zone_2_position := 1;
    current_zone := 2;
ELSIF current_position >= 18 AND current_position <= 26 THEN
    zone_3_position := 1;
    current_zone := 3;
END_IF;

(* ============================================ *)
(* EVENT TRIGGERING LOGIC *)
(* Each event activates in specific position range *)
(* ============================================ *)
event_1_active := FALSE;
event_2_active := FALSE;
event_3_active := FALSE;
event_4_active := FALSE;
event_5_active := FALSE;
event_6_active := FALSE;
event_7_active := FALSE;
event_8_active := FALSE;
event_9_active := FALSE;

(* ZONE 1 EVENTS (positions 0-8) *)
(* Event 1: Loading Gate (0-2) *)
IF event_1_enable THEN
    IF current_position >= 0 AND current_position <= 2 THEN
        event_1_active := TRUE;
        IF NOT last_event_1 THEN
            event_1_counter := event_1_counter + 1;
        END_IF;
    END_IF;
END_IF;
last_event_1 := event_1_active;

(* Event 2: Safety Interlock Gate (3-5) *)
IF event_2_enable THEN
    IF current_position >= 3 AND current_position <= 5 THEN
        event_2_active := TRUE;
        IF event_2_active THEN
            event_2_counter := event_2_counter + 1;
        END_IF;
        (* Mandatory safety check during this zone *)
        IF NOT safety_ok THEN
            alert_active := TRUE;
            last_error_code := 201;
        END_IF;
    END_IF;
END_IF;

(* Event 3: Launch Accelerator (6-8) *)
IF event_3_enable THEN
    IF current_position >= 6 AND current_position <= 8 THEN
        event_3_active := TRUE;
        IF event_3_active THEN
            event_3_counter := event_3_counter + 1;
        END_IF;
    END_IF;
END_IF;

(* ZONE 2 EVENTS (positions 9-17) *)
(* Event 4: Photo Flash Point (9-11) *)
IF event_4_enable THEN
    IF current_position >= 9 AND current_position <= 11 THEN
        event_4_active := TRUE;
        flash_light := TRUE;  (* Trigger flash *)
        IF NOT last_event_4 THEN
            event_4_counter := event_4_counter + 1;
        END_IF;
    ELSE
        IF last_event_4 THEN
            flash_light := FALSE;
        END_IF;
    END_IF;
END_IF;
last_event_4 := event_4_active;

(* Event 5: Mid-Course Brake Check (12-14) *)
IF event_5_enable THEN
    IF current_position >= 12 AND current_position <= 14 THEN
        event_5_active := TRUE;
        IF event_5_active THEN
            event_5_counter := event_5_counter + 1;
        END_IF;
        (* Speed must be <= 70% in this zone for safety *)
        IF actual_speed > 70 THEN
            alert_active := TRUE;
            last_error_code := 202;
        END_IF;
    END_IF;
END_IF;

(* Event 6: Track Switch Point (15-17) *)
IF event_6_enable THEN
    IF current_position >= 15 AND current_position <= 17 THEN
        event_6_active := TRUE;
        IF event_6_active THEN
            event_6_counter := event_6_counter + 1;
        END_IF;
    END_IF;
END_IF;

(* ZONE 3 EVENTS (positions 18-26) *)
(* Event 7: Final Brake Zone (18-20) *)
IF event_7_enable THEN
    IF current_position >= 18 AND current_position <= 20 THEN
        event_7_active := TRUE;
        IF event_7_active THEN
            event_7_counter := event_7_counter + 1;
        END_IF;
        (* Mandatory braking zone *)
        IF actual_speed > 50 THEN
            alert_active := TRUE;
            last_error_code := 203;
        END_IF;
    END_IF;
END_IF;

(* Event 8: Station Approach (21-23) *)
IF event_8_enable THEN
    IF current_position >= 21 AND current_position <= 23 THEN
        event_8_active := TRUE;
        IF event_8_active THEN
            event_8_counter := event_8_counter + 1;
        END_IF;
        (* Docking alignment requires slow speed *)
        IF actual_speed > 30 THEN
            alert_active := TRUE;
            last_error_code := 204;
        END_IF;
    END_IF;
END_IF;

(* Event 9: Unload Platform (24-26) *)
IF event_9_enable THEN
    IF current_position >= 24 AND current_position <= 26 THEN
        event_9_active := TRUE;
        IF event_9_active THEN
            event_9_counter := event_9_counter + 1;
        END_IF;
    END_IF;
END_IF;

(* ============================================ *)
(* EMERGENCY STOP - HIGHEST PRIORITY *)
(* ============================================ *)
IF emergency_stop_button THEN
    state := 4;  (* Emergency state *)
    motor_running := FALSE;
    brake_engaged := TRUE;
    alert_active := TRUE;
    last_error_code := 100;
    actual_speed := 0;
END_IF;

(* ============================================ *)
(* STATE MACHINE *)
(* 0=IDLE, 1=STARTING, 2=RUNNING, 3=STOPPING, 4=EMERGENCY *)
(* ============================================ *)
CASE state OF
    (* STATE 0: IDLE *)
    0:
        motor_running := FALSE;
        brake_engaged := TRUE;
        alert_active := FALSE;
        flash_light := FALSE;
        actual_speed := 0;
        warmup_timer := 0;

        IF start_command THEN
            IF safety_ok THEN
                state := 1;
                start_timer := 0;
                last_error_code := 0;
            ELSE
                (* Safety failure *)
                flash_light := TRUE;
                IF NOT safety_gate_closed THEN
                    last_error_code := 210;
                ELSIF emergency_stop_button THEN
                    last_error_code := 211;
                ELSIF NOT master_enable THEN
                    last_error_code := 212;
                END_IF;
            END_IF;
        END_IF;

    (* STATE 1: STARTING - Warmup phase *)
    1:
        flash_light := TRUE;
        start_timer := start_timer + 1;

        IF NOT safety_ok THEN
            state := 0;
            last_error_code := 220;
        ELSIF start_timer > 50 THEN  (* 1 second warmup *)
            brake_engaged := FALSE;
            motor_running := TRUE;
            target_speed := speed_setpoint;
            state := 2;
            flash_light := FALSE;
        END_IF;

    (* STATE 2: RUNNING *)
    2:
        motor_running := TRUE;
        brake_engaged := FALSE;

        IF stop_command THEN
            state := 3;
        END_IF;

        (* Zone disable checks *)
        IF NOT zone_1_enable THEN
            IF current_zone = 1 THEN
                alert_active := TRUE;
                last_error_code := 230;
            END_IF;
        END_IF;
        IF NOT zone_2_enable THEN
            IF current_zone = 2 THEN
                alert_active := TRUE;
                last_error_code := 231;
            END_IF;
        END_IF;
        IF NOT zone_3_enable THEN
            IF current_zone = 3 THEN
                alert_active := TRUE;
                last_error_code := 232;
            END_IF;
        END_IF;

        (* ============================================ *)
        (* SPEED RAMPING with smooth acceleration *)
        (* ============================================ *)
        target_speed := speed_setpoint;

        (* Detect unauthorized speed changes - CTF hook *)
        IF ABS(target_speed - actual_speed) > 30 THEN
            unauthorized_speed_change := TRUE;
            stealth_counter := stealth_counter + 1;
        END_IF;

        (* Smooth ramping *)
        IF target_speed > actual_speed THEN
            actual_speed := actual_speed + speed_ramp_rate;
            IF actual_speed > target_speed THEN
                actual_speed := target_speed;
            END_IF;
        ELSIF target_speed < actual_speed THEN
            actual_speed := actual_speed - speed_ramp_rate;
            IF actual_speed < target_speed THEN
                actual_speed := target_speed;
            END_IF;
        END_IF;

        (* Clamp speed to valid range 0-100% *)
        IF actual_speed < 0 THEN
            actual_speed := 0;
        END_IF;
        IF actual_speed > 100 THEN
            actual_speed := 100;
        END_IF;

        current_speed := actual_speed;

        (* ============================================ *)
        (* POSITION CALCULATION *)
        (* Position increments based on actual speed *)
        (* Slower increment: ~500ms per position at 50% speed *)
        (* ============================================ *)
        position_accumulator := position_accumulator + actual_speed;
        IF position_accumulator >= 2500 THEN  (* Scale factor for ~500ms steps *)
            position_accumulator := position_accumulator - 2500;
            current_position := current_position + 1;

            (* Wrap around at 27 (positions 0-26) *)
            IF current_position >= 27 THEN
                current_position := 0;
                cycle_counter := cycle_counter + 1;
            END_IF;
        END_IF;

        (* Runtime tracking *)
        runtime_accumulator := runtime_accumulator + 1;
        IF runtime_accumulator >= 180000 THEN  (* ~1 hour at 50ms scans *)
            runtime_accumulator := 0;
            runtime_hours := runtime_hours + 1;
        END_IF;

    (* STATE 3: STOPPING *)
    3:
        motor_running := FALSE;
        brake_engaged := TRUE;
        state := 0;
        alert_active := FALSE;
        actual_speed := 0;

    (* STATE 4: EMERGENCY *)
    4:
        motor_running := FALSE;
        brake_engaged := TRUE;
        alert_active := TRUE;
        flash_light := TRUE;
        actual_speed := 0;

        (* Can only clear if E-Stop released *)
        IF NOT emergency_stop_button THEN
            state := 0;
            alert_active := FALSE;
            flash_light := FALSE;
        END_IF;

END_CASE;

(* ============================================ *)
(* FLASH TIMING during state transitions *)
(* ============================================ *)
IF state = 1 OR state = 4 THEN
    flash_timer := flash_timer + 1;
    IF flash_timer > 25 THEN
        flash_light := NOT flash_light;
        flash_timer := 0;
    END_IF;
END_IF;

last_position := current_position;

END_PROGRAM

(* ============================================ *)
(* CONFIGURATION - Maps variables to Modbus *)
(* ============================================ *)
CONFIGURATION Config0
    RESOURCE Res0 ON PLC
        VAR_GLOBAL
            (* COILS - Digital I/O %QX0.x *)
            master_enable AT %QX0.0 : BOOL;
            start_command AT %QX0.1 : BOOL;
            stop_command AT %QX0.2 : BOOL;
            emergency_stop_button AT %QX0.3 : BOOL;
            safety_gate_closed AT %QX0.4 : BOOL;

            zone_1_enable AT %QX0.5 : BOOL;
            zone_2_enable AT %QX0.6 : BOOL;
            zone_3_enable AT %QX0.7 : BOOL;

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

            motor_running AT %QX0.26 : BOOL;
            brake_engaged AT %QX0.27 : BOOL;
            flash_light AT %QX0.28 : BOOL;
            alert_active AT %QX0.29 : BOOL;
            safety_ok AT %QX0.30 : BOOL;

            (* HOLDING REGISTERS *)
            speed_setpoint AT %IW0 : INT;
            current_position AT %QW1 : INT;
            current_speed AT %QW2 : INT;

            zone_1_position AT %QW10 : INT;
            zone_2_position AT %QW11 : INT;
            zone_3_position AT %QW12 : INT;

            state AT %MW15 : INT;

            event_1_counter AT %MW20 : INT;
            event_2_counter AT %MW21 : INT;
            event_3_counter AT %MW22 : INT;
            event_4_counter AT %MW23 : INT;
            event_5_counter AT %MW24 : INT;
            event_6_counter AT %MW25 : INT;
            event_7_counter AT %MW26 : INT;
            event_8_counter AT %MW27 : INT;
            event_9_counter AT %MW28 : INT;

            last_error_code AT %MW5 : INT;
            alarm_register AT %MW30 : INT;
            stealth_counter AT %MW31 : INT;

            runtime_hours AT %MD2 : DINT;
            cycle_counter AT %MD3 : DINT;
        END_VAR

        TASK task0(INTERVAL := T#20ms, PRIORITY := 0);
        PROGRAM instance0 : attraction_control;
    END_RESOURCE
END_CONFIGURATION
