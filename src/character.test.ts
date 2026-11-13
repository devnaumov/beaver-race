import { describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { createRacer } from "./domain"
import { emptyEquipment, equipmentCatalog, isEquipment } from "./equipment"
import { parseCustomization, restoreCharacters, serializeCharacters } from "./character"
import { gameMachine } from "./gameMachine"

describe("character customization", () => {
  it("saves equipment without changing identity, seed, progress or race odds", () => {
    const racer = createRacer("Holly", 0.3)
    const actor = createActor(gameMachine, { input: { racers: [racer] } }).start()
    const customization = { ...racer, fur: "#123456", equipment: { ...emptyEquipment(), hand: "sword" as const, offhand: "shield" as const } }
    actor.send({ type: "CUSTOMIZE_RACER", id: racer.id, customization })
    const updated = actor.getSnapshot().context.racers[0]!
    expect(updated).toMatchObject({ id: racer.id, name: racer.name, seed: racer.seed, progress: racer.progress, speed: racer.speed, fur: "#123456", equipment: customization.equipment })
    expect(racer.fur).not.toBe(updated.fur)
    actor.stop()
  })

  it("blocks customization after leaving the lobby", () => {
    const actor = createActor(gameMachine).start()
    const racer = actor.getSnapshot().context.racers[0]!
    actor.send({ type: "START" })
    actor.send({ type: "CUSTOMIZE_RACER", id: racer.id, customization: { ...racer, fur: "#123456" } })
    expect(actor.getSnapshot().context.racers[0]!.fur).toBe(racer.fur)
    actor.stop()
  })

  it("round-trips all visual settings and resets transient race state", () => {
    const racer = { ...createRacer("Holly", 0.1), progress: 83, speed: 5, equipment: { ...emptyEquipment(), head: "santa" as const, hand: "ice-sword" as const, offhand: "ice-shield" as const, back: "sack" as const } }
    const restored = restoreCharacters(serializeCharacters([racer]))!
    expect(restored).toHaveLength(1)
    expect(restored[0]).toMatchObject({ name: racer.name, seed: racer.seed, appearance: racer.appearance, fur: racer.fur, accent: racer.accent, equipment: racer.equipment, sticker: racer.sticker, progress: 0, speed: 0 })
    expect(restoreCharacters(serializeCharacters([]))).toEqual([])
  })

  it("rejects corrupt storage, unknown gear, wrong slots and invalid geometry values", () => {
    const racer = createRacer("Holly", 0.1)
    for (const invalid of [null, {}, { ...racer, fur: "url(x)" }, { ...racer, equipment: { ...emptyEquipment(), head: "sword" } }, { ...racer, appearance: { ...racer.appearance, headScale: [Infinity, 1, 1] } }, { ...racer, appearance: { ...racer.appearance, earSize: -1 } }]) {
      expect(parseCustomization(invalid)).toBeNull()
    }
    for (const invalid of ["garbage", "{}", '{"version":2,"characters":[]}', serializeCharacters([racer, racer])]) expect(restoreCharacters(invalid)).toBeUndefined()
    expect(isEquipment({ ...emptyEquipment(), hand: "not-real" })).toBe(false)
  })

  it("accepts every generated appearance and every inventory entry in its correct slot", () => {
    for (let i = 0; i < 200; i++) expect(parseCustomization(createRacer(`Racer ${i}`, i / 200))).not.toBeNull()
    for (const item of equipmentCatalog) expect(isEquipment({ ...emptyEquipment(), [item.slot]: item.id })).toBe(true)
  })
})
