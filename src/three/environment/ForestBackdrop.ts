import * as THREE from "three"
import { christmasStar } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { LoopingInstances } from "./LoopingStrip"

export class ForestBackdrop extends SceneEntity {
  private readonly batches: ReadonlyArray<LoopingInstances>

  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(90, 0.2, 12), "#dcebe9", [1, 1, 1], [0, -0.15, -12.5]))
    const trunks: THREE.Matrix4[] = []
    const branches: THREE.Matrix4[] = []
    const snow: THREE.Matrix4[] = []
    const lights: THREE.Matrix4[] = []
    const stars: THREE.Matrix4[] = []
    const transform = new THREE.Object3D()
    const place = (items: THREE.Matrix4[], x: number, y: number, z: number, sx = 1, sy = 1, sz = sx) => {
      transform.position.set(x, y, z)
      transform.scale.set(sx, sy, sz)
      transform.updateMatrix()
      items.push(transform.matrix.clone())
    }
    for (let index = 0; index < 36; index += 1) {
      const x = -35 + index * 2
      const z = -(index % 3) * 1.4
      const height = 2.8 + (index % 4) * 0.4
      place(trunks, x, 0.25, z)
      for (let tier = 0; tier < 3; tier += 1) {
        const radius = 0.92 - tier * 0.22
        const y = 0.95 + tier * (height - 1.25) / 3
        place(branches, x, y, z, radius, height * 0.5)
        place(snow, x, y + height * 0.08, z, radius * 0.84, height * 0.42)
        if (index % 2 === 0) {
          for (let bulb = 0; bulb < 5; bulb += 1) {
            const angle = bulb * Math.PI * 2 / 5 + tier * 0.6
            place(lights, x + Math.cos(angle) * radius * 0.82, y - height * 0.12, z + Math.sin(angle) * radius * 0.82)
          }
        }
      }
      if (index % 2 === 0) place(stars, x, 0.95 + 2 * (height - 1.25) / 3 + height * 0.3, z)
    }
    const star = christmasStar()
    this.batches = [
      new LoopingInstances(new THREE.CylinderGeometry(0.1, 0.19, 0.7, 7), MeshFactory.material("#685341"), trunks),
      new LoopingInstances(new THREE.ConeGeometry(1, 1, 9), MeshFactory.material("#337460"), branches),
      new LoopingInstances(new THREE.ConeGeometry(1, 1, 9), MeshFactory.material("#e5f0ed"), snow),
      new LoopingInstances(new THREE.SphereGeometry(0.055, 6, 5), new THREE.MeshBasicMaterial({ color: "#edf5ec" }), lights),
      new LoopingInstances(star.geometry, star.material, stars),
    ]
    const bulbs = ["#ffe2a0", "#e86068", "#87dcc2"]
    lights.forEach((_, index) => this.batches[3]!.mesh.setColorAt(index, new THREE.Color(bulbs[index % 3]!)))
    for (const batch of this.batches) {
      batch.mesh.position.z = -9.3
      this.object.add(batch.mesh)
    }
  }

  setTravel(distance: number): void {
    this.batches.forEach((batch) => batch.setTravel(distance))
  }

  override dispose(): void {
    this.batches.forEach((batch) => batch.dispose())
    super.dispose()
  }
}
