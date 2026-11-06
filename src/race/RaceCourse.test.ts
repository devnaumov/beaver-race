import { describe, expect, it } from "vitest"
import { createRacer } from "../domain"
import { DEFAULT_RACE_DURATION, RaceCourse } from "./RaceCourse"
import { RacePlanFactory } from "./RacePlanFactory"

describe("RaceCourse", () => {
  it("defaults to a 20-second race with the finish beyond the opening shot", () => {
    const course = new RaceCourse()
    expect(course.duration).toBe(20_000)
    expect(course.duration).toBe(DEFAULT_RACE_DURATION)
    expect(course.racerX(0, 0)).toBe(course.startX)
    expect(course.travel(0)).toBe(0)
    expect(course.finishX(0) - course.startX).toBeGreaterThan(60)
  })

  it.each([20_000, 60_000, 120_000, 300_000])("keeps the field in a tracking shot for a %ims race", (duration) => {
    const course = new RaceCourse(duration)
    const racers = Array.from({ length: 12 }, (_, index) => createRacer(`Racer ${index}`, index / 12))
    const plan = new RacePlanFactory().create(racers, racers[0]!.id, duration, 42)
    let previousTravel = 0
    for (let time = 0; time <= duration; time += 100) {
      const motions = plan.evaluate(time)
      const front = Math.max(...motions.map((motion) => motion.progress))
      const positions = motions.map((motion) => course.racerX(motion.progress, front))
      const travel = course.travel(front)
      expect(travel).toBeGreaterThanOrEqual(previousTravel)
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(12)
      expect(Math.max(...positions)).toBeLessThanOrEqual(-1.65 + 1e-9)
      if (time < duration * 0.6) expect(course.finishX(travel)).toBeGreaterThan(22)
      previousTravel = travel
    }
    expect(course.racerX(100, 100)).toBeCloseTo(course.finishX(course.travel(100)))
  })

  it("adds route length, not slower scenery or wider gaps, for longer races", () => {
    const short = new RaceCourse(20_000)
    const long = new RaceCourse(120_000)
    expect(long.length / short.length).toBe(6)
    expect(long.racerX(60, 70)).toBe(short.racerX(60, 70))
  })
})
