import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { FinishTape } from "./FinishTape"
import { giftBox } from "../core/ChristmasMeshes"

export class TrackEnvironment extends SceneEntity {
  private readonly finishTape = new FinishTape()

  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(22, 0.34, 7.7), "#dcebe9", [1, 1, 1], [0, -0.28, 0.18]))
    for (let boundary = 0; boundary <= 12; boundary += 1) {
      const z = -3.25 + boundary * (6.5 / 12)
      this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(18.5, 0.022, 0.025), "#88b1b3", [1, 1, 1], [0, -0.055, z]))
    }
    this.object.add(
      MeshFactory.mesh(new THREE.BoxGeometry(0.075, 0.03, 6.72), "#23735a", [1, 1, 1], [-7.7, -0.035, 0]),
      MeshFactory.mesh(new THREE.BoxGeometry(0.15, 0.035, 6.72), "#bb3548", [1, 1, 1], [7.75, -0.03, 0]),
    )
    this.object.add(this.finishTape.object)
    for (let index = 0; index < 12; index += 1) {
      const size = 0.75 + (index % 3) * 0.18
      const gift = giftBox(size, index % 2 ? "#bb3548" : "#23735a")
      gift.position.set(-9.5 + Math.floor(index / 2) * 3.8, 0.28 * size - 0.08, index % 2 ? 3.75 : -3.65)
      gift.rotation.y = (index % 3 - 1) * 0.25
      this.object.add(gift)
    }
    for (const x of [-8.9, 8.9]) {
      const lantern = new THREE.PointLight("#ffe0a0", 5, 4, 2)
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
