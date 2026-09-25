import type { Racer } from "../domain"
import {
  CruisePhase,
  EndurancePhase,
  FinishKickPhase,
  LaunchPhase,
  type PacePhase,
  RecoveryPhase,
  SurgePhase,
} from "./PacePhase"
import { RacePlan, RaceTrajectory } from "./RaceTrajectory"
import { SeededRandom } from "./SeededRandom"

const SAMPLE_INTERVAL = 40

type PaceStory = "winner" | "frontRunner" | "challenger" | "surger" | "steady" | "laggard"

interface RaceAssignment {
  readonly finalDistance: number
  readonly story: PaceStory
}

export class RacePlanFactory {
  create(racers: ReadonlyArray<Racer>, winnerId: string, duration: number, seed: number): RacePlan {
    const random = new SeededRandom(seed)
    const assignments = this.assignRaceStories(racers, winnerId, random)
    const trajectories = racers.map((racer) => {
      const racerRandom = new SeededRandom(racer.seed ^ seed)
      const assignment = assignments.get(racer.id)!
      return this.createTrajectory(
        racer.id,
        duration,
        assignment.finalDistance,
        this.createPhases(assignment.story, racerRandom),
      )
    })
    return new RacePlan(winnerId, duration, trajectories)
  }

  private assignRaceStories(
    racers: ReadonlyArray<Racer>,
    winnerId: string,
    random: SeededRandom,
  ): ReadonlyMap<string, RaceAssignment> {
    const assignments = new Map<string, RaceAssignment>([[winnerId, { finalDistance: 100, story: "winner" }]])
    const losers = racers.filter((racer) => racer.id !== winnerId)
    for (let index = losers.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(random.next() * (index + 1))
      ;[losers[index], losers[swapWith]] = [losers[swapWith]!, losers[index]!]
    }

    if (losers.length === 1) {
      assignments.set(losers[0]!.id, { finalDistance: random.between(86, 93), story: "challenger" })
      return assignments
    }

    losers.forEach((racer, index) => {
      if (index === 0) {
        assignments.set(racer.id, { finalDistance: random.between(94, 97), story: "frontRunner" })
      } else if (index === losers.length - 1) {
        assignments.set(racer.id, { finalDistance: random.between(68, 77), story: "laggard" })
      } else {
        const fieldPosition = index / (losers.length - 1)
        assignments.set(racer.id, {
          finalDistance: 91.5 - fieldPosition * 10 + random.between(-1.2, 1.2),
          story: index % 2 === 0 ? "surger" : "steady",
        })
      }
    })
    return assignments
  }

  private createPhases(story: PaceStory, random: SeededRandom): ReadonlyArray<PacePhase> {
    const cruise = new CruisePhase(
      random.between(1.5, 3.4),
      random.between(0, Math.PI * 2),
      random.between(0.055, 0.13),
    )

    switch (story) {
      case "winner":
        return [
          new LaunchPhase(random.between(0.025, 0.055), random.between(0.23, 0.31)),
          cruise,
          new SurgePhase(0.24, 0.4, random.between(0.12, 0.24)),
          new RecoveryPhase(0.42, 0.64, random.between(0.2, 0.32)),
          new SurgePhase(0.63, 0.84, random.between(0.3, 0.48)),
          new EndurancePhase(random.between(0.91, 1)),
          new FinishKickPhase(random.between(0.69, 0.76), random.between(0.48, 0.72)),
        ]
      case "frontRunner":
        return [
          new LaunchPhase(random.between(0.002, 0.014), random.between(0.075, 0.12)),
          cruise,
          new SurgePhase(0.1, 0.36, random.between(0.5, 0.78)),
          new RecoveryPhase(0.4, 0.74, random.between(0.3, 0.44)),
          new SurgePhase(0.72, 0.84, random.between(0.08, 0.18)),
          new EndurancePhase(random.between(0.64, 0.76)),
          new FinishKickPhase(0.88, random.between(0.06, 0.14)),
        ]
      case "laggard":
        return [
          new LaunchPhase(random.between(0.045, 0.08), random.between(0.28, 0.38)),
          cruise,
          new SurgePhase(0.4, 0.58, random.between(0.14, 0.25)),
          new RecoveryPhase(0.18, 0.5, random.between(0.34, 0.5)),
          new SurgePhase(0.68, 0.84, random.between(0.18, 0.3)),
          new EndurancePhase(random.between(0.58, 0.72)),
          new FinishKickPhase(0.8, random.between(0.16, 0.28)),
        ]
      case "surger":
        return [
          new LaunchPhase(random.between(0.01, 0.035), random.between(0.16, 0.23)),
          cruise,
          new SurgePhase(0.22, 0.43, random.between(0.38, 0.62)),
          new RecoveryPhase(0.45, 0.66, random.between(0.2, 0.34)),
          new SurgePhase(0.69, 0.86, random.between(0.28, 0.46)),
          new EndurancePhase(random.between(0.72, 0.9)),
          new FinishKickPhase(0.8, random.between(0.18, 0.34)),
        ]
      case "challenger":
        return [
          new LaunchPhase(random.between(0.008, 0.025), random.between(0.11, 0.18)),
          cruise,
          new SurgePhase(0.15, 0.4, random.between(0.32, 0.52)),
          new RecoveryPhase(0.5, 0.7, random.between(0.16, 0.28)),
          new SurgePhase(0.7, 0.88, random.between(0.22, 0.4)),
          new EndurancePhase(random.between(0.76, 0.94)),
          new FinishKickPhase(0.78, random.between(0.22, 0.38)),
        ]
      case "steady":
        return [
          new LaunchPhase(random.between(0.012, 0.03), random.between(0.14, 0.21)),
          cruise,
          new SurgePhase(0.28, 0.48, random.between(0.16, 0.28)),
          new RecoveryPhase(0.52, 0.7, random.between(0.1, 0.2)),
          new SurgePhase(0.7, 0.87, random.between(0.16, 0.28)),
          new EndurancePhase(random.between(0.84, 0.98)),
          new FinishKickPhase(0.8, random.between(0.16, 0.3)),
        ]
    }
  }

  private createTrajectory(
    racerId: string,
    duration: number,
    finalDistance: number,
    phases: ReadonlyArray<PacePhase>,
  ): RaceTrajectory {
    const steps = Math.ceil(duration / SAMPLE_INTERVAL)
    const rawSpeeds: Array<number> = []
    const rawDistances: Array<number> = [0]
    let total = 0

    for (let index = 0; index <= steps; index += 1) {
      const time = Math.min(duration, index * SAMPLE_INTERVAL)
      const ratio = time / duration
      const speed = phases.reduce((value, phase) => value * phase.multiplier(ratio), 1)
      rawSpeeds.push(Math.max(0.16, speed))
      if (index > 0) {
        const previousTime = Math.min(duration, (index - 1) * SAMPLE_INTERVAL)
        const deltaSeconds = (time - previousTime) / 1_000
        total += ((rawSpeeds[index - 1]! + rawSpeeds[index]!) / 2) * deltaSeconds
        rawDistances.push(total)
      }
    }

    const samples = rawDistances.map((distance, index) => ({
      progress: (distance / total) * finalDistance,
      speed: (rawSpeeds[index]! / total) * finalDistance,
    }))
    return new RaceTrajectory(racerId, duration, SAMPLE_INTERVAL, samples)
  }
}
