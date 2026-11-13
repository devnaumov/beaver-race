import type { Racer } from "../../domain"
import type { RacePhase } from "../../gameMachine"
import { SceneEntity } from "../core/SceneEntity"
import { BeaverAnimator } from "./BeaverAnimator"
import { NameTag } from "./NameTag"
import { RacerBeaver } from "./BeaverModel"

export class RacerView extends SceneEntity {
  readonly model: RacerBeaver
  readonly appearanceKey: string
  private readonly animator: BeaverAnimator
  private targetX = -7.65
  private speed = 0
  private phase: RacePhase = "lobby"
  private positioned = false

  constructor(readonly id: string, racer: Racer) {
    super()
    this.model = new RacerBeaver(racer)
    this.appearanceKey = this.model.appearanceKey
    this.animator = new BeaverAnimator(this.model.rig, racer.appearance)
    this.object.add(this.model.object, new NameTag(racer.name).object)
    this.object.position.x = -7.65
  }

  setSnapshot(racer: Racer, laneZ: number, scale: number, phase: RacerView["phase"], x: number, finishX: number, worldSpeed: number): void {
    this.targetX = phase === "finishing" || phase === "finished" ? finishX + 1.7 + racer.seed % 3 * 0.15 : x
    if (!this.positioned || phase === "lobby") {
      this.object.position.x = this.targetX
      this.positioned = true
    }
    this.speed = worldSpeed
    this.phase = phase
    this.object.position.z = laneZ
    this.object.scale.setScalar(scale)
  }

  override update(delta: number): void {
    const follow = 1 - Math.exp(-13 * delta)
    const step = (this.targetX - this.object.position.x) * follow
    this.object.position.x += this.phase === "finishing" ? Math.min(step, delta * 4) : step
    const running = this.phase === "racing" || Math.abs(this.targetX - this.object.position.x) > 0.035
    const pose = this.animator.update(delta, this.speed, running)
    this.model.object.position.y = pose.bounce
    this.model.object.rotation.z += (pose.lean - this.model.object.rotation.z) * (1 - Math.exp(-8 * delta))
  }

  override dispose(): void {
    this.animator.dispose()
    super.dispose()
  }
}
