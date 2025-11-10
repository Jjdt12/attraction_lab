export interface ProcessVariables {
  motorCurrentAmps: number;
  hydraulicPressurePsi: number;
  bearingTempCelsius: number;
  brakeWearPercent: number;
  vibrationLevel: number;
  safetyViolationCount: number;
}

export class ProcessSimulator {
  private variables: ProcessVariables;
  private lastUpdateTime: number;
  private tempAccumulator: number;

  constructor() {
    this.variables = {
      motorCurrentAmps: 0,
      hydraulicPressurePsi: 1200,
      bearingTempCelsius: 25,
      brakeWearPercent: 0,
      vibrationLevel: 10,
      safetyViolationCount: 0
    };
    this.lastUpdateTime = Date.now();
    this.tempAccumulator = 0;
  }

  update(
    motorRunning: boolean,
    currentSpeed: number,
    cycleCount: number,
    carPosition: number = 0,
    brakeEngaged: boolean = false,
    runtimeHours: number = 0
  ): ProcessVariables {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    if (motorRunning && currentSpeed > 0) {
      // Position-based load simulation (zone effects)
      let positionLoadFactor = 0;
      if (carPosition >= 5 && carPosition <= 10) {
        // Zone 1: Launch zone (high load)
        positionLoadFactor = 15;
      } else if (carPosition >= 15 && carPosition <= 20) {
        // Zone 2: Show effects zone (medium load)
        positionLoadFactor = 10;
      } else if (carPosition >= 22 && carPosition <= 26) {
        // Zone 3: Finale zone (high load)
        positionLoadFactor = 12;
      }

      const speedLoadFactor = (currentSpeed * 80) / 100;
      this.variables.motorCurrentAmps = Math.round(50 + speedLoadFactor + positionLoadFactor + (Math.random() * 5 - 2.5));

      // Temperature increases faster at high speeds or high loads
      const heatRate = currentSpeed > 80 ? 3 : 5;
      this.tempAccumulator += deltaTime;
      if (this.tempAccumulator >= heatRate) {
        this.tempAccumulator = 0;
        const maxTemp = currentSpeed > 80 ? 95 : 85;
        if (this.variables.bearingTempCelsius < maxTemp) {
          this.variables.bearingTempCelsius += 1;
        }
      }

      this.variables.vibrationLevel = Math.round(10 + (currentSpeed / 10) + (Math.random() * 3 - 1.5));

      if (currentSpeed > 80) {
        this.variables.vibrationLevel += 5;
      }

      // Brake engaged while moving creates extra vibration and heat
      if (brakeEngaged) {
        this.variables.vibrationLevel += 8;
        this.variables.bearingTempCelsius += 0.5;
      }
    } else {
      this.variables.motorCurrentAmps = 0;

      // Cooldown - faster if motor has been off longer
      const cooldownRate = brakeEngaged ? 15 : 10;
      this.tempAccumulator += deltaTime;
      if (this.tempAccumulator >= cooldownRate) {
        this.tempAccumulator = 0;
        if (this.variables.bearingTempCelsius > 25) {
          this.variables.bearingTempCelsius -= 1;
        }
      }

      this.variables.vibrationLevel = Math.round(10 + (Math.random() * 2 - 1));
    }

    // Brake wear based on actual cycle count
    if (cycleCount > 0) {
      this.variables.brakeWearPercent = Math.min(100, Math.round(cycleCount / 10));
    }

    // Runtime-based degradation
    const runtimeDegradation = Math.min(10, runtimeHours / 100);
    this.variables.vibrationLevel += runtimeDegradation;

    // Hydraulic pressure affected by temperature and runtime
    let basePressure = 1200;
    if (this.variables.bearingTempCelsius > 80) {
      basePressure -= 50;
    }
    if (runtimeHours > 500) {
      basePressure -= Math.min(100, (runtimeHours - 500) / 10);
    }
    this.variables.hydraulicPressurePsi = basePressure + Math.round(Math.random() * 50 - 25);

    this.variables.motorCurrentAmps = Math.max(0, this.variables.motorCurrentAmps);
    this.variables.hydraulicPressurePsi = Math.max(0, this.variables.hydraulicPressurePsi);
    this.variables.bearingTempCelsius = Math.max(25, Math.min(120, this.variables.bearingTempCelsius));
    this.variables.vibrationLevel = Math.max(0, this.variables.vibrationLevel);

    return { ...this.variables };
  }

  incrementSafetyViolations(): void {
    this.variables.safetyViolationCount += 1;
  }

  getVariables(): ProcessVariables {
    return { ...this.variables };
  }

  reset(): void {
    this.variables = {
      motorCurrentAmps: 0,
      hydraulicPressurePsi: 1200,
      bearingTempCelsius: 25,
      brakeWearPercent: 0,
      vibrationLevel: 10,
      safetyViolationCount: 0
    };
    this.tempAccumulator = 0;
  }

  setBrakeWear(percent: number): void {
    this.variables.brakeWearPercent = Math.max(0, Math.min(100, percent));
  }

  getHealthPercentage(): number {
    const tempScore = Math.max(0, 100 - (this.variables.bearingTempCelsius - 25));
    const brakeScore = 100 - this.variables.brakeWearPercent;
    const vibrationScore = Math.max(0, 100 - (this.variables.vibrationLevel * 2));
    const pressureScore = Math.max(0, (this.variables.hydraulicPressurePsi / 1200) * 100);

    return Math.round((tempScore + brakeScore + vibrationScore + pressureScore) / 4);
  }

  getWarnings(): string[] {
    const warnings: string[] = [];

    if (this.variables.bearingTempCelsius > 70) {
      warnings.push('High bearing temperature');
    }
    if (this.variables.brakeWearPercent > 80) {
      warnings.push('Brake wear critical');
    }
    if (this.variables.vibrationLevel > 30) {
      warnings.push('Excessive vibration detected');
    }
    if (this.variables.hydraulicPressurePsi < 1000) {
      warnings.push('Low hydraulic pressure');
    }
    if (this.variables.safetyViolationCount > 5) {
      warnings.push('Multiple safety violations');
    }

    return warnings;
  }
}
