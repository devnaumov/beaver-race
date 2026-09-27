import * as THREE from "three"
import type { BeaverAppearance, DatabaseSticker } from "../../domain"
import { driverIconUrl } from "../../driverIcons"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class DriverBadge extends SceneEntity {
  constructor(sticker: DatabaseSticker, appearance: BeaverAppearance, scale = 1) {
    super()
    const x = -0.08
    const y = 0.69
    const radiusX = 0.58 * 1.03 * appearance.bodyScale[0]
    const radiusY = 0.58 * 1.24 * appearance.bodyScale[1]
    const radiusZ = 0.58 * 0.9 * appearance.bodyScale[2]
    const normalizedZ = Math.max(0, 1 - (x / radiusX) ** 2 - ((y - 0.72) / radiusY) ** 2)
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42 * scale, 0.42 * scale),
      new THREE.MeshBasicMaterial({ map: MeshFactory.texture(driverIconUrl(sticker.id)), alphaTest: 0.04 }),
    )
    badge.position.set(x, y, radiusZ * Math.sqrt(normalizedZ) + 0.008)
    this.object.add(badge)
  }
}
