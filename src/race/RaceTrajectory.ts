export interface RacerMotion {
  readonly id: string
  readonly progress: number
  readonly speed: number
}

interface TrajectorySample {
  readonly progress: number
  readonly speed: number
}

export class RaceTrajectory {
  constructor(
    readonly racerId: string,
    readonly duration: number,
    private readonly interval: number,
    private readonly samples: ReadonlyArray<TrajectorySample>,
  ) {}

  evaluate(elapsed: number): RacerMotion {
    const time = Math.min(this.duration, Math.max(0, elapsed))
    const lower = Math.min(this.samples.length - 2, Math.floor(time / this.interval))
    const upper = lower + 1
    const first = this.samples[lower]!
    const second = this.samples[upper]!
    const segmentStart = lower * this.interval
    const segmentDuration = upper === this.samples.length - 1 ? this.duration - segmentStart : this.interval
    const t = segmentDuration <= 0 ? 1 : Math.min(1, (time - segmentStart) / segmentDuration)
    const progress = first.progress + (second.progress - first.progress) * t
    const speed = first.speed + (second.speed - first.speed) * t
    return { id: this.racerId, progress, speed }
  }
}

export class RacePlan {
  constructor(
    readonly winnerId: string,
    readonly duration: number,
    readonly trajectories: ReadonlyArray<RaceTrajectory>,
  ) {}

  evaluate(elapsed: number): ReadonlyArray<RacerMotion> {
    return this.trajectories.map((trajectory) => trajectory.evaluate(elapsed))
  }
}
