import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { bodyScaleFor, bodyTypes, createRacer } from "../../domain"
import { emptyEquipment, equipmentCatalog } from "../../equipment"
import { BeaverAnimator, createRunClip } from "./BeaverAnimator"
import { BeaverModel } from "./BeaverModel"
import { createEquipmentModel } from "./EquipmentModels"
import motion from "./running.json"

describe("3D inventory", () => {
  it.each(equipmentCatalog)("builds a volumetric, finite model for $name", (item) => {
    const object = createEquipmentModel(item.id, createRacer("Holly", 0.3))
    const bounds = new THREE.Box3().setFromObject(object)
    const size = bounds.getSize(new THREE.Vector3())
    expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true)
    expect(Math.min(...size.toArray())).toBeGreaterThan(0.01)
    expect(size.length()).toBeGreaterThan(0.1)
    expect(size.length()).toBeLessThan(4)
    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose()
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        materials.forEach((m) => m.dispose())
      }
    })
  })
})

describe("skeletal beaver", () => {
  const model = () => new BeaverModel({ ...createRacer("Holly", 0.3), equipment: { ...emptyEquipment(), hand: "sword", offhand: "shield", head: "santa" } }, false)

  it("has a weighted skin, named bones and paw-bound gear", () => {
    const beaver = model()
    const skin = beaver.object.getObjectByName("beaver-skinned-torso") as THREE.SkinnedMesh
    expect(skin).toBeInstanceOf(THREE.SkinnedMesh)
    expect(skin.skeleton.bones.length).toBeGreaterThanOrEqual(17)
    const weights = skin.geometry.getAttribute("skinWeight")
    for (let i = 0; i < weights.count; i++) expect(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i)).toBeCloseTo(1)
    expect(beaver.object.getObjectByName("equipment:sword")!.parent).toBe(beaver.rig.rightArm.socket)
    expect(beaver.object.getObjectByName("equipment:shield")!.parent).toBe(beaver.rig.leftArm.socket)
    expect(beaver.rig.leftArm.object.parent).toBe(beaver.rig.spine)
    beaver.dispose()
  })

  it("plays the imported CC0 loop and deforms the skin without non-finite transforms", () => {
    expect(motion.license).toBe("CC0-1.0")
    const clip = createRunClip()
    expect(clip.tracks).toHaveLength(8)
    expect(clip.duration).toBeCloseTo(0.958333)
    const beaver = model(), animator = new BeaverAnimator(beaver.rig, beaver.racer.appearance)
    const skin = beaver.object.getObjectByName("beaver-skinned-torso") as THREE.SkinnedMesh
    const vertex = new THREE.Vector3().fromBufferAttribute(skin.geometry.attributes.position!, 50)
    beaver.object.updateMatrixWorld(true)
    beaver.rig.skeleton.update()
    const before = skin.applyBoneTransform(50, vertex.clone())
    for (let i = 0; i < 20; i++) animator.update(1 / 60, 4, true)
    beaver.object.updateMatrixWorld(true)
    beaver.rig.skeleton.update()
    const after = skin.applyBoneTransform(50, vertex.clone())
    expect(after.distanceTo(before)).toBeGreaterThan(0.0001)
    expect(Math.abs(beaver.rig.leftLeg.pivot.rotation.z)).toBeGreaterThan(0.01)
    expect(Math.abs(beaver.rig.leftLeg.knee.rotation.z)).toBeGreaterThan(0.01)
    beaver.rig.skeleton.bones.forEach((bone) => expect(bone.matrixWorld.elements.every(Number.isFinite)).toBe(true))
    for (const track of clip.tracks) expect(Array.from(track.values.slice(0, 4))).toEqual(Array.from(track.values.slice(-4)))
    animator.dispose()
    beaver.dispose()
  })

  it("keeps extreme head sizes and all builds finite while running with full equipment", () => {
    for (const bodyType of bodyTypes) for (const size of [0.7, 1.35]) {
      const racer = createRacer("Holly", 0.3)
      const beaver = new BeaverModel({ ...racer,
        appearance: { ...racer.appearance, bodyType, bodyScale: bodyScaleFor(bodyType), headScale: [size, size, size] },
        equipment: { head: "santa", face: "glasses", neck: "scarf", body: "armor", hand: "ice-sword", offhand: "ice-shield", back: "tree" },
      }, false)
      const animator = new BeaverAnimator(beaver.rig, beaver.racer.appearance)
      for (let frame = 0; frame < 60; frame++) animator.update(1 / 60, 4, true)
      const bounds = new THREE.Box3().setFromObject(beaver.object)
      expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true)
      expect(bounds.getSize(new THREE.Vector3()).length()).toBeLessThan(5)
      animator.dispose()
      beaver.dispose()
    }
  })

  it("holds equipment in a stable idle pose and blends back after running", () => {
    const beaver = model(), animator = new BeaverAnimator(beaver.rig, beaver.racer.appearance)
    for (let frame = 0; frame < 120; frame++) animator.update(1 / 60, 0, false)
    expect(beaver.rig.rightArm.pivot.rotation.z).toBeCloseTo(0.55)
    expect(beaver.rig.rightArm.elbow.rotation.z).toBeCloseTo(0.75)
    for (let frame = 0; frame < 60; frame++) animator.update(1 / 60, 4, true)
    for (let frame = 0; frame < 120; frame++) animator.update(1 / 60, 0, false)
    expect(beaver.rig.rightArm.pivot.rotation.z).toBeCloseTo(0.55)
    expect(beaver.rig.rightArm.elbow.rotation.z).toBeCloseTo(0.75)
    animator.dispose()
    beaver.dispose()
  })
})
