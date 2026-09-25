import * as THREE from "three"

export class MeshFactory {
  static material(color: THREE.ColorRepresentation, roughness = 0.78): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: roughness < 0.5 ? 0.14 : 0 })
  }

  static mesh(
    geometry: THREE.BufferGeometry,
    color: THREE.ColorRepresentation,
    scale: readonly [number, number, number] = [1, 1, 1],
    position: readonly [number, number, number] = [0, 0, 0],
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, this.material(color))
    mesh.scale.set(...scale)
    mesh.position.set(...position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  static texture(url: string): THREE.Texture {
    const texture = new THREE.TextureLoader().load(url)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }
}
