PROGRAM attraction_control_effects
VAR
    scan_counter : DINT;
    flash_timer : INT;
    strobe_timer : INT;
    effect_timer : INT;
    runtime_accumulator : DINT;
    last_position : INT;
END_VAR

IF scan_counter = 0 THEN
    flash_light := FALSE;
    show_lighting_on := FALSE;
    audio_trigger_1 := FALSE;
    audio_trigger_2 := FALSE;
    audio_trigger_3 := FALSE;
    fog_machine_on := FALSE;
    strobe_active := FALSE;
    laser_effect_on := FALSE;

    lighting_scene := 1;
    audio_volume := 75;
    effect_intensity := 50;

    show_trigger_count := 0;
    effect_runtime_minutes := 0;
    runtime_accumulator := 0;

    event_1_counter := 0;
    event_2_counter := 0;
    event_3_counter := 0;
    event_4_counter := 0;
    event_5_counter := 0;
    event_6_counter := 0;
    event_7_counter := 0;
    event_8_counter := 0;
    event_9_counter := 0;
END_IF;

scan_counter := scan_counter + 1;

event_1_active := FALSE;
event_2_active := FALSE;
event_3_active := FALSE;
event_4_active := FALSE;
event_5_active := FALSE;
event_6_active := FALSE;
event_7_active := FALSE;
event_8_active := FALSE;
event_9_active := FALSE;

IF event_1_enable AND current_position_from_main >= 0 AND current_position_from_main <= 2 THEN
    event_1_active := TRUE;
    IF last_position < 0 OR last_position > 2 THEN
        event_1_counter := event_1_counter + 1;
    END_IF;
END_IF;

IF event_2_enable AND current_position_from_main >= 3 AND current_position_from_main <= 5 THEN
    event_2_active := TRUE;
    IF last_position < 3 OR last_position > 5 THEN
        event_2_counter := event_2_counter + 1;
    END_IF;
END_IF;

IF event_3_enable AND current_position_from_main >= 6 AND current_position_from_main <= 8 THEN
    event_3_active := TRUE;
    IF last_position < 6 OR last_position > 8 THEN
        event_3_counter := event_3_counter + 1;
    END_IF;
END_IF;

IF event_4_enable AND current_position_from_main >= 9 AND current_position_from_main <= 11 THEN
    event_4_active := TRUE;
    IF last_position < 9 OR last_position > 11 THEN
        event_4_counter := event_4_counter + 1;
    END_IF;
END_IF;

IF event_5_enable AND current_position_from_main >= 12 AND current_position_from_main <= 14 THEN
    event_5_active := TRUE;
    IF last_position < 12 OR last_position > 14 THEN
        event_5_counter := event_5_counter + 1;
    END_IF;
END_IF;

IF event_6_enable AND current_position_from_main >= 15 AND current_position_from_main <= 17 THEN
    event_6_active := TRUE;
    IF last_position < 15 OR last_position > 17 THEN
        event_6_counter := event_6_counter + 1;
    END_IF;
END_IF;

IF event_7_enable AND current_position_from_main >= 18 AND current_position_from_main <= 20 THEN
    event_7_active := TRUE;
    IF last_position < 18 OR last_position > 20 THEN
        event_7_counter := event_7_counter + 1;
    END_IF;
END_IF;

IF event_8_enable AND current_position_from_main >= 21 AND current_position_from_main <= 23 THEN
    event_8_active := TRUE;
    IF last_position < 21 OR last_position > 23 THEN
        event_8_counter := event_8_counter + 1;
    END_IF;
END_IF;

IF event_9_enable AND current_position_from_main >= 24 AND current_position_from_main <= 26 THEN
    event_9_active := TRUE;
    IF last_position < 24 OR last_position > 26 THEN
        event_9_counter := event_9_counter + 1;
    END_IF;
END_IF;

IF event_4_active_from_safety THEN
    flash_light := TRUE;
ELSE
    flash_light := FALSE;
END_IF;

IF current_position_from_main >= 0 AND current_position_from_main <= 5 THEN
    lighting_scene := 1;
    show_lighting_on := TRUE;
    audio_trigger_1 := TRUE;
    audio_trigger_2 := FALSE;
    audio_trigger_3 := FALSE;
    fog_machine_on := FALSE;
    strobe_active := FALSE;
    laser_effect_on := FALSE;
ELSIF current_position_from_main >= 6 AND current_position_from_main <= 11 THEN
    lighting_scene := 2;
    show_lighting_on := TRUE;
    audio_trigger_1 := FALSE;
    audio_trigger_2 := TRUE;
    audio_trigger_3 := FALSE;
    fog_machine_on := TRUE;
    strobe_active := TRUE;
    laser_effect_on := TRUE;
ELSIF current_position_from_main >= 12 AND current_position_from_main <= 17 THEN
    lighting_scene := 3;
    show_lighting_on := TRUE;
    audio_trigger_1 := FALSE;
    audio_trigger_2 := FALSE;
    audio_trigger_3 := TRUE;
    fog_machine_on := TRUE;
    strobe_active := FALSE;
    laser_effect_on := TRUE;
ELSIF current_position_from_main >= 18 AND current_position_from_main <= 26 THEN
    lighting_scene := 4;
    show_lighting_on := TRUE;
    audio_trigger_1 := TRUE;
    audio_trigger_2 := FALSE;
    audio_trigger_3 := FALSE;
    fog_machine_on := FALSE;
    strobe_active := FALSE;
    laser_effect_on := FALSE;
ELSE
    show_lighting_on := FALSE;
    audio_trigger_1 := FALSE;
    audio_trigger_2 := FALSE;
    audio_trigger_3 := FALSE;
    fog_machine_on := FALSE;
    strobe_active := FALSE;
    laser_effect_on := FALSE;
END_IF;

IF strobe_active THEN
    strobe_timer := strobe_timer + 1;
    IF strobe_timer > 10 THEN
        strobe_timer := 0;
    END_IF;
END_IF;

IF current_position_from_main <> last_position THEN
    show_trigger_count := show_trigger_count + 1;
END_IF;

runtime_accumulator := runtime_accumulator + 1;
IF runtime_accumulator >= 3000000 THEN
    runtime_accumulator := 0;
    effect_runtime_minutes := effect_runtime_minutes + 1;
END_IF;

last_position := current_position_from_main;

END_PROGRAM

CONFIGURATION Config0
    RESOURCE Res0 ON PLC
        VAR_GLOBAL
            flash_light AT %QX3.4 : BOOL;  (* bit 28 = byte 3, bit 4 *)
            show_lighting_on AT %QX7.4 : BOOL;  (* bit 60 = byte 7, bit 4 *)
            audio_trigger_1 AT %QX7.5 : BOOL;  (* bit 61 = byte 7, bit 5 *)
            audio_trigger_2 AT %QX7.6 : BOOL;  (* bit 62 = byte 7, bit 6 *)
            audio_trigger_3 AT %QX7.7 : BOOL;  (* bit 63 = byte 7, bit 7 *)
            fog_machine_on AT %QX8.0 : BOOL;  (* bit 64 = byte 8, bit 0 *)
            strobe_active AT %QX8.1 : BOOL;  (* bit 65 = byte 8, bit 1 *)
            laser_effect_on AT %QX8.2 : BOOL;  (* bit 66 = byte 8, bit 2 *)

            event_1_enable AT %MX100.0 : BOOL;  (* Memory bit 800 *)
            event_2_enable AT %MX100.1 : BOOL;  (* Memory bit 801 *)
            event_3_enable AT %MX100.2 : BOOL;  (* Memory bit 802 *)
            event_4_enable AT %MX100.3 : BOOL;  (* Memory bit 803 *)
            event_5_enable AT %MX100.4 : BOOL;  (* Memory bit 804 *)
            event_6_enable AT %MX100.5 : BOOL;  (* Memory bit 805 *)
            event_7_enable AT %MX100.6 : BOOL;  (* Memory bit 806 *)
            event_8_enable AT %MX100.7 : BOOL;  (* Memory bit 807 *)
            event_9_enable AT %MX101.0 : BOOL;  (* Memory bit 808 *)

            event_1_active AT %QX2.1 : BOOL;  (* bit 17 = byte 2, bit 1 *)
            event_2_active AT %QX2.2 : BOOL;  (* bit 18 = byte 2, bit 2 *)
            event_3_active AT %QX2.3 : BOOL;  (* bit 19 = byte 2, bit 3 *)
            event_4_active AT %QX2.4 : BOOL;  (* bit 20 = byte 2, bit 4 *)
            event_5_active AT %QX2.5 : BOOL;  (* bit 21 = byte 2, bit 5 *)
            event_6_active AT %QX2.6 : BOOL;  (* bit 22 = byte 2, bit 6 *)
            event_7_active AT %QX2.7 : BOOL;  (* bit 23 = byte 2, bit 7 *)
            event_8_active AT %QX3.0 : BOOL;  (* bit 24 = byte 3, bit 0 *)
            event_9_active AT %QX3.1 : BOOL;  (* bit 25 = byte 3, bit 1 *)

            current_position_from_main AT %MW10 : INT;
            event_1_active_from_safety AT %MX70 : BOOL;  (* bit 70 via bridge *)
            event_4_active_from_safety AT %MX71 : BOOL;  (* bit 71 via bridge *)

            lighting_scene AT %MW60 : INT;
            audio_volume AT %MW61 : INT;
            effect_intensity AT %MW62 : INT;

            show_trigger_count AT %MW63 : INT;
            effect_runtime_minutes AT %MW64 : INT;

            event_1_counter AT %MW1044 : INT;
            event_2_counter AT %MW1045 : INT;
            event_3_counter AT %MW1046 : INT;
            event_4_counter AT %MW1047 : INT;
            event_5_counter AT %MW1048 : INT;
            event_6_counter AT %MW1049 : INT;
            event_7_counter AT %MW1050 : INT;
            event_8_counter AT %MW1051 : INT;
            event_9_counter AT %MW1052 : INT;
        END_VAR

        TASK task0(INTERVAL := T#20ms, PRIORITY := 0);
        PROGRAM instance0 : attraction_control_effects;
    END_RESOURCE
END_CONFIGURATION
