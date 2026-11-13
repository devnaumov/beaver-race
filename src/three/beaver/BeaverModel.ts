import * as THREE from "three"
import type { Racer } from "../../domain"
import { equipmentSlots, type EquipmentSlot } from "../../equipment"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { batchStaticMeshes } from "../core/batchStaticMeshes"
import { createEquipmentModel } from "./EquipmentModels"
import { DriverBadge } from "./DriverBadge"
import { ArmPart, BellyPart, FacePart, HeadPart, LegPart, TailPart, TorsoPart } from "./parts"

export interface BeaverRig {
  readonly root: THREE.Bone
  readonly hips: THREE.Bone
  readonly spine: THREE.Bone
  readonly head: THREE.Bone
  readonly skeleton: THREE.Skeleton
  readonly leftLeg: LegPart
  readonly rightLeg: LegPart
  readonly leftArm: ArmPart
  readonly rightArm: ArmPart
  readonly tail: TailPart
}

export const appearanceKeyFor = (racer: Racer): string =>
  JSON.stringify([racer.fur, racer.accent, racer.equipment, racer.sticker.id, racer.appearance])

export class BeaverModel extends SceneEntity {
  readonly rig: BeaverRig
  readonly appearanceKey: string

  constructor(readonly racer: Racer, withBadge = true) {
    super()
    this.appearanceKey = appearanceKeyFor(racer)
    const torso = new TorsoPart(racer.fur, racer.appearance)
    const belly = new BellyPart(racer.appearance.belly, racer.appearance)
    const head = new HeadPart(racer.fur, racer.appearance)
    const face = new FacePart(racer.fur, racer.appearance)
    for (const part of [head, face, belly]) batchStaticMeshes(part.object)
    const tail = new TailPart("#563320", racer.appearance)
    const leftLeg = new LegPart(racer.fur, true)
    const rightLeg = new LegPart(racer.fur, false)
    const leftArm = new ArmPart(racer.fur, true, racer.appearance)
    const rightArm = new ArmPart(racer.fur, false, racer.appearance)
    const root = new THREE.Bone(), hips = new THREE.Bone(), spine = new THREE.Bone(), headBone = new THREE.Bone()
    root.name = "RigRoot"
    hips.name = "Hips"
    spine.name = "Spine"
    headBone.name = "Head"
    hips.position.y = 0.56
    spine.position.y = 0.38
    headBone.position.set(0.17, 0.28, 0)
    root.add(hips)
    hips.add(spine)
    spine.add(headBone)
    for (const arm of [leftArm, rightArm]) {
      arm.object.position.y -= 0.94
      spine.add(arm.object)
    }
    for (const part of [leftLeg, rightLeg, tail]) {
      part.object.position.y -= 0.56
      hips.add(part.object)
    }
    this.object.add(root, torso.object)
    // Head, face, costume and badge follow the skeleton, not the scene origin.
    const headSocket = new THREE.Group()
    headSocket.position.set(-0.17, -1.22, 0)
    headBone.add(headSocket)
    headSocket.add(head.object, face.object)
    const bodySocket = new THREE.Group()
    bodySocket.position.y = -0.94
    spine.add(bodySocket)
    belly.object.visible = !racer.equipment.body
    bodySocket.add(belly.object)
    if (withBadge) {
      const badge = new DriverBadge(racer.sticker, racer.appearance, 1, Boolean(racer.equipment.body)).object
      badge.name = "driver-badge"
      bodySocket.add(badge)
    }
    const sockets: Record<EquipmentSlot, THREE.Object3D> = {
      head: headSocket, face: headSocket, neck: bodySocket, body: bodySocket,
      hand: rightArm.socket, offhand: leftArm.socket, back: bodySocket,
    }
    for (const slot of equipmentSlots) {
      const id = racer.equipment[slot]
      if (!id) continue
      const item = createEquipmentModel(id, racer)
      if (slot === "hand") {
        item.position.set(0.06, 0.04, -0.02)
        item.rotation.z = -1.3
      }
      if (slot === "head") {
        // Fit headwear to the character's skull while retaining a common head socket.
        const fit = new THREE.Group()
        fit.position.set(0.08, 1.22, 0)
        item.position.set(-0.08, -1.22, 0)
        fit.scale.set(racer.appearance.headScale[0], racer.appearance.headScale[1], racer.appearance.headScale[2])
        fit.add(item)
        sockets[slot].add(fit)
      } else sockets[slot].add(item)
    }
    this.object.updateMatrixWorld(true)
    const bones: THREE.Bone[] = []
    root.traverse((node) => { if (node instanceof THREE.Bone) bones.push(node) })
    const skeleton = new THREE.Skeleton(bones)
    // Smoothly weighted torso: lower vertices follow hips, upper vertices follow the spine.
    const source = torso.object.children[0] as THREE.Mesh
    source.updateMatrix()
    const geometry = source.geometry.clone().applyMatrix4(source.matrix)
    const indices: number[] = [], weights: number[] = []
    for (let i = 0; i < geometry.attributes.position!.count; i++) {
      const t = THREE.MathUtils.smoothstep(geometry.attributes.position!.getY(i), 0.35, 1.15)
      indices.push(bones.indexOf(hips), bones.indexOf(spine), 0, 0)
      weights.push(1 - t, t, 0, 0)
    }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4))
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4))
    const skin = new THREE.SkinnedMesh(geometry, source.material)
    skin.name = "beaver-skinned-torso"
    skin.castShadow = true
    skin.receiveShadow = true
    skin.frustumCulled = false
    torso.object.add(skin)
    skin.bind(skeleton)
    source.geometry.dispose()
    source.removeFromParent()
    this.rig = { root, hips, spine, head: headBone, skeleton, leftLeg, rightLeg, leftArm, rightArm, tail }
  }
}

export class RacerBeaver extends BeaverModel {}

export class FlagBearerBeaver extends BeaverModel {
  constructor(racer: Racer, trunksColor: string) {
    super(racer, false)
    this.object.add(
      MeshFactory.mesh(new THREE.BoxGeometry(0.74, 0.4, 0.9), trunksColor, [1, 1, 1], [0, 0.43, 0]),
      MeshFactory.mesh(new THREE.BoxGeometry(0.78, 0.075, 0.94), "#f6e4bd", [1, 1, 1], [0, 0.63, 0]),
    )
  }
}
