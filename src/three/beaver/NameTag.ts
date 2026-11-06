import * as THREE from "three"
import { SceneEntity } from "../core/SceneEntity"
import { TextTexture } from "../core/TextTexture"

export class NameTag extends SceneEntity {
  constructor(name: string) {
    super()
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: TextTexture.create(name, "#153e35", "#edf5ec", true), transparent: true }))
    sprite.scale.set(1.5, 0.38, 1)
    sprite.position.set(0, 2.65, 0)
    this.object.add(sprite)
  }
}
