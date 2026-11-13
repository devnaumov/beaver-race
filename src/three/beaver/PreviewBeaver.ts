import * as THREE from "three"
import type { Racer } from "../../domain"
import { giftBox } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { RacerBeaver } from "./BeaverModel"
import { NameTag } from "./NameTag"

export type PreviewActivity = "sitting" | "waving" | "presents" | "warming" | "stretching"

export interface PreviewPlacement {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly yaw: number
}

/** The race model and costume, posed without changing the racing animation rig. */
export class PreviewBeaver extends SceneEntity {
  readonly model: RacerBeaver
  private readonly present: THREE.Group | null
  private readonly seat = new THREE.Group()
  private readonly label: NameTag
  private activity: PreviewActivity = "sitting"
  private readonly offset: number

  constructor(racer: Racer, readonly index: number) {
    super()
    this.model = new RacerBeaver(racer)
    this.label = new NameTag(racer.name)
    this.label.object.position.y = 0.05
    this.offset = racer.seed % 100 / 10
    const freePaws = !racer.equipment.hand && !racer.equipment.offhand
    this.present = index % 5 === 2 && freePaws ? giftBox(0.55, racer.accent) : null
    if (this.present) {
      this.present.position.set(0.72, 0.68, 0)
      this.model.object.add(this.present)
    }
    if (index % 5 === 3 && freePaws) {
      const mug = MeshFactory.mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 12), "#bb3548", [1, 1, 1], [0.68, 0.82, 0])
      const handle = MeshFactory.mesh(new THREE.TorusGeometry(0.09, 0.025, 5, 12), "#edc86f", [1, 1, 1], [0.68, 0.83, 0.15])
      this.model.object.add(mug, handle)
    }
    const log = MeshFactory.mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.65, 12), "#68503b", [1, 1, 1], [0, 0.24, -0.12])
    log.rotation.z = Math.PI / 2
    this.seat.add(log, MeshFactory.mesh(new THREE.BoxGeometry(1.5, 0.09, 0.3), "#e5f0ed", [1, 1, 1], [0, 0.51, -0.2]))
    for (const x of [-0.835, 0.835]) {
      const ring = MeshFactory.mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.015, 12), "#c7a178", [1, 1, 1], [x, 0.24, -0.12])
      ring.rotation.z = Math.PI / 2
      this.seat.add(ring)
    }
    this.object.add(this.seat, this.model.object, this.label.object)
  }

  setPlacement(placement: PreviewPlacement): void {
    const activities: ReadonlyArray<PreviewActivity> = ["sitting", "waving", "presents", "warming", "stretching"]
    this.activity = activities[this.index % activities.length]!
    this.object.position.set(placement.x, placement.y, placement.z)
    this.model.object.rotation.y = placement.yaw
    this.seat.visible = this.activity === "sitting"
    this.update(0, 0)
  }

  override update(_delta: number, elapsed: number): void {
    const time = elapsed + this.offset
    const { leftArm, rightArm, leftLeg, rightLeg, tail } = this.model.rig
    leftArm.pivot.rotation.set(0, 0, 0.1)
    rightArm.pivot.rotation.set(0, 0, -0.1)
    leftLeg.pivot.rotation.set(0, 0, 0)
    rightLeg.pivot.rotation.set(0, 0, 0)
    this.model.object.position.y = 0.2 + Math.sin(time * 1.8) * 0.012
    this.model.object.rotation.z = Math.sin(time * 1.2) * 0.015
    tail.pivot.rotation.x = Math.sin(time * 1.3) * 0.04

    switch (this.activity) {
      case "sitting":
        this.model.object.position.y = 0.44
        this.model.object.rotation.z = -0.1
        leftLeg.pivot.rotation.z = 1.15 + Math.sin(time * 2) * 0.06
        rightLeg.pivot.rotation.z = 1.3 + Math.cos(time * 2) * 0.06
        leftArm.pivot.rotation.z = 0.35
        rightArm.pivot.rotation.z = 0.3
        break
      case "waving":
        leftArm.pivot.rotation.z = 2.6 + Math.sin(time * 4.8) * 0.24
        leftArm.pivot.rotation.x = Math.sin(time * 4.8) * 0.18
        break
      case "presents":
        leftArm.pivot.rotation.set(-0.2, 0, 1.05)
        rightArm.pivot.rotation.set(0.2, 0, 1.05)
        this.model.object.rotation.z = -0.05 + Math.sin(time * 1.5) * 0.025
        break
      case "warming":
        leftArm.pivot.rotation.set(-0.18, 0, 1.15 + Math.sin(time * 2) * 0.07)
        rightArm.pivot.rotation.set(0.18, 0, 0.95)
        break
      case "stretching":
        leftArm.pivot.rotation.set(-0.35, 0, 2.1 + Math.sin(time * 1.6) * 0.2)
        rightArm.pivot.rotation.set(0.35, 0, 2.1 + Math.sin(time * 1.6) * 0.2)
        this.model.object.rotation.z = Math.sin(time * 1.6) * 0.08
        break
    }
  }
}
