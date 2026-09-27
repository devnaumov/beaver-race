import * as THREE from "three"
import type { BeaverAppearance, Racer } from "../../domain"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { TextTexture } from "../core/TextTexture"
import { eyeForwardX } from "./parts"

export abstract class BeaverAccessory extends SceneEntity {}

export class CrownAccessory extends BeaverAccessory {
  constructor() {
    super()
    const crown = MeshFactory.mesh(new THREE.CylinderGeometry(0.2, 0.31, 0.33, 7, 1, true), "#ffd33d", [1, 1, 1], [0.08, 1.62, 0])
    crown.rotation.y = Math.PI / 7
    const gems = [-0.18, 0, 0.18].map((z, index) => MeshFactory.mesh(new THREE.SphereGeometry(0.045, 8, 6), index === 1 ? "#e94735" : "#3975db", [1, 1, 1], [0.27, 1.62, z]))
    this.object.add(crown, ...gems)
  }
}

export class CapAccessory extends BeaverAccessory {
  constructor(color: string) {
    super()
    const cap = MeshFactory.mesh(new THREE.SphereGeometry(0.37, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), color, [1, 0.62, 1], [0.08, 1.46, 0])
    const brim = MeshFactory.mesh(new THREE.BoxGeometry(0.4, 0.075, 0.3), color, [1, 1, 1], [0.36, 1.44, 0])
    this.object.add(cap, brim)
  }
}

export class BowlerHatAccessory extends BeaverAccessory {
  constructor() {
    super()
    this.object.add(
      MeshFactory.mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.38, 14), "#202a26", [1, 1, 1], [0.08, 1.62, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.065, 16), "#202a26", [1, 1, 1], [0.08, 1.43, 0]),
    )
  }
}

export class CapeAccessory extends BeaverAccessory {
  constructor(color: string) {
    super()
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 1.05, 1, 5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.82, side: THREE.DoubleSide }),
    )
    cape.position.set(-0.28, 0.69, -0.47)
    cape.rotation.x = -0.16
    cape.rotation.z = 0.08
    this.object.add(cape)
  }
}

export class GlassesAccessory extends BeaverAccessory {
  constructor(appearance: BeaverAppearance) {
    super()
    const lensX = eyeForwardX(appearance, appearance.eyeSpacing) + 0.12
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 7, 16), MeshFactory.material("#151b18", 0.35))
      lens.position.set(lensX, 1.35, side * appearance.eyeSpacing)
      lens.rotation.y = Math.PI / 2
      this.object.add(lens)
    }
    const bridgeLength = Math.max(0.1, appearance.eyeSpacing * 2 - 0.23)
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(0.025, 0.025, bridgeLength), "#151b18", [1, 1, 1], [lensX, 1.35, 0]))
  }
}

export class TailBoltAccessory extends BeaverAccessory {
  constructor() {
    super()
    const bolt = new THREE.Sprite(new THREE.SpriteMaterial({ map: TextTexture.create("⚡", "#f5b335", "#231810"), transparent: true }))
    bolt.scale.set(0.38, 0.38, 1)
    bolt.position.set(-0.69, 0.43, 0.41)
    this.object.add(bolt)
  }
}

export class AccessoryFactory {
  create(racer: Racer): BeaverAccessory {
    switch (racer.accessory) {
      case "Корона": return new CrownAccessory()
      case "Красная кепка": return new CapAccessory(racer.accent)
      case "Котелок": return new BowlerHatAccessory()
      case "Плащ чемпиона": return new CapeAccessory(racer.accent)
      case "Круглые очки": return new GlassesAccessory(racer.appearance)
      case "Молния на хвосте": return new TailBoltAccessory()
    }
  }
}
