import * as THREE from "three"
import { SceneEntity } from "../core/SceneEntity"

export class Snowfall extends SceneEntity {
  private readonly flakes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.035, 4, 3),
    new THREE.MeshBasicMaterial({ color: "#edf5ec", transparent: true, opacity: 0.75 }),
    220,
  )
  private readonly transform = new THREE.Object3D()
  private time = 0
  reducedMotion = false

  constructor() {
    super()
    this.flakes.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.flakes.frustumCulled = false
    this.object.add(this.flakes)
    this.update(0)
  }

  override update(delta: number): void {
    this.flakes.visible = !this.reducedMotion
    if (this.reducedMotion) return
    this.time += delta
    for (let index = 0; index < this.flakes.count; index += 1) {
      const speed = 0.45 + (index % 5) * 0.12
      this.transform.position.set(
        Math.sin(index * 127.1) * 12 + Math.sin(this.time * 0.3 + index) * 0.3,
        9 - ((index * 0.73 + this.time * speed) % 9),
        -12 + ((index * 1.37) % 17),
      )
      this.transform.scale.setScalar(0.6 + (index % 4) * 0.3)
      this.transform.updateMatrix()
      this.flakes.setMatrixAt(index, this.transform.matrix)
    }
    this.flakes.instanceMatrix.needsUpdate = true
  }

  override dispose(): void {
    this.flakes.dispose()
    super.dispose()
  }
}
