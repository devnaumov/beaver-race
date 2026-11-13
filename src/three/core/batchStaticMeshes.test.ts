import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { batchStaticMeshes } from "./batchStaticMeshes"
import { SceneEntity } from "./SceneEntity"

describe("rigid character batching", () => {
  it("preserves geometry bounds while grouping identical materials", () => {
    const entity = new class extends SceneEntity {}()
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? "#aabbcc" : "#334455" }))
      mesh.position.set(i * 0.3, i * 0.1, 0)
      mesh.scale.set(1, 1.5, 0.7)
      entity.object.add(mesh)
    }
    const before = new THREE.Box3().setFromObject(entity.object)
    batchStaticMeshes(entity.object)
    const after = new THREE.Box3().setFromObject(entity.object)
    expect(entity.object.children).toHaveLength(2)
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-6)
    expect(after.max.distanceTo(before.max)).toBeLessThan(1e-6)
    entity.dispose()
  })

  it("never collapses across skeleton joints", () => {
    const group = new THREE.Group(), joint = new THREE.Bone()
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
    joint.add(mesh)
    group.add(joint)
    batchStaticMeshes(group)
    expect(mesh.parent).toBe(joint)
    expect(joint.parent).toBe(group)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
})
