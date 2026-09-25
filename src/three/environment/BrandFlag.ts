import * as THREE from "three"
import type { BrandIconId } from "../../driverIcons"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { TextTexture } from "../core/TextTexture"

export abstract class BrandFlag extends SceneEntity {
  private readonly cloth: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private readonly basePositions: Float32Array

  protected constructor(brand: BrandIconId, background: string) {
    super()
    const pole = MeshFactory.mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.65, 8), "#dac08a", [1, 1, 1], [0, 1.25, 0])
    this.cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 0.86, 14, 6),
      new THREE.MeshBasicMaterial({
        map: TextTexture.create(brand === "dbeaver" ? "DBEAVER" : "CLOUDBEAVER", background, brand === "dbeaver" ? "#382923" : "#244357", true),
        side: THREE.DoubleSide,
      }),
    )
    this.cloth.position.set(0.9, 1.95, 0)
    this.basePositions = new Float32Array(this.cloth.geometry.attributes.position!.array)
    this.object.add(pole, this.cloth)
  }

  override update(_delta: number, elapsed: number): void {
    const positions = this.cloth.geometry.attributes.position!
    for (let index = 0; index < positions.count; index += 1) {
      const x = this.basePositions[index * 3]!
      const y = this.basePositions[index * 3 + 1]!
      const wave = (x + 0.85) * 0.055 * Math.sin(elapsed * 4.2 + x * 4.5 + y * 2)
      positions.setZ(index, wave)
    }
    positions.needsUpdate = true
    this.cloth.geometry.computeVertexNormals()
  }
}

export class DBeaverFlag extends BrandFlag {
  constructor() { super("dbeaver", "#f7ead0") }
}

export class CloudBeaverFlag extends BrandFlag {
  constructor() { super("cloudbeaver", "#edf7fb") }
}
