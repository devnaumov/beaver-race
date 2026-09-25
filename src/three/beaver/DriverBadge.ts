import * as THREE from "three"
import type { DatabaseSticker } from "../../domain"
import { driverIconUrl } from "../../driverIcons"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class DriverBadge extends SceneEntity {
  constructor(sticker: DatabaseSticker, scale = 1) {
    super()
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42 * scale, 0.42 * scale),
      new THREE.MeshBasicMaterial({ map: MeshFactory.texture(driverIconUrl(sticker.id)), transparent: true, alphaTest: 0.04 }),
    )
    badge.position.set(-0.08, 0.69, 0.595)
    badge.renderOrder = 4
    this.object.add(badge)
  }
}
