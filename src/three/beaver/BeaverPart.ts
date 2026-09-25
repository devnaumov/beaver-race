import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export abstract class BeaverPart extends SceneEntity {
  protected addMesh(
    geometry: THREE.BufferGeometry,
    color: THREE.ColorRepresentation,
    scale?: readonly [number, number, number],
    position?: readonly [number, number, number],
  ): THREE.Mesh {
    const mesh = MeshFactory.mesh(geometry, color, scale, position)
    this.object.add(mesh)
    return mesh
  }
}
