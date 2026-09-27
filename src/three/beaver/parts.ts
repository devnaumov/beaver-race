import * as THREE from "three"
import type { BeaverAppearance } from "../../domain"
import { BeaverPart } from "./BeaverPart"

export const eyeForwardX = (appearance: BeaverAppearance, z: number): number => {
  const radiusX = 0.47 * appearance.headScale[0]
  const radiusY = 0.47 * appearance.headScale[1]
  const radiusZ = 0.47 * appearance.headScale[2]
  const normalizedX = Math.max(0, 1 - ((1.35 - 1.22) / radiusY) ** 2 - (z / radiusZ) ** 2)
  return 0.17 + radiusX * Math.sqrt(normalizedX) + 0.02
}

export class TorsoPart extends BeaverPart {
  constructor(fur: string, appearance: BeaverAppearance) {
    super()
    const [x, y, z] = appearance.bodyScale
    this.addMesh(new THREE.SphereGeometry(0.58, 18, 13), fur, [1.03 * x, 1.24 * y, 0.9 * z], [0, 0.72, 0])
  }
}

export class BellyPart extends BeaverPart {
  constructor(color: string, appearance: BeaverAppearance) {
    super()
    const geometry = new THREE.CircleGeometry(0.42, 24)
    const belly = this.addMesh(geometry, color, [0.72 * appearance.bodyScale[0], 1.03 * appearance.bodyScale[1], 1], [0.08, 0.67, 0.545 * appearance.bodyScale[2]])
    belly.castShadow = false
  }
}

export class HeadPart extends BeaverPart {
  constructor(fur: string, appearance: BeaverAppearance) {
    super()
    this.addMesh(new THREE.SphereGeometry(0.47, 18, 13), fur, appearance.headScale, [0.17, 1.22, 0])
  }
}

export class FacePart extends BeaverPart {
  constructor(fur: string, appearance: BeaverAppearance) {
    super()
    const muzzle = this.addMesh(new THREE.SphereGeometry(0.25, 14, 10), appearance.belly, appearance.muzzleScale, [0.5, 1.07, 0])
    muzzle.castShadow = true
    this.addMesh(new THREE.SphereGeometry(0.105, 10, 8), "#211713", [1, 0.72, 1], [0.7, 1.13, 0])

    for (const side of [-1, 1]) {
      const z = side * appearance.eyeSpacing
      const eyeX = eyeForwardX(appearance, z)
      this.addMesh(new THREE.SphereGeometry(0.092, 10, 8), "#fffdf3", [1, 1.08, 1], [eyeX, 1.35, z])
      this.addMesh(new THREE.SphereGeometry(0.044, 8, 7), "#14100d", [1, 1, 1], [eyeX + 0.075, 1.35, z])
      this.addMesh(new THREE.SphereGeometry(appearance.earSize, 10, 8), fur, [0.72, 1, 1], [-0.04, 1.5, z * 1.55])
      const tooth = this.addMesh(
        new THREE.BoxGeometry(0.15, 0.23, 0.065),
        "#fff9df",
        [appearance.toothSize, appearance.toothSize, 1],
        [0.68, 0.91, side * 0.075],
      )
      tooth.rotation.z = -0.07
    }
  }
}

export class TailPart extends BeaverPart {
  readonly mesh: THREE.Mesh

  constructor(color: string, appearance: BeaverAppearance) {
    super()
    this.mesh = this.addMesh(new THREE.SphereGeometry(0.42, 12, 9), color, appearance.tailScale, [-0.63, 0.43, 0])
    this.mesh.rotation.z = -0.48
  }
}

export class ArmPart extends BeaverPart {
  readonly pivot = this.object

  constructor(fur: string, front: boolean, appearance: BeaverAppearance) {
    super()
    this.object.position.set(0.28, 0.93, (front ? 1 : -1) * 0.38 * appearance.bodyScale[2])
    this.addMesh(new THREE.CapsuleGeometry(0.115, 0.34, 4, 9), fur, [1, 1, 1], [0, -0.23, 0])
    this.addMesh(new THREE.SphereGeometry(0.13, 10, 8), fur, [1.12, 0.82, 0.9], [0.02, -0.47, 0])
  }
}

export class LegPart extends BeaverPart {
  readonly pivot = this.object

  constructor(fur: string, front: boolean) {
    super()
    this.object.position.set(-0.21, 0.3, front ? 0.32 : -0.27)
    this.addMesh(new THREE.CapsuleGeometry(0.125, 0.28, 4, 9), fur, [1, 1, 1], [0, -0.2, 0])
    this.addMesh(new THREE.SphereGeometry(0.18, 10, 8), appearanceFootColor(fur), [1.35, 0.55, 0.82], [0.14, -0.42, 0.02])
  }
}

const appearanceFootColor = (fur: string): string => new THREE.Color(fur).offsetHSL(0, 0.02, 0.08).getStyle()
