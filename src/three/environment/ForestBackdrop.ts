import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class ForestBackdrop extends SceneEntity {
  constructor() {
    super()
    for (let index = 0; index < 17; index += 1) {
      const x = -11.5 + index * 1.45
      const z = -9.3 - (index % 2) * 0.55
      const height = 2.4 + (index % 4) * 0.28
      this.object.add(
        MeshFactory.mesh(new THREE.CylinderGeometry(0.11, 0.18, 2, 7), "#66391f", [1, 1, 1], [x, 0.82, z]),
        MeshFactory.mesh(new THREE.ConeGeometry(0.76 + (index % 3) * 0.08, height, 8), index % 2 ? "#1f5337" : "#347147", [1, 1, 1], [x, 2.25, z]),
      )
    }
  }
}
