import * as THREE from "three"
import { describe, expect, it, vi } from "vitest"
import type { RacePhase } from "../gameMachine"
import { RaceCourse } from "../race/RaceCourse"
import { BeaverRaceScene } from "./BeaverRaceScene"

vi.mock("../store", () => ({ gameActor: {} }))

// Exercise the scene's camera without creating a WebGL renderer.
const overviewCamera = (phase: RacePhase, compact: boolean, racerCount: number) => {
  const scene = Object.create(BeaverRaceScene.prototype) as BeaverRaceScene
  const camera = new THREE.PerspectiveCamera(38, compact ? 0.7 : 1.7, 0.1, 100)
  const racers = new Map(Array.from({ length: racerCount }, (_, index) => {
    const object = new THREE.Group()
    object.position.x = new RaceCourse().startX
    return [String(index), { object }] as const
  }))
  Object.assign(scene, {
    phase, compact, racers, camera,
    cameraTarget: new THREE.Vector3(),
    cameraInitialized: false,
  })
  scene["updateCamera"](0)
  camera.updateMatrixWorld()
  return camera
}

describe("overview camera", () => {
  it.each([false, true])("centers the background beavers in the lobby (compact: %s)", (compact) => {
    for (const count of [0, 2, 6, 12]) {
      const camera = overviewCamera("lobby", compact, count)
      const backgroundCenter = new THREE.Vector3(0, 1.5, -7.15).project(camera)
      expect(backgroundCenter.x).toBeCloseTo(0, 6)
    }
  })

  it("keeps the starting racers centered for the countdown", () => {
    const camera = overviewCamera("countdown", false, 6)
    const start = new THREE.Vector3(new RaceCourse().startX, 0.45, -1.2).project(camera)
    expect(start.x).toBeCloseTo(0, 6)
  })
})
