import * as THREE from "three"

export abstract class SceneEntity {
  readonly object = new THREE.Group()

  update(_delta: number, _elapsed: number): void {}

  dispose(): void {
    this.object.traverse((child) => {
      if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.Sprite)) return
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose()
        }
        material.dispose()
      }
    })
    this.object.removeFromParent()
  }
}
