import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { loopX, LoopingInstances } from "./LoopingStrip"

describe("Looping scenery", () => {
  it("moves backward continuously and recycles only beyond the shot", () => {
    expect(loopX(5, 10)).toBe(-5)
    expect(loopX(5, 82)).toBe(-5)
    expect(loopX(5, 0)).toBe(5)
  })

  it("keeps a fixed number of instances over arbitrarily long routes", () => {
    const batch = new LoopingInstances(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), [new THREE.Matrix4().makeTranslation(4, 2, -3)])
    const position = new THREE.Matrix4()
    for (const distance of [0, 10, 60, 1_000, 100_000]) {
      batch.setTravel(distance)
      batch.mesh.getMatrixAt(0, position)
      expect(position.elements[12]).toBeGreaterThanOrEqual(-36)
      expect(position.elements[12]).toBeLessThan(36)
      expect(position.elements[13]).toBe(2)
      expect(position.elements[14]).toBe(-3)
      expect(batch.mesh.count).toBe(1)
    }
    batch.dispose()
    batch.mesh.geometry.dispose()
    ;(batch.mesh.material as THREE.Material).dispose()
  })
})
