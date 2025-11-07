export type RideEventType =
  | 'loading_gate'
  | 'safety_interlock'
  | 'launch_accelerator'
  | 'photo_flash'
  | 'mid_brake'
  | 'track_switch'
  | 'final_brake'
  | 'station_approach'
  | 'unload_platform';

export interface RideEvent {
  id: string;
  eventNumber: number;
  type: RideEventType;
  position: [number, number];
  name: string;
  description: string;
  color: string;
  icon: string;
  zone: number;
  coilEnable: number;
  coilActive: number;
  counterRegister: number;
}

export interface RideZone {
  id: number;
  name: string;
  start: number;
  end: number;
  theme: string;
  color: string;
  coil: number;
  events: RideEvent[];
}

export const RIDE_ZONES: RideZone[] = [
  {
    id: 1,
    name: 'Zone 1 - Loading & Launch',
    start: 0,
    end: 8,
    theme: 'Load Station & Acceleration',
    color: 'blue',
    coil: 5,
    events: [
      {
        id: 'event_1',
        eventNumber: 1,
        type: 'loading_gate',
        position: [0, 2],
        name: 'Loading Platform Gate',
        description: 'Dispatch authorization checkpoint',
        color: 'blue',
        icon: 'shield',
        zone: 1,
        coilEnable: 8,
        coilActive: 17,
        counterRegister: 1044
      },
      {
        id: 'event_2',
        eventNumber: 2,
        type: 'safety_interlock',
        position: [3, 5],
        name: 'Safety Interlock Gate',
        description: 'Multi-sensor safety verification',
        color: 'green',
        icon: 'shield-check',
        zone: 1,
        coilEnable: 9,
        coilActive: 18,
        counterRegister: 1045
      },
      {
        id: 'event_3',
        eventNumber: 3,
        type: 'launch_accelerator',
        position: [6, 8],
        name: 'Launch Accelerator',
        description: 'Speed ramp-up sequence',
        color: 'emerald',
        icon: 'zap',
        zone: 1,
        coilEnable: 10,
        coilActive: 19,
        counterRegister: 1046
      }
    ]
  },
  {
    id: 2,
    name: 'Zone 2 - Main Experience',
    start: 9,
    end: 17,
    theme: 'Primary Attraction Features',
    color: 'purple',
    coil: 6,
    events: [
      {
        id: 'event_4',
        eventNumber: 4,
        type: 'photo_flash',
        position: [9, 11],
        name: 'Photo Flash Point',
        description: 'Onride photo capture with flash',
        color: 'yellow',
        icon: 'camera',
        zone: 2,
        coilEnable: 11,
        coilActive: 20,
        counterRegister: 1047
      },
      {
        id: 'event_5',
        eventNumber: 5,
        type: 'mid_brake',
        position: [12, 14],
        name: 'Mid-Course Brake Check',
        description: 'Speed regulation safety zone',
        color: 'orange',
        icon: 'gauge',
        zone: 2,
        coilEnable: 12,
        coilActive: 21,
        counterRegister: 1048
      },
      {
        id: 'event_6',
        eventNumber: 6,
        type: 'track_switch',
        position: [15, 17],
        name: 'Track Switch Point',
        description: 'Route selection logic',
        color: 'cyan',
        icon: 'git-branch',
        zone: 2,
        coilEnable: 13,
        coilActive: 22,
        counterRegister: 1049
      }
    ]
  },
  {
    id: 3,
    name: 'Zone 3 - Return & Station',
    start: 18,
    end: 26,
    theme: 'Deceleration & Unload',
    color: 'red',
    coil: 7,
    events: [
      {
        id: 'event_7',
        eventNumber: 7,
        type: 'final_brake',
        position: [18, 20],
        name: 'Final Deceleration Zone',
        description: 'Mandatory braking sequence',
        color: 'red',
        icon: 'octagon',
        zone: 3,
        coilEnable: 14,
        coilActive: 23,
        counterRegister: 1050
      },
      {
        id: 'event_8',
        eventNumber: 8,
        type: 'station_approach',
        position: [21, 23],
        name: 'Station Approach',
        description: 'Docking alignment sensors',
        color: 'amber',
        icon: 'target',
        zone: 3,
        coilEnable: 15,
        coilActive: 24,
        counterRegister: 1051
      },
      {
        id: 'event_9',
        eventNumber: 9,
        type: 'unload_platform',
        position: [24, 26],
        name: 'Unload Platform',
        description: 'Cycle completion & guest exit',
        color: 'slate',
        icon: 'door-open',
        zone: 3,
        coilEnable: 16,
        coilActive: 25,
        counterRegister: 1052
      }
    ]
  }
];

export const ALL_EVENTS = RIDE_ZONES.flatMap(zone => zone.events);

export function getEventAtPosition(position: number): RideEvent | null {
  for (const event of ALL_EVENTS) {
    const [start, end] = event.position;
    if (position >= start && position <= end) {
      return event;
    }
  }
  return null;
}

export function getZoneAtPosition(position: number): RideZone | null {
  for (const zone of RIDE_ZONES) {
    if (position >= zone.start && position <= zone.end) {
      return zone;
    }
  }
  return null;
}

export function getActiveEvents(position: number): RideEvent[] {
  return ALL_EVENTS.filter(event => {
    const [start, end] = event.position;
    return position >= start && position <= end;
  });
}
