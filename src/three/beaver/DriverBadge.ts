import * as THREE from "three"
import type { BeaverAppearance, DatabaseSticker } from "../../domain"
import { driverIconUrl } from "../../driverIcons"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class DriverBadge extends SceneEntity {
  constructor(sticker: DatabaseSticker, appearance: BeaverAppearance, scale = 1, withOutfit = false) {
    super()
    const x = -0.08
    const y = 0.69
    const radiusX = (withOutfit ? 0.59 * 1.04 : 0.58 * 1.03) * appearance.bodyScale[0]
    const radiusY = (withOutfit ? 0.59 * 0.91 : 0.58 * 0.92) * appearance.bodyScale[1]
    const radiusZ = (withOutfit ? 0.59 * 0.92 : 0.58 * 0.9) * appearance.bodyScale[2]
    const normalizedZ = Math.max(0, 1 - (x / radiusX) ** 2 - ((y - 0.72) / radiusY) ** 2)
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42 * scale, 0.42 * scale),
      new THREE.MeshBasicMaterial({ map: MeshFactory.texture(driverIconUrl(sticker.id)), alphaTest: 0.04 }),
    )
    const bellySurface = 0.48 * appearance.bodyScale[2] + 0.42 * 0.19
    badge.position.set(x, y, Math.max(radiusZ * Math.sqrt(normalizedZ), withOutfit ? 0 : bellySurface) + 0.012)
    this.object.add(badge)
  }
}
