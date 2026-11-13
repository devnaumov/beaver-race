import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import { gameMachine } from "./gameMachine"

describe("race winner selection", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("window", globalThis)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it.each([
    "Руслан", "РУСЛАН", "  руслан  ", "Русланчик", "Русланушка", "Русланя",
    "Русик", "Руся", "Руська", "Русенька", "Русюня", "Руслик",
    "Ruslan", "RUSLAN", "Russlan", "Rouslan", "Ruslanchik", "Rusik", "Rusya", "Rusia",
    "Бобр Руслан", "Руслан-турбо", "Ruslan123", "Ｒｕｓｌａｎ", "Rúslan", "Ру\u200bслан",
  ])("gives %s a much lower chance than another racer", (name) => {
    const actor = createActor(gameMachine, { input: { racerNames: [name, "Маша"] } }).start()
    try {
      // An equal-weight draw would select the first racer here.
      vi.spyOn(Math, "random").mockReturnValueOnce(0.001)
      actor.send({ type: "START" })
      const { racers, winnerId, racePlan } = actor.getSnapshot().context
      expect(actor.getSnapshot().matches("countdown")).toBe(true)
      expect(winnerId).toBe(racers[1]!.id)
      const finish = racePlan!.evaluate(racePlan!.duration)
      expect(finish.find((motion) => motion.id === racers[0]!.id)!.progress).toBeLessThan(100)
      expect(finish.find((motion) => motion.id === winnerId)!.progress).toBeCloseTo(100, 6)
    } finally {
      actor.stop()
    }
  })

  it.each([
    [0, 0], [1.5 / 3003, 1], [0.001, 2], [1002.5 / 3003, 3], [0.5, 4], [0.999999, 5],
  ])("uses weighted chances in a mixed field for random draw %s", (draw, winnerIndex) => {
    const actor = createActor(gameMachine, {
      input: { racerNames: ["Руслан", "Руслана", "Маша", "Русик", "Русский бобр", "Бруслан"] },
    }).start()
    try {
      vi.spyOn(Math, "random").mockReturnValueOnce(draw)
      actor.send({ type: "START" })
      const { racers, winnerId } = actor.getSnapshot().context
      expect(winnerId).toBe(racers[winnerIndex]!.id)
    } finally {
      actor.stop()
    }
  })

  it.each([[0, 0], [0.000998, 0], [0.0009991, 1], [0.999999, 1]])(
    "lets Ruslan win only in the tiny weighted interval for random draw %s",
    (draw, winnerIndex) => {
      const actor = createActor(gameMachine, { input: { racerNames: ["Руслан", "Маша"] } }).start()
      try {
        vi.spyOn(Math, "random").mockReturnValueOnce(draw)
        actor.send({ type: "START" })
        const { racers, winnerId, racePlan } = actor.getSnapshot().context
        expect(winnerId).toBe(racers[winnerIndex]!.id)
        const finish = racePlan!.evaluate(racePlan!.duration)
        expect(finish.find((motion) => motion.id === winnerId)!.progress).toBeCloseTo(100, 6)
        expect(finish.filter((motion) => motion.id !== winnerId).every((motion) => motion.progress < 100)).toBe(true)
      } finally {
        actor.stop()
      }
    },
  )

  it.each([[0, 0], [1 / 3, 1], [0.5, 1], [2 / 3, 2], [0.999999, 2]])(
    "starts an all-Ruslan race with equal chances for random draw %s",
    (draw, winnerIndex) => {
      const actor = createActor(gameMachine, { input: { racerNames: ["Руслан", "Rusik", "Руся"] } }).start()
      try {
        vi.spyOn(Math, "random").mockReturnValueOnce(draw)
        actor.send({ type: "START" })
        const snapshot = actor.getSnapshot()
        expect(snapshot.matches("countdown")).toBe(true)
        expect(snapshot.context.error).toBeNull()
        expect(snapshot.context.winnerId).toBe(snapshot.context.racers[winnerIndex]!.id)
        expect(snapshot.context.raceNumber).toBe(1)
      } finally {
        actor.stop()
      }
    },
  )

  it.each([[0, 0], [1 / 3, 1], [2 / 3, 2], [0.999999, 2]])("keeps equal chances for ordinary racers at draw %s", (draw, winnerIndex) => {
    const actor = createActor(gameMachine, { input: { racerNames: ["Алекс", "Маша", "Дима"] } }).start()
    try {
      vi.spyOn(Math, "random").mockReturnValueOnce(draw)
      actor.send({ type: "START" })
      const { racers, winnerId } = actor.getSnapshot().context
      expect(winnerId).toBe(racers[winnerIndex]!.id)
    } finally {
      actor.stop()
    }
  })

  it("still requires at least two racers", () => {
    const actor = createActor(gameMachine, { input: { racerNames: ["Маша"] } }).start()
    try {
      actor.send({ type: "START" })
      expect(actor.getSnapshot().matches("lobby")).toBe(true)
      expect(actor.getSnapshot().context.error).toBe("Добавьте хотя бы двух участников")
    } finally {
      actor.stop()
    }
  })
})
