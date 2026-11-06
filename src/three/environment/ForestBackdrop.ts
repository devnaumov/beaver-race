import * as THREE from "three"
import { christmasStar } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class ForestBackdrop extends SceneEntity {
  constructor() {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(28, 0.2, 7), "#dcebe9", [1, 1, 1], [0, -0.15, -10]))
    const bulbs = ["#ffe2a0", "#e86068", "#87dcc2"]
    for (let index = 0; index < 17; index += 1) {
      const x = -11.5 + index * 1.45
      const z = -9.3 - (index % 2) * 1.15
      const height = 2.8 + (index % 4) * 0.4
      this.object.add(MeshFactory.mesh(new THREE.CylinderGeometry(0.1, 0.19, 0.7, 7), "#685341", [1, 1, 1], [x, 0.25, z]))
      for (let tier = 0; tier < 3; tier += 1) {
        const radius = 0.92 - tier * 0.22
        const y = 0.95 + tier * (height - 1.25) / 3
        this.object.add(
          MeshFactory.mesh(new THREE.ConeGeometry(radius, height * 0.5, 9), index % 2 ? "#24584c" : "#337460", [1, 1, 1], [x, y, z]),
          MeshFactory.mesh(new THREE.ConeGeometry(radius * 0.84, height * 0.42, 9), "#e5f0ed", [1, 1, 1], [x, y + height * 0.08, z]),
        )
        if (index % 2 === 0) {
          for (let bulb = 0; bulb < 5; bulb += 1) {
            const angle = bulb * Math.PI * 2 / 5 + tier * 0.6
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), new THREE.MeshBasicMaterial({ color: bulbs[(bulb + tier) % bulbs.length]! }))
            light.position.set(x + Math.cos(angle) * radius * 0.82, y - height * 0.12, z + Math.sin(angle) * radius * 0.82)
            this.object.add(light)
          }
        }
      }
      if (index % 2 === 0) {
        const star = christmasStar()
        star.position.set(x, 0.95 + 2 * (height - 1.25) / 3 + height * 0.3, z)
        this.object.add(star)
      }
    }
  }
}
