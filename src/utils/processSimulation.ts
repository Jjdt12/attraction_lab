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

  update(motorRunning: boolean, currentSpeed: number, cycleCount: number): ProcessVariables {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    if (motorRunning && currentSpeed > 0) {
      const loadFactor = (currentSpeed * 80) / 100;
      this.variables.motorCurrentAmps = Math.round(50 + loadFactor + (Math.random() * 5 - 2.5));

      this.tempAccumulator += deltaTime;
      if (this.tempAccumulator >= 5) {
        this.tempAccumulator = 0;
        if (this.variables.bearingTempCelsius < 85) {
          this.variables.bearingTempCelsius += 1;
        }
      }

      this.variables.vibrationLevel = Math.round(10 + (currentSpeed / 10) + (Math.random() * 3 - 1.5));

      if (currentSpeed > 80) {
        this.variables.vibrationLevel += 5;
      }
    } else {
      this.variables.motorCurrentAmps = 0;

      this.tempAccumulator += deltaTime;
      if (this.tempAccumulator >= 10) {
        this.tempAccumulator = 0;
        if (this.variables.bearingTempCelsius > 25) {
          this.variables.bearingTempCelsius -= 1;
        }
      }

      this.variables.vibrationLevel = Math.round(10 + (Math.random() * 2 - 1));
    }

    if (cycleCount > 0 && cycleCount % 10 === 0) {
      this.variables.brakeWearPercent = Math.min(100, Math.round(cycleCount / 10));
    }

    this.variables.hydraulicPressurePsi = 1200 + Math.round(Math.random() * 50 - 25);

    if (this.variables.bearingTempCelsius > 80) {
      this.variables.hydraulicPressurePsi -= 50;
    }

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
