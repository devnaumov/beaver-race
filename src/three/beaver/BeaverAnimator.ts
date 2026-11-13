import * as THREE from "three"
import type { BeaverAppearance } from "../../domain"
import type { BeaverRig } from "./BeaverModel"
import runningMotion from "./running.json"

export function createRunClip(): THREE.AnimationClip {
  const tracks = Object.entries(runningMotion.tracks).map(([bone, angles]) => {
    const values: number[] = []
    for (const angle of angles) {
      // Short beaver limbs need a smaller stride than the source robot.
      const amplitude = bone.startsWith("UpperLeg") ? 0.68 : bone.startsWith("LowerLeg") ? 0.72 : 0.65
      const retargeted = THREE.MathUtils.clamp(angle * amplitude, -1.35, 1.35)
      values.push(0, 0, Math.sin(retargeted / 2), Math.cos(retargeted / 2))
    }
    return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, runningMotion.times, values)
  })
  return new THREE.AnimationClip("Quaternius · Running (beaver retarget)", runningMotion.duration, tracks)
}

export class BeaverAnimator {
  private stridePhase = 0
  private blend = 0
  private readonly mixer: THREE.AnimationMixer
  private readonly run: THREE.AnimationAction
  private readonly idle: THREE.AnimationAction

  constructor(private readonly rig: BeaverRig, private readonly appearance: BeaverAppearance) {
    this.mixer = new THREE.AnimationMixer(rig.root)
    this.run = this.mixer.clipAction(createRunClip()).play()
    this.run.setEffectiveWeight(0)
    const holdingMain = rig.rightArm.socket.children.some((child) => child.name.startsWith("equipment:"))
    const holdingOther = rig.leftArm.socket.children.some((child) => child.name.startsWith("equipment:"))
    const idleAngles: Record<string, number> = {
      UpperArm_R: holdingMain ? 0.55 : 0, LowerArm_R: holdingMain ? 0.75 : 0,
      UpperArm_L: holdingOther ? 0.15 : 0, LowerArm_L: holdingOther ? 0.3 : 0,
    }
    const idleTracks = Object.keys(runningMotion.tracks).map((bone) => {
      const angle = idleAngles[bone] ?? 0
      const q = [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)]
      return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, [0, 1], [...q, ...q])
    })
    this.idle = this.mixer.clipAction(new THREE.AnimationClip("Equipment ready pose", 1, idleTracks)).play()
  }

  update(delta: number, speed: number, running: boolean): { readonly bounce: number; readonly lean: number } {
    const normalizedSpeed = Math.min(1.35, Math.max(0, speed) / 4)
    this.blend = THREE.MathUtils.damp(this.blend, running ? 1 : 0, 10, delta)
    this.run.setEffectiveWeight(this.blend)
    this.idle.setEffectiveWeight(1 - this.blend)
    this.run.setEffectiveTimeScale((0.95 + normalizedSpeed * 0.65) * this.appearance.gaitCadence)
    this.mixer.update(delta)
    this.stridePhase += delta * (running ? 10 + normalizedSpeed * 7 : 2)
    this.rig.spine.rotation.z = Math.sin(this.stridePhase) * 0.025 * this.blend
    this.rig.head.rotation.z = -Math.sin(this.stridePhase) * 0.018 * this.blend
    this.rig.tail.pivot.rotation.y = Math.sin(this.stridePhase * 0.5) * (0.06 + this.blend * 0.13)
    // Keep toes approximately level throughout stance and recovery.
    for (const leg of [this.rig.leftLeg, this.rig.rightLeg]) {
      leg.foot.rotation.z = -(leg.pivot.rotation.z + leg.knee.rotation.z) * 0.65
    }
    return {
      bounce: (0.018 + Math.abs(Math.sin(this.stridePhase)) * (0.04 + normalizedSpeed * 0.035) * this.blend) * this.appearance.gaitBounce,
      lean: -this.appearance.runningLean * normalizedSpeed * this.blend,
    }
  }

  dispose(): void {
    this.mixer.stopAllAction()
    this.mixer.uncacheRoot(this.rig.root)
  }
}
