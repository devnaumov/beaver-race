import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { FinishTape } from "./FinishTape"

export class TrackEnvironment extends SceneEntity {
  private readonly finishTape = new FinishTape()

  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(22, 0.34, 7.7), "#5c8f45", [1, 1, 1], [0, -0.28, 0.18]))
    for (let boundary = 0; boundary <= 12; boundary += 1) {
      const z = -3.25 + boundary * (6.5 / 12)
      this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(18.5, 0.022, 0.025), "#f8e7bd", [1, 1, 1], [0, -0.055, z]))
    }
    this.object.add(
      MeshFactory.mesh(new THREE.BoxGeometry(0.075, 0.03, 6.72), "#f7f0dc", [1, 1, 1], [-7.7, -0.035, 0]),
      MeshFactory.mesh(new THREE.BoxGeometry(0.15, 0.035, 6.72), "#f5b335", [1, 1, 1], [7.75, -0.03, 0]),
    )
    this.object.add(this.finishTape.object)
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
