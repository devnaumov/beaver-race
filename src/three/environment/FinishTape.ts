import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

const FINISH_X = 7.75
const OUTER_Z = 3.32
const TAPE_Y = 0.82

interface TapeHalf {
  readonly pivot: THREE.Group
  readonly ribbon: THREE.Mesh
  readonly marks: ReadonlyArray<THREE.Mesh>
  readonly direction: 1 | -1
}

interface TapeFragment {
  readonly mesh: THREE.Mesh
  readonly initialVelocity: THREE.Vector3
  readonly velocity: THREE.Vector3
  readonly spin: THREE.Vector3
}

const smoothStep = (value: number): number => value * value * (3 - 2 * value)
const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3)

export class FinishTape extends SceneEntity {
  private readonly negativeHalf = this.createHalf(-OUTER_Z, 1)
  private readonly positiveHalf = this.createHalf(OUTER_Z, -1)
  private readonly fragments: ReadonlyArray<TapeFragment>
  private tearZ = 0
  private tearElapsed = 0
  private torn = false

  constructor() {
    super()
    const wood = "#70452a"
    for (const z of [-3.44, 3.44]) {
      this.object.add(
        MeshFactory.mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.72, 10), wood, [1, 1, 1], [FINISH_X, 0.68, z]),
        MeshFactory.mesh(new THREE.SphereGeometry(0.095, 12, 9), "#f5b335", [1, 1, 1], [FINISH_X, 1.57, z]),
      )
    }
    this.object.add(this.negativeHalf.pivot, this.positiveHalf.pivot)
    this.fragments = Array.from({ length: 10 }, (_, index) => {
      const mesh = MeshFactory.mesh(new THREE.BoxGeometry(0.035, 0.075, 0.12), index % 3 === 0 ? "#f6d66b" : "#d92f2f")
      mesh.visible = false
      this.object.add(mesh)
      const side = index % 2 === 0 ? -1 : 1
      const initialVelocity = new THREE.Vector3(0.72 + (index % 4) * 0.16, 0.8 + (index % 3) * 0.23, side * (0.42 + index * 0.055))
      return {
        mesh,
        initialVelocity,
        velocity: initialVelocity.clone(),
        spin: new THREE.Vector3(2.2 + index * 0.18, side * (2.8 + index * 0.11), 3.4 - index * 0.12),
      }
    })
    this.arm(0)
  }

  get isTorn(): boolean {
    return this.torn
  }

  arm(laneZ: number): void {
    this.tearZ = THREE.MathUtils.clamp(laneZ, -2.95, 2.95)
    this.tearElapsed = 0
    this.torn = false
    this.configureHalf(this.negativeHalf, -OUTER_Z, this.tearZ)
    this.configureHalf(this.positiveHalf, OUTER_Z, this.tearZ)
    for (const fragment of this.fragments) {
      fragment.mesh.visible = false
      fragment.mesh.position.set(FINISH_X, TAPE_Y, this.tearZ)
      fragment.mesh.rotation.set(0, 0, 0)
      fragment.velocity.copy(fragment.initialVelocity)
    }
  }

  tear(): void {
    if (this.torn) return
    this.torn = true
    for (const fragment of this.fragments) fragment.mesh.visible = true
  }

  override update(delta: number): void {
    if (!this.torn) return
    this.tearElapsed = Math.min(1.4, this.tearElapsed + delta)
    const snap = easeOutCubic(Math.min(1, this.tearElapsed / 0.34))
    const fall = smoothStep(Math.min(1, Math.max(0, (this.tearElapsed - 0.08) / 0.95)))
    const flick = Math.sin(Math.min(1, this.tearElapsed / 0.3) * Math.PI) * 0.22

    this.negativeHalf.pivot.position.x = FINISH_X + flick
    this.positiveHalf.pivot.position.x = FINISH_X + flick
    this.negativeHalf.pivot.rotation.set(fall * 1.08, snap * 0.62, -fall * 0.08)
    this.positiveHalf.pivot.rotation.set(-fall * 1.08, -snap * 0.62, fall * 0.08)

    for (const fragment of this.fragments) {
      fragment.velocity.y -= 2.7 * delta
      fragment.mesh.position.addScaledVector(fragment.velocity, delta)
      fragment.mesh.rotation.x += fragment.spin.x * delta
      fragment.mesh.rotation.y += fragment.spin.y * delta
      fragment.mesh.rotation.z += fragment.spin.z * delta
    }
  }

  private createHalf(outerZ: number, direction: 1 | -1): TapeHalf {
    const pivot = new THREE.Group()
    pivot.position.set(FINISH_X, TAPE_Y, outerZ)
    const ribbon = MeshFactory.mesh(new THREE.BoxGeometry(0.045, 0.18, 1), "#d92f2f")
    pivot.add(ribbon)
    const marks = Array.from({ length: 4 }, () => {
      const mark = MeshFactory.mesh(new THREE.BoxGeometry(0.018, 0.095, 0.16), "#f6d66b")
      pivot.add(mark)
      return mark
    })
    return { pivot, ribbon, marks, direction }
  }

  private configureHalf(half: TapeHalf, outerZ: number, innerZ: number): void {
    const length = Math.max(0.12, Math.abs(innerZ - outerZ))
    half.pivot.position.set(FINISH_X, TAPE_Y, outerZ)
    half.pivot.rotation.set(0, 0, 0)
    half.ribbon.scale.set(1, 1, length)
    half.ribbon.position.set(0, 0, half.direction * length * 0.5)
    half.marks.forEach((mark, index) => {
      mark.position.set(0.032, 0, half.direction * length * ((index + 1) / 5))
    })
  }
}
