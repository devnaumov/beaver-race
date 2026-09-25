import type { BeaverAppearance } from "../../domain"
import type { BeaverRig } from "./BeaverModel"

export class BeaverAnimator {
  private stridePhase = 0

  constructor(private readonly rig: BeaverRig, private readonly appearance: BeaverAppearance) {}

  update(delta: number, speed: number, running: boolean): { readonly bounce: number; readonly lean: number } {
    const normalizedSpeed = Math.min(1.35, speed / 11)
    const cadence = running ? (5.5 + normalizedSpeed * 8.5) * this.appearance.gaitCadence : 2
    this.stridePhase += delta * cadence
    const stride = Math.sin(this.stridePhase) * (running ? 0.35 + normalizedSpeed * 0.38 : 0.05)
    this.rig.leftLeg.pivot.rotation.z = stride
    this.rig.rightLeg.pivot.rotation.z = -stride
    this.rig.leftArm.pivot.rotation.z = -stride * 0.74
    this.rig.rightArm.pivot.rotation.z = stride * 0.74
    this.rig.tail.mesh.rotation.y = Math.sin(this.stridePhase * 0.62) * (running ? 0.18 + normalizedSpeed * 0.1 : 0.08)
    return {
      bounce: Math.abs(Math.sin(this.stridePhase)) * (running ? 0.055 + normalizedSpeed * 0.08 : 0.018) * this.appearance.gaitBounce,
      lean: running ? -this.appearance.runningLean * normalizedSpeed : 0,
    }
  }
}
