export const DEFAULT_RACE_DURATION = 20_000
export const PREVIEW_DURATION = 7_000

/** Floating-origin presentation: longer races add scenery, not larger gaps between racers. */
export class RaceCourse {
  readonly startX = -7.65
  readonly length: number
  private readonly launchDistance = 6

  constructor(readonly duration = DEFAULT_RACE_DURATION) {
    this.length = Math.max(60, duration / 1_000 * 3.6)
  }

  travel(leaderProgress: number): number {
    return Math.max(0, this.length * leaderProgress / 100 - this.launchDistance)
  }

  racerX(progress: number, leaderProgress: number): number {
    const leaderX = this.startX + Math.min(this.launchDistance, this.length * leaderProgress / 100)
    return leaderX - Math.max(0, leaderProgress - progress) * 0.154
  }

  finishX(travel: number): number {
    return this.startX + this.length - travel
  }
}
