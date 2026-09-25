import { Atom } from "effect/unstable/reactivity"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { createActor } from "xstate"
import { gameMachine, type GameEvent } from "./gameMachine"

export const gameActor = createActor(gameMachine)
export const gameRegistry = AtomRegistry.make({ defaultIdleTTL: Number.POSITIVE_INFINITY })
export const gameAtom = Atom.make(gameActor.getSnapshot())

gameActor.subscribe((snapshot) => gameRegistry.set(gameAtom, snapshot))
gameActor.start()

export const sendGameEvent = (event: GameEvent): void => gameActor.send(event)
