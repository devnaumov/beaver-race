import * as THREE from "three"
import type { BeaverAppearance, Racer } from "../../domain"
import { festiveHat } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { eyeForwardX } from "./parts"

export abstract class BeaverAccessory extends SceneEntity {}

export class SantaHatAccessory extends BeaverAccessory {
  constructor(elf = false) {
    super()
    const hat = festiveHat(elf ? "#23735a" : "#bb3548", elf)
    hat.position.set(0.08, 1.57, 0)
    this.object.add(hat)
  }
}

export class SnowmanHatAccessory extends BeaverAccessory {
  constructor() {
    super()
    this.object.add(
      MeshFactory.mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.53, 14), "#203b3b", [1, 1, 1], [0.08, 1.8, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.065, 16), "#203b3b", [1, 1, 1], [0.08, 1.5, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.325, 0.34, 0.12, 14), "#bb3548", [1, 1, 1], [0.08, 1.61, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.045, 14), "#edf5ec", [1, 1, 1], [0.08, 2.08, 0]),
      MeshFactory.mesh(new THREE.SphereGeometry(0.07, 8, 6), "#edc86f", [1, 1, 0.4], [0.08, 1.64, 0.34]),
    )
  }
}

export class ScarfAccessory extends BeaverAccessory {
  constructor() {
    super()
    const scarf = MeshFactory.mesh(new THREE.TorusGeometry(0.33, 0.105, 8, 18), "#bb3548", [1, 1, 0.85], [0, 0.99, 0])
    scarf.rotation.x = Math.PI / 2
    this.object.add(scarf)
    for (const side of [-1, 1]) {
      const end = MeshFactory.mesh(new THREE.BoxGeometry(0.14, 0.58, 0.065), "#bb3548", [1, 1, 1], [-0.23, 0.73, side * 0.32])
      end.rotation.z = side * 0.13
      for (let stripe = 0; stripe < 3; stripe += 1) {
        end.add(MeshFactory.mesh(new THREE.BoxGeometry(0.145, 0.045, 0.07), "#edf5ec", [1, 1, 1], [0, -0.19 + stripe * 0.13, 0]))
      }
      this.object.add(end)
    }
  }
}

export class CarolerAccessory extends BeaverAccessory {
  constructor(appearance: BeaverAppearance, withHat = true) {
    super()
    const lensX = eyeForwardX(appearance, appearance.eyeSpacing) + 0.12
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 7, 16), MeshFactory.material("#b88c43", 0.35))
      lens.position.set(lensX, 1.35, side * appearance.eyeSpacing)
      lens.rotation.y = Math.PI / 2
      this.object.add(lens)
    }
    const bridgeLength = Math.max(0.1, appearance.eyeSpacing * 2 - 0.23)
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(0.025, 0.025, bridgeLength), "#b88c43", [1, 1, 1], [lensX, 1.35, 0]))
    if (withHat) this.object.add(
      MeshFactory.mesh(new THREE.SphereGeometry(0.34, 14, 10), "#23735a", [1, 0.85, 1], [0.08, 1.64, 0]),
      MeshFactory.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 16), "#edf5ec", [1, 1, 1], [0.08, 1.57, 0]),
      MeshFactory.mesh(new THREE.SphereGeometry(0.12, 10, 8), "#edc86f", [1, 1, 1], [0.08, 1.98, 0]),
    )
  }
}

export class ReindeerAccessory extends BeaverAccessory {
  constructor(appearance: BeaverAppearance, withNose = true) {
    super()
    for (const side of [-1, 1]) {
      const antler = new THREE.Group()
      antler.position.set(0.02, 1.6, side * 0.25)
      antler.add(MeshFactory.mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.65, 7), "#c99d67", [1, 1, 1], [0, 0.3, 0]))
      for (let branch = 0; branch < 2; branch += 1) {
        const tine = MeshFactory.mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.3, 6), "#c99d67", [1, 1, 1], [0, 0.25 + branch * 0.2, side * 0.1])
        tine.rotation.x = side * 0.8
        antler.add(tine)
      }
      antler.rotation.x = side * 0.25
      this.object.add(antler)
    }
    const noseX = 0.49 + 0.28 * appearance.muzzleScale[0]
    if (withNose) this.object.add(MeshFactory.mesh(new THREE.SphereGeometry(0.11, 12, 8), "#d8424e", [1, 1, 1], [noseX, 1.16, 0]))
  }
}

export class AccessoryFactory {
  create(racer: Racer): BeaverAccessory {
    switch (racer.accessory) {
      case "Корона": return new SantaHatAccessory(true)
      case "Красная кепка": return new SantaHatAccessory()
      case "Котелок": return new SnowmanHatAccessory()
      case "Плащ чемпиона": return new ScarfAccessory()
      case "Круглые очки": return new CarolerAccessory(racer.appearance)
      case "Молния на хвосте": return new ReindeerAccessory(racer.appearance)
    }
  }
}
