import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { FinishTape } from "./FinishTape"
import { giftBox } from "../core/ChristmasMeshes"
import { LoopingInstances } from "./LoopingStrip"

export class TrackEnvironment extends SceneEntity {
  private readonly finishTape = new FinishTape()
  private readonly scenery: ReadonlyArray<LoopingInstances>
  readonly finish = new THREE.Group()
  private readonly start = MeshFactory.mesh(new THREE.BoxGeometry(0.075, 0.03, 6.72), "#23735a", [1, 1, 1], [-7.7, -0.035, 0])

  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(90, 0.34, 7.7), "#dcebe9", [1, 1, 1], [0, -0.28, 0.18]))
    for (let boundary = 0; boundary <= 12; boundary += 1) {
      const z = -3.25 + boundary * (6.5 / 12)
      this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(90, 0.022, 0.025), "#88b1b3", [1, 1, 1], [0, -0.055, z]))
    }
    this.finish.add(this.finishTape.object)
    this.finishTape.object.position.x = -7.75
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 24; column += 1) {
        this.finish.add(MeshFactory.mesh(new THREE.BoxGeometry(0.2, 0.035, 0.28), (row + column) % 2 ? "#264d49" : "#edf5ec", [1, 1, 1], [row * 0.2, -0.03, -3.22 + column * 0.28]))
      }
    }
    this.finish.visible = false
    this.object.add(this.start, this.finish)
    const template = giftBox(1, "#edf5ec")
    const placements: THREE.Matrix4[] = []
    const transform = new THREE.Object3D()
    for (let index = 0; index < 36; index += 1) {
      const size = 0.75 + (index % 3) * 0.18
      transform.position.set(-34 + Math.floor(index / 2) * 4, 0.28 * size - 0.08, index % 2 ? 4.05 : -3.85)
      transform.scale.setScalar(size)
      transform.rotation.y = (index % 3 - 1) * 0.25
      transform.updateMatrix()
      placements.push(transform.matrix.clone())
    }
    this.scenery = template.children.map((child) => {
      const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
      mesh.updateMatrix()
      const batch = new LoopingInstances(mesh.geometry, mesh.material, placements.map((placement) => placement.clone().multiply(mesh.matrix)))
      batch.mesh.name = "track-gifts"
      if (mesh.material.color.getHexString() === "edf5ec") {
        placements.forEach((_, index) => batch.mesh.setColorAt(index, new THREE.Color(index % 2 ? "#bb3548" : "#23735a")))
      }
      this.object.add(batch.mesh)
      return batch
    })
    for (const x of [-8.9, 8.9]) {
      const lantern = new THREE.PointLight("#ffe0a0", 5, 4, 2)
      lantern.position.set(x, 0.6, 2.8)
      this.object.add(lantern)
    }
  }

  setTravel(distance: number, finishX: number, showFinish: boolean): void {
    this.scenery.forEach((batch) => batch.setTravel(distance))
    this.start.position.x = -7.7 - distance
    this.finish.position.x = finishX
    this.finish.visible = showFinish
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

  override dispose(): void {
    this.scenery.forEach((batch) => batch.dispose())
    super.dispose()
  }
}
