import { Atom } from "effect/unstable/reactivity"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { createActor } from "xstate"
import { gameMachine, type GameEvent } from "./gameMachine"

const racerNamesStorageKey = "beaver-race:racer-names"

const loadRacerNames = (): ReadonlyArray<string> | undefined => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(racerNamesStorageKey) ?? "null")
    if (!Array.isArray(stored) || stored.length > 12) return undefined
    if (!stored.every((name): name is string =>
      typeof name === "string" && name.length >= 2 && name.length <= 22 && name === name.trim().replace(/\s+/g, " "),
    )) return undefined
    if (new Set(stored.map((name) => name.toLowerCase())).size !== stored.length) return undefined
    return stored
  } catch {
    return undefined
  }
}

export const gameActor = createActor(gameMachine, { input: { racerNames: loadRacerNames() } })
export const gameRegistry = AtomRegistry.make({ defaultIdleTTL: Number.POSITIVE_INFINITY })
export const gameAtom = Atom.make(gameActor.getSnapshot())

let savedNames: string | undefined

gameActor.subscribe((snapshot) => {
  gameRegistry.set(gameAtom, snapshot)
  const names = JSON.stringify(snapshot.context.racers.map((racer) => racer.name))
  if (names === savedNames) return
  savedNames = names
  try {
    localStorage.setItem(racerNamesStorageKey, names)
  } catch {
    // Keep the game usable when browser storage is unavailable.
  }
})
gameActor.start()

export const sendGameEvent = (event: GameEvent): void => gameActor.send(event)
