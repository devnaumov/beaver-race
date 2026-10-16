import { assign, fromCallback, setup } from "xstate"
import { createRacer, rerollRacer, type Racer } from "./domain"
import { RacePlanFactory } from "./race/RacePlanFactory"
import type { RacerMotion } from "./race/RaceTrajectory"
import { RacePlan } from "./race/RaceTrajectory"

export interface GameContext {
  readonly racers: ReadonlyArray<Racer>
  readonly winnerId: string | null
  readonly countdown: number
  readonly elapsed: number
  readonly duration: number
  readonly error: string | null
  readonly raceNumber: number
  readonly racePlan: RacePlan | null
}

export type GameEvent =
  | { readonly type: "ADD_RACER"; readonly name: string }
  | { readonly type: "REMOVE_RACER"; readonly id: string }
  | { readonly type: "REROLL"; readonly id?: string }
  | { readonly type: "START" }
  | { readonly type: "COUNTDOWN_TICK" }
  | { readonly type: "RACE_FRAME"; readonly elapsed: number; readonly motions: ReadonlyArray<RacerMotion> }
  | { readonly type: "RACE_COMPLETE"; readonly elapsed: number; readonly motions: ReadonlyArray<RacerMotion> }
  | { readonly type: "RESET" }

const measuredCountdownActor = fromCallback<GameEvent>(({ sendBack }) => {
  const timer = window.setInterval(() => sendBack({ type: "COUNTDOWN_TICK" }), 1_000)
  return () => window.clearInterval(timer)
})

const raceSimulationActor = fromCallback<GameEvent, RacePlan>(({ input, sendBack }) => {
  const startedAt = performance.now()
  const emitFrame = () => {
    const elapsed = Math.min(input.duration, performance.now() - startedAt)
    const motions = input.evaluate(elapsed)
    if (elapsed >= input.duration) {
      sendBack({ type: "RACE_COMPLETE", elapsed, motions })
      window.clearInterval(timer)
      return
    }
    sendBack({ type: "RACE_FRAME", elapsed, motions })
  }
  const timer = window.setInterval(emitFrame, 50)
  emitFrame()
  return () => window.clearInterval(timer)
})

const applyMotions = (racers: ReadonlyArray<Racer>, motions: ReadonlyArray<RacerMotion>): ReadonlyArray<Racer> => {
  const byId = new Map(motions.map((motion) => [motion.id, motion]))
  return racers.map((racer) => {
    const motion = byId.get(racer.id)
    return motion ? { ...racer, progress: motion.progress, speed: motion.speed } : racer
  })
}

const raceSetup = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
    input: {} as { readonly racerNames?: ReadonlyArray<string> } | void,
  },
  actors: {
    measuredCountdownActor,
    raceSimulationActor,
  },
  guards: {
    hasEnoughRacers: ({ context }) => context.racers.length >= 2,
    countdownComplete: ({ context }) => context.countdown <= 1,
  },
  actions: {
    addRacer: assign(({ context, event }) => {
      if (event.type !== "ADD_RACER") return context
      const name = event.name.trim().replace(/\s+/g, " ")
      if (name.length < 2) return { ...context, error: "Имя должно быть длиннее одной буквы" }
      if (name.length > 22) return { ...context, error: "Максимум 22 символа" }
      if (context.racers.length >= 12) return { ...context, error: "На стадионе только 12 дорожек" }
      if (context.racers.some((racer) => racer.name.toLowerCase() === name.toLowerCase())) {
        return { ...context, error: "Такой бобр уже готовится к старту" }
      }
      return { ...context, racers: [...context.racers, createRacer(name)], error: null }
    }),
    removeRacer: assign(({ context, event }) =>
      event.type === "REMOVE_RACER"
        ? { ...context, racers: context.racers.filter((racer) => racer.id !== event.id), error: null }
        : context,
    ),
    reroll: assign(({ context, event }) =>
      event.type === "REROLL"
        ? {
            ...context,
            racers: context.racers.map((racer) => (!event.id || racer.id === event.id ? rerollRacer(racer) : racer)),
          }
        : context,
    ),
    prepareRace: assign(({ context }) => {
      const winner = context.racers[Math.floor(Math.random() * context.racers.length)]!
      const duration = 9_200 + Math.floor(Math.random() * 2_600)
      const seed = Math.floor(Math.random() * 0xffffffff)
      const racers = context.racers.map((racer) => ({ ...racer, progress: 0, speed: 0 }))
      const racePlan = new RacePlanFactory().create(racers, winner.id, duration, seed)
      return {
        ...context,
        racers,
        racePlan,
        winnerId: winner.id,
        countdown: 3,
        elapsed: 0,
        duration,
        error: null,
        raceNumber: context.raceNumber + 1,
      }
    }),
    decrementCountdown: assign(({ context }) => ({ ...context, countdown: context.countdown - 1 })),
    updateRace: assign(({ context, event }) =>
      event.type === "RACE_FRAME" || event.type === "RACE_COMPLETE"
        ? { ...context, elapsed: event.elapsed, racers: applyMotions(context.racers, event.motions) }
        : context,
    ),
    resetRace: assign(({ context }) => ({
      ...context,
      racers: context.racers.map((racer) => ({ ...racer, progress: 0, speed: 0 })),
      winnerId: null,
      racePlan: null,
      countdown: 3,
      elapsed: 0,
      error: null,
    })),
    showStartError: assign(({ context }) => ({ ...context, error: "Добавьте хотя бы двух участников" })),
  },
})

export const gameMachine = raceSetup.createMachine({
  id: "beaver-race",
  initial: "lobby",
  context: ({ input }) => ({
    racers: (input && input.racerNames?.map((name) => createRacer(name))) ?? [createRacer("Алекс"), createRacer("Маша"), createRacer("Дима")],
    winnerId: null,
    countdown: 3,
    elapsed: 0,
    duration: 10_000,
    error: null,
    raceNumber: 0,
    racePlan: null,
  }),
  states: {
    lobby: {
      on: {
        ADD_RACER: { actions: "addRacer" },
        REMOVE_RACER: { actions: "removeRacer" },
        REROLL: { actions: "reroll" },
        START: [
          { guard: "hasEnoughRacers", target: "countdown", actions: "prepareRace" },
          { actions: "showStartError" },
        ],
      },
    },
    countdown: {
      invoke: { src: "measuredCountdownActor" },
      on: {
        COUNTDOWN_TICK: [
          { guard: "countdownComplete", target: "racing" },
          { actions: "decrementCountdown" },
        ],
      },
    },
    racing: {
      invoke: {
        src: "raceSimulationActor",
        input: ({ context }) => context.racePlan!,
      },
      on: {
        RACE_FRAME: { actions: "updateRace" },
        RACE_COMPLETE: { target: "finishing", actions: "updateRace" },
      },
    },
    finishing: {
      after: { 1600: "finished" },
    },
    finished: {
      on: { RESET: { target: "lobby", actions: "resetRace" } },
    },
  },
})
