PROGRAM attraction_control_effects
VAR_EXTERNAL
    flash_light : BOOL;
    show_lighting_on : BOOL;
    audio_trigger_1 : BOOL;
    audio_trigger_2 : BOOL;
    audio_trigger_3 : BOOL;
    fog_machine_on : BOOL;
    strobe_active : BOOL;
    laser_effect_on : BOOL;

    current_position_from_main : INT;
    event_1_active_from_safety : BOOL;
    event_4_active_from_safety : BOOL;

    lighting_scene : INT;
    audio_volume : INT;
    effect_intensity : INT;

    show_trigger_count : INT;
    effect_runtime_minutes : INT;
END_VAR

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
END_IF;

scan_counter := scan_counter + 1;

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
            flash_light AT %QX0.28 : BOOL;
            show_lighting_on AT %QX0.60 : BOOL;
            audio_trigger_1 AT %QX0.61 : BOOL;
            audio_trigger_2 AT %QX0.62 : BOOL;
            audio_trigger_3 AT %QX0.63 : BOOL;
            fog_machine_on AT %QX0.64 : BOOL;
            strobe_active AT %QX0.65 : BOOL;
            laser_effect_on AT %QX0.66 : BOOL;

            current_position_from_main AT %IW10 : INT;
            event_1_active_from_safety AT %IX0.70 : BOOL;
            event_4_active_from_safety AT %IX0.71 : BOOL;

            lighting_scene AT %MW60 : INT;
            audio_volume AT %MW61 : INT;
            effect_intensity AT %MW62 : INT;

            show_trigger_count AT %MW63 : INT;
            effect_runtime_minutes AT %MW64 : INT;
        END_VAR

        TASK task0(INTERVAL := T#20ms, PRIORITY := 0);
        PROGRAM instance0 : attraction_control_effects;
    END_RESOURCE
END_CONFIGURATION
