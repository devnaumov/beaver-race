import { describe, expect, it } from "vitest"
import { createRacer } from "../domain"
import { RacePlanFactory } from "./RacePlanFactory"

describe("RacePlanFactory", () => {
  const racers = [createRacer("Алекс", 0.1), createRacer("Маша", 0.2), createRacer("Дима", 0.3)]
  const winner = racers[1]!
  const plan = new RacePlanFactory().create(racers, winner.id, 10_000, 42)

  it("keeps every racer moving forward", () => {
    let previous = new Map(racers.map((racer) => [racer.id, 0]))
    for (let elapsed = 80; elapsed <= plan.duration; elapsed += 80) {
      for (const motion of plan.evaluate(elapsed)) {
        expect(motion.progress).toBeGreaterThan(previous.get(motion.id)!)
        expect(motion.speed).toBeGreaterThan(0)
        previous.set(motion.id, motion.progress)
      }
    }
  })

  it("finishes with the selected winner without snapping competitors", () => {
    const finish = plan.evaluate(plan.duration)
    expect(finish.find((motion) => motion.id === winner.id)?.progress).toBeCloseTo(100, 6)
    expect(finish.filter((motion) => motion.id !== winner.id).every((motion) => motion.progress < 100)).toBe(true)
  })

  it("creates visible breakaways and a real laggard", () => {
    for (const ratio of [0.35, 0.6, 0.82]) {
      const field = plan.evaluate(plan.duration * ratio).map((motion) => motion.progress)
      expect(Math.max(...field) - Math.min(...field)).toBeGreaterThan(6)
    }

    const finish = plan.evaluate(plan.duration).map((motion) => motion.progress).sort((a, b) => b - a)
    expect(finish[0]).toBeCloseTo(100, 6)
    expect(finish[1]).toBeGreaterThanOrEqual(94)
    expect(finish[1]).toBeLessThan(97)
    expect(finish.at(-1)).toBeLessThan(78)
    expect(finish[0]! - finish.at(-1)!).toBeGreaterThan(22)
  })

  it("is independent from render cadence", () => {
    const slow = plan.evaluate(7_333)
    const fast = plan.evaluate(7_333)
    expect(slow).toEqual(fast)
  })
})
