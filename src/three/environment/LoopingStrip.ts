import { DynamicDrawUsage, InstancedMesh, Matrix4, type BufferGeometry, type Material } from "three"

export const loopX = (x: number, distance: number, width = 72): number =>
  ((x - distance + width / 2) % width + width) % width - width / 2

/** Recycles a fixed pool outside the camera, irrespective of race length. */
export class LoopingInstances {
  readonly mesh: InstancedMesh
  private readonly matrix = new Matrix4()

  constructor(geometry: BufferGeometry, material: Material | Material[], private readonly placements: ReadonlyArray<Matrix4>) {
    this.mesh = new InstancedMesh(geometry, material, placements.length)
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    this.mesh.frustumCulled = false
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.setTravel(0)
  }

  setTravel(distance: number): void {
    this.placements.forEach((placement, index) => {
      this.matrix.copy(placement)
      this.matrix.elements[12] = loopX(placement.elements[12]!, distance)
      this.mesh.setMatrixAt(index, this.matrix)
    })
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.mesh.dispose()
  }
}
