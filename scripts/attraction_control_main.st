PROGRAM attraction_control_main
VAR
    (* Modbus-mapped control inputs/outputs *)
    start_command AT %QX0.1 : BOOL;
    stop_command AT %QX0.2 : BOOL;
    motor_running AT %QX3.2 : BOOL;
    brake_engaged AT %QX3.3 : BOOL;

    zone_1_enable AT %QX0.5 : BOOL;
    zone_2_enable AT %QX0.6 : BOOL;
    zone_3_enable AT %QX0.7 : BOOL;

    proximity_sensor_1 AT %QX5.0 : BOOL;
    proximity_sensor_2 AT %QX5.1 : BOOL;
    proximity_sensor_3 AT %QX5.2 : BOOL;
    proximity_sensor_4 AT %QX5.3 : BOOL;
    proximity_sensor_5 AT %QX5.4 : BOOL;
    proximity_sensor_6 AT %QX5.5 : BOOL;
    proximity_sensor_7 AT %QX5.6 : BOOL;
    proximity_sensor_8 AT %QX5.7 : BOOL;
    proximity_sensor_9 AT %QX6.0 : BOOL;

    (* Bridge-written registers from other PLCs *)
    safety_plc_ready_reg AT %MW102 : INT;
    effects_plc_ready_reg AT %MW103 : INT;

    (* Input registers *)
    speed_setpoint AT %IW0 : INT;

    (* Output registers *)
    current_position AT %QW1 : INT;
    current_speed AT %QW2 : INT;
    zone_1_position AT %QW10 : INT;
    zone_2_position AT %QW11 : INT;
    zone_3_position AT %QW12 : INT;

    (* State and diagnostics *)
    state AT %MW15 : INT;
    last_error_code AT %MW5 : INT;
    motor_current_amps AT %MW40 : INT;
    hydraulic_pressure_psi AT %MW41 : INT;
    bearing_temp_celsius AT %MW42 : INT;
    brake_wear_percent AT %MW43 : INT;
    vibration_level AT %MW44 : INT;

    (* Counters *)
    runtime_hours AT %MD2 : DINT;
    cycle_counter AT %MD3 : DINT;
END_VAR

VAR
    (* Local variables - not mapped to Modbus *)
    scan_counter : DINT;
    position_accumulator : INT;
    safety_plc_ready : BOOL;
    effects_plc_ready : BOOL;
    runtime_accumulator : DINT;

    target_speed : INT;
    actual_speed : INT;
    speed_ramp_rate : INT;

    start_timer : INT;
    last_position : INT;
    current_zone : INT;

    motor_load_factor : INT;
    temp_accumulator : INT;
END_VAR

IF scan_counter = 0 THEN
    speed_setpoint := 50;
    current_position := 0;
    current_speed := 0;
    cycle_counter := 0;
    runtime_hours := 0;
    last_error_code := 0;

    zone_1_enable := TRUE;
    zone_2_enable := TRUE;
    zone_3_enable := TRUE;

    motor_running := FALSE;
    brake_engaged := TRUE;
    state := 0;

    motor_current_amps := 0;
    hydraulic_pressure_psi := 1200;
    bearing_temp_celsius := 25;
    brake_wear_percent := 0;
    vibration_level := 10;

    actual_speed := 0;
    target_speed := 50;
    speed_ramp_rate := 2;

    (* safety_plc_ready_reg and effects_plc_ready_reg are written by SCADA bridge *)
    (* PLC reads their state but does not write to them *)
END_IF;

scan_counter := scan_counter + 1;

(* Read safety status from Safety PLC via SCADA bridge *)
(* Safety PLC writes to safety_ok_reg (MW100), we read via safety_plc_ready_reg *)
(* Effects PLC writes to effects_ok_reg (MW200), we read via effects_plc_ready_reg *)
IF safety_plc_ready_reg = 1 THEN
    safety_plc_ready := TRUE;
ELSE
    safety_plc_ready := FALSE;
END_IF;

IF effects_plc_ready_reg = 1 THEN
    effects_plc_ready := TRUE;
ELSE
    effects_plc_ready := FALSE;
END_IF;

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

CASE state OF
    0:
        motor_running := FALSE;
        brake_engaged := TRUE;
        actual_speed := 0;
        motor_current_amps := 0;

        IF start_command THEN
            IF safety_plc_ready THEN
                state := 1;
                start_timer := 0;
                last_error_code := 0;
            ELSE
                last_error_code := 300;
            END_IF;
        END_IF;

    1:
        start_timer := start_timer + 1;

        IF NOT safety_plc_ready THEN
            state := 0;
            last_error_code := 301;
        ELSIF start_timer > 50 THEN
            brake_engaged := FALSE;
            motor_running := TRUE;
            target_speed := speed_setpoint;
            state := 2;
        END_IF;

    2:
        motor_running := TRUE;
        brake_engaged := FALSE;

        IF stop_command THEN
            state := 3;
        END_IF;

        IF NOT zone_1_enable THEN
            IF current_zone = 1 THEN
                last_error_code := 310;
            END_IF;
        END_IF;
        IF NOT zone_2_enable THEN
            IF current_zone = 2 THEN
                last_error_code := 311;
            END_IF;
        END_IF;
        IF NOT zone_3_enable THEN
            IF current_zone = 3 THEN
                last_error_code := 312;
            END_IF;
        END_IF;

        target_speed := speed_setpoint;

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

        IF actual_speed < 0 THEN
            actual_speed := 0;
        END_IF;
        IF actual_speed > 100 THEN
            actual_speed := 100;
        END_IF;

        current_speed := actual_speed;

        motor_load_factor := (actual_speed * 80) / 100;
        motor_current_amps := 50 + motor_load_factor;

        temp_accumulator := temp_accumulator + 1;
        IF temp_accumulator >= 100 THEN
            temp_accumulator := 0;
            IF motor_running THEN
                IF bearing_temp_celsius < 85 THEN
                    bearing_temp_celsius := bearing_temp_celsius + 1;
                END_IF;
            ELSE
                IF bearing_temp_celsius > 25 THEN
                    bearing_temp_celsius := bearing_temp_celsius - 1;
                END_IF;
            END_IF;
        END_IF;

        vibration_level := 10 + (actual_speed / 10);

        position_accumulator := position_accumulator + actual_speed;
        IF position_accumulator >= 2500 THEN
            position_accumulator := position_accumulator - 2500;
            current_position := current_position + 1;

            IF current_position >= 27 THEN
                current_position := 0;
                cycle_counter := cycle_counter + 1;

                IF brake_wear_percent < 100 THEN
                    brake_wear_percent := brake_wear_percent + 1;
                END_IF;
            END_IF;
        END_IF;

        runtime_accumulator := runtime_accumulator + 1;
        IF runtime_accumulator >= 180000 THEN
            runtime_accumulator := 0;
            runtime_hours := runtime_hours + 1;
        END_IF;

    3:
        motor_running := FALSE;
        brake_engaged := TRUE;
        state := 0;
        actual_speed := 0;
        motor_current_amps := 0;

END_CASE;

IF NOT motor_running THEN
    motor_current_amps := 0;
END_IF;

last_position := current_position;

(* ================================================ *)
(* PROXIMITY SENSOR SIMULATION                      *)
(* Each sensor detects when car is within ±1 pos   *)
(* ================================================ *)
proximity_sensor_1 := (current_position >= 0 AND current_position <= 3);
proximity_sensor_2 := (current_position >= 2 AND current_position <= 6);
proximity_sensor_3 := (current_position >= 5 AND current_position <= 9);
proximity_sensor_4 := (current_position >= 8 AND current_position <= 12);
proximity_sensor_5 := (current_position >= 11 AND current_position <= 15);
proximity_sensor_6 := (current_position >= 14 AND current_position <= 18);
proximity_sensor_7 := (current_position >= 17 AND current_position <= 21);
proximity_sensor_8 := (current_position >= 20 AND current_position <= 24);
proximity_sensor_9 := (current_position >= 23 AND current_position <= 26);

END_PROGRAM
