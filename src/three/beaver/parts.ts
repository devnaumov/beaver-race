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
    this.addMesh(new THREE.SphereGeometry(0.58, 32, 24), fur, [1.03 * x, 0.92 * y, 0.9 * z], [0, 0.72, 0])
  }
}

export class BellyPart extends BeaverPart {
  constructor(color: string, appearance: BeaverAppearance) {
    super()
    const geometry = new THREE.SphereGeometry(0.42, 28, 20)
    const belly = this.addMesh(geometry, color, [0.64 * appearance.bodyScale[0], 0.86 * appearance.bodyScale[1], 0.19], [0.08, 0.67, 0.48 * appearance.bodyScale[2]])
    belly.castShadow = false
    const other = belly.clone()
    other.position.z *= -1
    this.object.add(other)
  }
}

export class HeadPart extends BeaverPart {
  constructor(fur: string, appearance: BeaverAppearance) {
    super()
    this.addMesh(new THREE.SphereGeometry(0.47, 32, 24), fur, appearance.headScale, [0.17, 1.22, 0])
    for (const side of [-1, 1]) {
      const tuft = this.addMesh(new THREE.ConeGeometry(0.09, 0.22, 7), fur, [1, 1, 0.7], [-0.18, 1.1, side * 0.32])
      tuft.rotation.x = side * 1.15
    }
  }
}

export class FacePart extends BeaverPart {
  constructor(fur: string, appearance: BeaverAppearance) {
    super()
    const faceOffset = 0.47 * (appearance.headScale[0] - 1)
    const earY = 1.22 + 0.4 * appearance.headScale[1]
    const muzzle = this.addMesh(new THREE.SphereGeometry(0.25, 24, 18), appearance.belly, appearance.muzzleScale, [0.5 + faceOffset, 1.07, 0])
    muzzle.castShadow = true
    this.addMesh(new THREE.SphereGeometry(0.105, 20, 14), "#211713", [1, 0.72, 1], [0.7 + faceOffset, 1.13, 0])

    for (const side of [-1, 1]) {
      const z = side * appearance.eyeSpacing
      const eyeX = eyeForwardX(appearance, z)
      this.addMesh(new THREE.SphereGeometry(0.092, 10, 8), "#fffdf3", [1, 1.08, 1], [eyeX, 1.35, z])
      this.addMesh(new THREE.SphereGeometry(0.044, 8, 7), "#14100d", [1, 1, 1], [eyeX + 0.075, 1.35, z])
      this.addMesh(new THREE.SphereGeometry(appearance.earSize, 20, 14), fur, [0.72, 1, 1], [-0.04, earY, z * 1.55 * appearance.headScale[2]])
      const tooth = this.addMesh(
        new THREE.BoxGeometry(0.15, 0.23, 0.065),
        "#fff9df",
        [appearance.toothSize, appearance.toothSize, 1],
        [0.68 + faceOffset, 0.91, side * 0.075],
      )
      tooth.rotation.z = -0.07
    }
    for (const side of [-1, 1]) {
      const z = side * appearance.eyeSpacing
      this.addMesh(new THREE.SphereGeometry(appearance.earSize * 0.62, 14, 10), "#c18d77", [0.73, 1, 0.7], [0.015, earY + 0.01, z * 1.55 * appearance.headScale[2]])
      this.addMesh(new THREE.SphereGeometry(0.016, 8, 6), "#fff9df", [1, 1, 1], [eyeForwardX(appearance, z) + 0.11, 1.375, z + side * 0.016])
      this.addMesh(new THREE.SphereGeometry(0.15, 20, 14), appearance.belly, [1, 0.85, 0.9], [0.58 + faceOffset, 1.04, side * 0.125])
      for (let index = 0; index < 3; index++) {
        const curve = new THREE.LineCurve3(new THREE.Vector3(0.61 + faceOffset, 1.08 - index * 0.035, side * 0.13), new THREE.Vector3(0.7 + faceOffset, 1.12 - index * 0.07, side * 0.44))
        this.addMesh(new THREE.TubeGeometry(curve, 1, 0.005, 4, false), "#e6c6a1")
      }
    }
  }
}

export class TailPart extends BeaverPart {
  readonly mesh: THREE.Mesh
  readonly pivot = new THREE.Bone()

  constructor(color: string, appearance: BeaverAppearance) {
    super()
    this.mesh = this.addMesh(new THREE.SphereGeometry(0.42, 28, 18), color, appearance.tailScale, [-0.63, 0.26, 0])
    this.mesh.rotation.z = -0.48
    this.pivot.name = "Tail"
    this.object.add(this.pivot)
    this.pivot.add(this.mesh)
    // Raised cross-hatched scales: geometry, not a flat tail decal.
    for (const slope of [-1, 1]) for (let row = -3; row <= 3; row++) {
      const points: THREE.Vector3[] = []
      for (let step = 0; step <= 24; step++) {
        const x = -0.9 + step * 0.075, z = slope * x * 0.65 + row * 0.24
        const r = x * x + z * z
        if (r < 0.9) points.push(new THREE.Vector3(x * 0.42, Math.sqrt(1 - r) * 0.42 + 0.006, z * 0.42))
      }
      if (points.length > 1) {
        const line = this.addMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length, 0.006, 4, false), "#936246")
        line.scale.copy(this.mesh.scale)
        line.position.copy(this.mesh.position)
        line.rotation.copy(this.mesh.rotation)
        this.pivot.add(line)
      }
    }
  }
}

export class ArmPart extends BeaverPart {
  readonly pivot = new THREE.Bone()
  readonly elbow = new THREE.Bone()
  readonly socket = new THREE.Bone()

  constructor(fur: string, front: boolean, appearance: BeaverAppearance) {
    super()
    this.object.position.set(0.28, 0.93, (front ? 1 : -1) * 0.38 * appearance.bodyScale[2])
    const side = front ? "L" : "R"
    this.pivot.name = `UpperArm_${side}`
    this.elbow.name = `LowerArm_${side}`
    this.socket.name = `Paw_${side}`
    this.elbow.position.y = -0.23
    this.socket.position.y = -0.22
    this.object.add(this.pivot)
    this.pivot.add(this.elbow)
    this.elbow.add(this.socket)
    this.pivot.add(this.addMesh(new THREE.CapsuleGeometry(0.115, 0.16, 6, 14), fur, [1, 1, 1], [0, -0.11, 0]))
    this.elbow.add(this.addMesh(new THREE.CapsuleGeometry(0.10, 0.13, 6, 14), fur, [1, 1, 1], [0, -0.1, 0]))
    this.socket.add(this.addMesh(new THREE.SphereGeometry(0.13, 16, 12), fur, [1.12, 0.82, 0.9], [0.02, 0, 0]))
    for (let i = -1; i <= 1; i++) this.socket.add(this.addMesh(new THREE.CapsuleGeometry(0.025, 0.06, 3, 8), "#dfc29d", [1, 1, 1], [0.1, -0.035, i * 0.055]))
  }
}

export class LegPart extends BeaverPart {
  readonly pivot = new THREE.Bone()
  readonly knee = new THREE.Bone()
  readonly foot = new THREE.Bone()

  constructor(fur: string, front: boolean) {
    super()
    this.object.position.set(-0.17, 0.44, (front ? 1 : -1) * 0.28)
    const side = front ? "L" : "R"
    this.pivot.name = `UpperLeg_${side}`
    this.knee.name = `LowerLeg_${side}`
    this.foot.name = `Foot_${side}`
    this.knee.position.y = -0.18
    this.foot.position.y = -0.17
    this.object.add(this.pivot)
    this.pivot.add(this.knee)
    this.knee.add(this.foot)
    this.pivot.add(this.addMesh(new THREE.CapsuleGeometry(0.145, 0.1, 6, 14), fur, [1, 1, 1], [0, -0.08, 0]))
    this.knee.add(this.addMesh(new THREE.CapsuleGeometry(0.115, 0.08, 6, 14), fur, [1, 1, 1], [0, -0.08, 0]))
    this.foot.add(this.addMesh(new THREE.SphereGeometry(0.18, 16, 12), appearanceFootColor(fur), [1.35, 0.48, 0.82], [0.1, 0, 0]))
    for (let i = -1; i <= 1; i++) this.foot.add(this.addMesh(new THREE.SphereGeometry(0.035, 8, 6), "#dfc29d", [1.4, 0.6, 0.6], [0.31, -0.01, i * 0.08]))
  }
}

const appearanceFootColor = (fur: string): string => new THREE.Color(fur).offsetHSL(0, 0.02, 0.08).getStyle()
