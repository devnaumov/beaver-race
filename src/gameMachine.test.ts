import { createActor } from "xstate"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { gameMachine } from "./gameMachine"

describe("Game race lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "performance"] })
    vi.stubGlobal("window", globalThis)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("runs for exactly 20 seconds after the countdown, then allows a replay", () => {
    const actor = createActor(gameMachine).start()
    expect(actor.getSnapshot().context.duration).toBe(20_000)
    actor.send({ type: "START" })
    expect(actor.getSnapshot().value).toBe("preview")
    expect(actor.getSnapshot().context.racePlan?.duration).toBe(20_000)
    vi.advanceTimersByTime(7_000)
    expect(actor.getSnapshot().value).toBe("countdown")
    vi.advanceTimersByTime(3_000)
    expect(actor.getSnapshot().value).toBe("racing")
    vi.advanceTimersByTime(19_950)
    expect(actor.getSnapshot().value).toBe("racing")
    expect(actor.getSnapshot().context.elapsed).toBe(19_950)
    vi.advanceTimersByTime(50)
    expect(actor.getSnapshot().value).toBe("finishing")
    expect(actor.getSnapshot().context.elapsed).toBe(20_000)
    const finish = actor.getSnapshot().context
    expect(finish.racers.find((racer) => racer.id === finish.winnerId)?.progress).toBeCloseTo(100)
    vi.advanceTimersByTime(2_800)
    expect(actor.getSnapshot().value).toBe("finished")
    actor.send({ type: "RESET" })
    expect(actor.getSnapshot().value).toBe("lobby")
    expect(actor.getSnapshot().context.racers.every((racer) => racer.progress === 0)).toBe(true)
    expect(actor.getSnapshot().context.duration).toBe(20_000)
    actor.send({ type: "START" })
    expect(actor.getSnapshot().context.raceNumber).toBe(2)
    actor.stop()
  })

  it("does not start without at least two racers", () => {
    const actor = createActor(gameMachine, { input: { racerNames: ["Solo"] } }).start()
    actor.send({ type: "START" })
    expect(actor.getSnapshot().value).toBe("lobby")
    expect(actor.getSnapshot().context.error).not.toBeNull()
    actor.stop()
  })
})
