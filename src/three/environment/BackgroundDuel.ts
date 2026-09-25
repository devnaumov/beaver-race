import type { Racer } from "../../domain"
import { createRacer, databaseStickers } from "../../domain"
import { SceneEntity } from "../core/SceneEntity"
import { FlagBearerBeaver } from "../beaver/BeaverModel"
import { CloudBeaverFlag, DBeaverFlag, type BrandFlag } from "./BrandFlag"

interface Fighter {
  readonly beaver: FlagBearerBeaver
  readonly flag: BrandFlag
}

const mascot = (name: string, fur: string, accent: string, seed: number): Racer => ({
  ...createRacer(name, seed),
  fur,
  accent,
  accessory: name === "DBeaver" ? "Красная кепка" : "Котелок",
  sticker: databaseStickers[0]!,
})

export class BackgroundDuel extends SceneEntity {
  private readonly dbeaver: Fighter
  private readonly cloudbeaver: Fighter

  constructor() {
    super()
    this.dbeaver = this.createFighter(new FlagBearerBeaver(mascot("DBeaver", "#a96332", "#e94735", 0.17), "#ec513d"), new DBeaverFlag(), -4.1, false)
    this.cloudbeaver = this.createFighter(new FlagBearerBeaver(mascot("CloudBeaver", "#315d67", "#4598d3", 0.73), "#2b82d8"), new CloudBeaverFlag(), 4.1, true)
  }

  setCompactMode(compact: boolean): void {
    this.dbeaver.beaver.object.position.x = compact ? -2.75 : -4.1
    this.cloudbeaver.beaver.object.position.x = compact ? 2.75 : 4.1
  }

  private createFighter(beaver: FlagBearerBeaver, flag: BrandFlag, x: number, mirrored: boolean): Fighter {
    beaver.object.scale.setScalar(1.7)
    beaver.object.position.set(x, 0.23, -7.15)
    beaver.object.rotation.y = mirrored ? Math.PI + 0.12 : -0.12
    flag.object.position.set(mirrored ? -0.62 : -0.64, 0.45, 0.32)
    flag.object.rotation.y = mirrored ? Math.PI : 0
    flag.object.scale.setScalar(0.67)
    beaver.object.add(flag.object)
    this.object.add(beaver.object)
    return { beaver, flag }
  }

  override update(delta: number, elapsed: number): void {
    this.dbeaver.flag.update(delta, elapsed)
    this.cloudbeaver.flag.update(delta, elapsed + 0.7)
    const punch = Math.sin(elapsed * 3.4)
    this.dbeaver.beaver.rig.leftArm.pivot.rotation.z = -0.45 + Math.max(0, punch) * 0.8
    this.cloudbeaver.beaver.rig.rightArm.pivot.rotation.z = 0.45 - Math.min(0, punch) * 0.8
    this.dbeaver.beaver.object.position.y = 0.23 + Math.abs(Math.sin(elapsed * 2.1)) * 0.08
    this.cloudbeaver.beaver.object.position.y = 0.23 + Math.abs(Math.cos(elapsed * 2.1)) * 0.08
  }
}
