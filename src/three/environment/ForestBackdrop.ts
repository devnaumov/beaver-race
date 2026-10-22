import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class ForestBackdrop extends SceneEntity {
  constructor() {
    super()
    for (let index = 0; index < 17; index += 1) {
      const x = -11.5 + index * 1.45
      const z = -9.3 - (index % 2) * 0.55
      const height = 2.8 + (index % 4) * 0.4
      this.object.add(
        MeshFactory.mesh(new THREE.CylinderGeometry(0.08, 0.2, height, 7), "#302535", [1, 1, 1], [x, height / 2 - 0.1, z]),
      )
      for (const side of [-1, 1]) {
        const branch = MeshFactory.mesh(new THREE.CylinderGeometry(0.025, 0.09, 1.4, 6), "#302535", [1, 1, 1], [x + side * 0.38, height * 0.67, z])
        branch.rotation.z = -side * 0.7
        const twig = MeshFactory.mesh(new THREE.CylinderGeometry(0.01, 0.045, 0.75, 5), "#302535", [1, 1, 1], [x + side * 0.87, height * 0.8, z])
        twig.rotation.z = -side * 1.1
        this.object.add(branch, twig)
      }
      if (index % 3 === 0) {
        this.object.add(MeshFactory.mesh(new THREE.IcosahedronGeometry(0.8, 0), index % 2 ? "#734333" : "#5e3551", [1, 0.8, 0.7], [x, height, z - 0.2]))
      }
      if (index % 4 === 1) {
        const stone = MeshFactory.mesh(new THREE.BoxGeometry(0.48, 0.65, 0.16), "#666477", [1, 1, 1], [x, 0.24, z + 1])
        stone.rotation.z = 0.14
        this.object.add(stone, MeshFactory.mesh(new THREE.SphereGeometry(0.24, 12, 8), "#666477", [1, 1, 0.34], [x - 0.04, 0.56, z + 1]))
      }
    }
  }
}
