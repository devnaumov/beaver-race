import * as THREE from "three"
import type { BeaverAppearance, Racer } from "../../domain"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { batWings, jackOLantern } from "../core/HalloweenMeshes"
import { eyeForwardX } from "./parts"

export abstract class BeaverAccessory extends SceneEntity {}

export class WitchHatAccessory extends BeaverAccessory {
  constructor() {
    super()
    const tip = MeshFactory.mesh(new THREE.ConeGeometry(0.34, 0.85, 12), "#352446", [1, 1, 1], [0.02, 1.95, 0])
    tip.rotation.z = 0.2
    this.object.add(
      tip,
      MeshFactory.mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.065, 20), "#21182e", [1, 1, 1], [0.08, 1.53, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 12), "#f18b30", [1, 1, 1], [0.08, 1.63, 0]),
      MeshFactory.mesh(new THREE.BoxGeometry(0.15, 0.13, 0.035), "#f6cc6d", [1, 1, 1], [0.08, 1.63, 0.32]),
    )
  }
}

export class PumpkinAccessory extends BeaverAccessory {
  constructor() {
    super()
    const pumpkin = jackOLantern(0.95)
    pumpkin.position.set(0.08, 1.68, 0)
    this.object.add(pumpkin)
  }
}

export class BowlerHatAccessory extends BeaverAccessory {
  constructor() {
    super()
    this.object.add(
      MeshFactory.mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.57, 14), "#21182e", [1, 1, 1], [0.08, 1.8, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.065, 16), "#21182e", [1, 1, 1], [0.08, 1.5, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.325, 0.34, 0.12, 14), "#b44e62", [1, 1, 1], [0.08, 1.61, 0]),
      MeshFactory.mesh(new THREE.SphereGeometry(0.09, 10, 8), "#e9e1c7", [1, 1, 0.4], [0.08, 1.8, 0.3]),
    )
  }
}

export class CapeAccessory extends BeaverAccessory {
  constructor() {
    super()
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.2, 1, 5),
      new THREE.MeshStandardMaterial({ color: "#8c2445", roughness: 0.82, side: THREE.DoubleSide }),
    )
    cape.position.set(-0.28, 0.69, -0.47)
    cape.rotation.x = -0.16
    cape.rotation.z = 0.08
    this.object.add(cape)
    for (const side of [-1, 1]) {
      const collar = MeshFactory.mesh(new THREE.ConeGeometry(0.25, 0.5, 3), "#4a1831", [1, 1, 0.3], [-0.13, 1.25, side * 0.33])
      collar.rotation.x = side * 0.45
      this.object.add(collar)
    }
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
    for (const side of [-1, 1]) {
      const bolt = MeshFactory.mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.19, 6), "#a9c5aa", [1, 1, 1], [0.02, 1.25, side * (0.47 * appearance.headScale[2] + 0.04)])
      bolt.rotation.x = Math.PI / 2
      this.object.add(bolt)
    }
  }
}

export class BatAccessory extends BeaverAccessory {
  constructor() {
    super()
    const wings = batWings("#4b315e")
    wings.position.set(-0.22, 0.95, -0.16)
    wings.rotation.y = Math.PI / 2
    this.object.add(wings)
    for (const side of [-1, 1]) {
      this.object.add(MeshFactory.mesh(new THREE.ConeGeometry(0.13, 0.35, 3), "#4b315e", [1, 1, 0.65], [0.02, 1.67, side * 0.24]))
    }
  }
}

export class AccessoryFactory {
  create(racer: Racer): BeaverAccessory {
    switch (racer.accessory) {
      case "Корона": return new WitchHatAccessory()
      case "Красная кепка": return new PumpkinAccessory()
      case "Котелок": return new BowlerHatAccessory()
      case "Плащ чемпиона": return new CapeAccessory()
      case "Круглые очки": return new GlassesAccessory(racer.appearance)
      case "Молния на хвосте": return new BatAccessory()
    }
  }
}
