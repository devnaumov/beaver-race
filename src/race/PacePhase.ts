const smoothStep = (edge0: number, edge1: number, value: number): number => {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

const pulse = (start: number, end: number, feather: number, value: number): number =>
  smoothStep(start, start + feather, value) * (1 - smoothStep(end - feather, end, value))

export abstract class PacePhase {
  abstract multiplier(progress: number): number
}

export class LaunchPhase extends PacePhase {
  constructor(private readonly reaction: number, private readonly acceleration: number) {
    super()
  }

  multiplier(progress: number): number {
    if (progress <= this.reaction) return 0.2
    return 0.2 + 0.8 * smoothStep(this.reaction, this.reaction + this.acceleration, progress)
  }
}

export class CruisePhase extends PacePhase {
  constructor(private readonly cadence: number, private readonly phase: number, private readonly variation: number) {
    super()
  }

  multiplier(progress: number): number {
    return 1 + Math.sin(progress * Math.PI * 2 * this.cadence + this.phase) * this.variation
  }
}

export class SurgePhase extends PacePhase {
  constructor(private readonly start: number, private readonly end: number, private readonly strength: number) {
    super()
  }

  multiplier(progress: number): number {
    return 1 + pulse(this.start, this.end, 0.055, progress) * this.strength
  }
}

export class RecoveryPhase extends PacePhase {
  constructor(private readonly start: number, private readonly end: number, private readonly cost: number) {
    super()
  }

  multiplier(progress: number): number {
    return 1 - pulse(this.start, this.end, 0.065, progress) * this.cost
  }
}

export class EndurancePhase extends PacePhase {
  constructor(private readonly endurance: number) {
    super()
  }

  multiplier(progress: number): number {
    return 1 - smoothStep(0.42, 0.92, progress) * (1 - this.endurance) * 0.34
  }
}

export class FinishKickPhase extends PacePhase {
  constructor(private readonly startsAt: number, private readonly strength: number) {
    super()
  }

  multiplier(progress: number): number {
    return 1 + smoothStep(this.startsAt, 1, progress) * this.strength
  }
}
