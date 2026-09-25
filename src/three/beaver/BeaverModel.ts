import * as THREE from "three"
import type { Racer } from "../../domain"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { AccessoryFactory, type BeaverAccessory } from "./Accessories"
import { DriverBadge } from "./DriverBadge"
import { ArmPart, BellyPart, FacePart, HeadPart, LegPart, TailPart, TorsoPart } from "./parts"

export interface BeaverRig {
  readonly leftLeg: LegPart
  readonly rightLeg: LegPart
  readonly leftArm: ArmPart
  readonly rightArm: ArmPart
  readonly tail: TailPart
}

export const appearanceKeyFor = (racer: Racer): string =>
  JSON.stringify([racer.fur, racer.accent, racer.accessory, racer.sticker.id, racer.appearance])

export class BeaverModel extends SceneEntity {
  readonly rig: BeaverRig
  readonly appearanceKey: string
  protected readonly accessory: BeaverAccessory

  constructor(readonly racer: Racer, withBadge = true) {
    super()
    this.appearanceKey = appearanceKeyFor(racer)
    const torso = new TorsoPart(racer.fur, racer.appearance)
    const belly = new BellyPart(racer.appearance.belly, racer.appearance)
    const head = new HeadPart(racer.fur, racer.appearance)
    const face = new FacePart(racer.fur, racer.appearance)
    const tail = new TailPart("#563320", racer.appearance)
    const leftLeg = new LegPart(racer.fur, true)
    const rightLeg = new LegPart(racer.fur, false)
    const leftArm = new ArmPart(racer.fur, true)
    const rightArm = new ArmPart(racer.fur, false)
    this.object.add(rightArm.object, rightLeg.object, tail.object, torso.object, belly.object, head.object, face.object, leftLeg.object, leftArm.object)
    if (withBadge) this.object.add(new DriverBadge(racer.sticker).object)
    this.accessory = new AccessoryFactory().create(racer)
    this.object.add(this.accessory.object)
    this.rig = { leftLeg, rightLeg, leftArm, rightArm, tail }
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
