import * as THREE from "three"
import { describe, expect, it, vi } from "vitest"
import { costumeNames } from "../../christmas"
import { accessories, createRacer } from "../../domain"
import { AccessoryFactory } from "../beaver/Accessories"
import { christmasStar, festiveHat, giftBox } from "../core/ChristmasMeshes"
import { ForestBackdrop } from "./ForestBackdrop"
import { Snowfall } from "./Snowfall"
import { TrackEnvironment } from "./TrackEnvironment"

describe("Christmas theme", () => {
  it.each(accessories)("provides a named, finite costume for %s", (accessory) => {
    expect(costumeNames[accessory]).toBeTruthy()
    const costume = new AccessoryFactory().create({ ...createRacer("Holly", 0.24), accessory })
    expect(costume.object.children.length).toBeGreaterThan(0)
    const bounds = new THREE.Box3().setFromObject(costume.object)
    expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true)
    costume.dispose()
  })

  it("builds reusable presents, hats and tree stars", () => {
    for (const object of [giftBox(), festiveHat(), christmasStar()]) {
      const bounds = new THREE.Box3().setFromObject(object)
      expect(bounds.isEmpty()).toBe(false)
      expect(bounds.getSize(new THREE.Vector3()).length()).toBeGreaterThan(0)
    }
  })

  it("keeps gift decorations outside the lanes and the finish tape working", () => {
    const track = new TrackEnvironment()
    const batches = track.object.children.filter((child) => child.name === "track-gifts") as THREE.InstancedMesh[]
    expect(batches).toHaveLength(8)
    const matrix = new THREE.Matrix4()
    for (const batch of batches) {
      expect(batch.count).toBe(36)
      for (let index = 0; index < batch.count; index += 1) {
        batch.getMatrixAt(index, matrix)
        expect(Math.abs(matrix.elements[14]!)).toBeGreaterThan(3.32)
      }
    }
    expect(track.finish.visible).toBe(false)
    track.setTravel(50, 5, true)
    expect(track.finish.visible).toBe(true)
    expect(track.finish.position.x).toBe(5)
    expect(track.isFinishTapeTorn).toBe(false)
    track.tearFinishTape()
    track.update(0.1)
    expect(track.isFinishTapeTorn).toBe(true)
    track.armFinishTape(1.2)
    expect(track.isFinishTapeTorn).toBe(false)
    track.dispose()
  })

  it("keeps the forest behind the river", () => {
    const forest = new ForestBackdrop()
    expect(forest.object.children.every((child) => child.position.z < -8)).toBe(true)
    forest.dispose()
  })

  it("animates snowfall in one instanced mesh and honors reduced motion", () => {
    const snow = new Snowfall()
    const flakes = snow.object.children[0] as THREE.InstancedMesh
    const initial = new THREE.Matrix4()
    const animated = new THREE.Matrix4()
    flakes.getMatrixAt(0, initial)
    snow.update(0.5)
    flakes.getMatrixAt(0, animated)
    expect(animated.elements).not.toEqual(initial.elements)
    expect(flakes.count).toBe(220)

    snow.reducedMotion = true
    snow.update(0.5)
    expect(flakes.visible).toBe(false)
    const frozen = new THREE.Matrix4()
    flakes.getMatrixAt(0, frozen)
    expect(frozen.elements).toEqual(animated.elements)

    snow.reducedMotion = false
    snow.update(0.5)
    expect(flakes.visible).toBe(true)
    const dispose = vi.spyOn(flakes.geometry, "dispose")
    snow.dispose()
    expect(dispose).toHaveBeenCalledOnce()
  })
})
