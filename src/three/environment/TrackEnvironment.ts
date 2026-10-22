import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { FinishTape } from "./FinishTape"
import { jackOLantern } from "../core/HalloweenMeshes"

export class TrackEnvironment extends SceneEntity {
  private readonly finishTape = new FinishTape()

  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(22, 0.34, 7.7), "#414044", [1, 1, 1], [0, -0.28, 0.18]))
    for (let boundary = 0; boundary <= 12; boundary += 1) {
      const z = -3.25 + boundary * (6.5 / 12)
      this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(18.5, 0.022, 0.025), "#c4a582", [1, 1, 1], [0, -0.055, z]))
    }
    this.object.add(
      MeshFactory.mesh(new THREE.BoxGeometry(0.075, 0.03, 6.72), "#f7f0dc", [1, 1, 1], [-7.7, -0.035, 0]),
      MeshFactory.mesh(new THREE.BoxGeometry(0.15, 0.035, 6.72), "#f5b335", [1, 1, 1], [7.75, -0.03, 0]),
    )
    this.object.add(this.finishTape.object)
    for (let index = 0; index < 12; index += 1) {
      const pumpkin = jackOLantern(0.75 + (index % 3) * 0.18)
      pumpkin.position.set(-9.5 + Math.floor(index / 2) * 3.8, 0.22, index % 2 ? 3.75 : -3.65)
      pumpkin.rotation.y = (index % 3 - 1) * 0.25
      this.object.add(pumpkin)
    }
    for (const x of [-8.9, 8.9]) {
      const lantern = new THREE.PointLight("#ff8a2b", 5, 4, 2)
      lantern.position.set(x, 0.6, 2.8)
      this.object.add(lantern)
    }
  }

  armFinishTape(laneZ: number): void {
    this.finishTape.arm(laneZ)
  }

  tearFinishTape(): void {
    this.finishTape.tear()
  }

  get isFinishTapeTorn(): boolean {
    return this.finishTape.isTorn
  }

  override update(delta: number): void {
    this.finishTape.update(delta)
  }
}
