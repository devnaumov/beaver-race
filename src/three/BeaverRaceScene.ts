import * as THREE from "three"
import type { Racer } from "../domain"
import { gameActor } from "../store"
import { appearanceKeyFor } from "./beaver/BeaverModel"
import { RacerView } from "./beaver/RacerView"
import type { SceneEntity } from "./core/SceneEntity"
import { BackgroundDuel } from "./environment/BackgroundDuel"
import { ForestBackdrop } from "./environment/ForestBackdrop"
import { RiverEnvironment } from "./environment/RiverEnvironment"
import { SkyEnvironment } from "./environment/SkyEnvironment"
import { TrackEnvironment } from "./environment/TrackEnvironment"
import { PullRequestBubbles } from "./PullRequestBubbles"

type RacePhase = "lobby" | "countdown" | "racing" | "finishing" | "finished"

interface CameraPose {
  readonly position: THREE.Vector3
  readonly target: THREE.Vector3
  readonly fov: number
}

const FINISH_X = 7.75

const blendPose = (from: CameraPose, to: CameraPose, amount: number): CameraPose => {
  const t = THREE.MathUtils.smoothstep(amount, 0, 1)
  return {
    position: from.position.clone().lerp(to.position, t),
    target: from.target.clone().lerp(to.target, t),
    fov: THREE.MathUtils.lerp(from.fov, to.fov, t),
  }
}

export class BeaverRaceScene {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
  private readonly timer = new THREE.Timer()
  private readonly cameraTarget = new THREE.Vector3()
  private readonly racers = new Map<string, RacerView>()
  private readonly racerLayer = new THREE.Group()
  private readonly sky = new SkyEnvironment()
  private readonly river = new RiverEnvironment()
  private readonly track = new TrackEnvironment()
  private readonly forest = new ForestBackdrop()
  private readonly duel = new BackgroundDuel()
  private readonly entities: ReadonlyArray<SceneEntity>
  private readonly resizeObserver: ResizeObserver
  private readonly pullRequestBubbles: PullRequestBubbles
  private frame = 0
  private phase: RacePhase = "lobby"
  private elapsed = 0
  private duration = 10_000
  private winnerId: string | null = null
  private raceNumber = 0
  private horizontalScale = 1
  private compact = false
  private cameraInitialized = false

  constructor(private readonly host: HTMLElement) {
    this.entities = [this.sky, this.forest, this.river, this.track, this.duel]
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.domElement.setAttribute("aria-label", "Halloween beaver race with costumed racers, glowing pumpkins, bats, and a moonlit forest")
    this.host.append(this.renderer.domElement)
    this.pullRequestBubbles = new PullRequestBubbles(this.host)

    this.camera.position.set(0, 8.2, 15.5)
    this.camera.lookAt(0, 0.45, -1)
    this.scene.add(this.sky.object, this.forest.object, this.river.object, this.track.object, this.duel.object, this.racerLayer)
    this.addLighting()

    const subscription = gameActor.subscribe((snapshot) => {
      this.phase = snapshot.value as RacePhase
      this.elapsed = snapshot.context.elapsed
      this.duration = snapshot.context.duration
      this.winnerId = snapshot.context.winnerId
      this.syncRacers(snapshot.context.racers)
      this.syncFinishTape(snapshot.context.raceNumber)
    })
    const initialSnapshot = gameActor.getSnapshot()
    this.phase = initialSnapshot.value as RacePhase
    this.elapsed = initialSnapshot.context.elapsed
    this.duration = initialSnapshot.context.duration
    this.winnerId = initialSnapshot.context.winnerId
    this.syncRacers(initialSnapshot.context.racers)
    this.syncFinishTape(initialSnapshot.context.raceNumber)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    this.timer.connect(document)
    this.resize()
    this.animate()

    this.cleanup = () => {
      cancelAnimationFrame(this.frame)
      subscription.unsubscribe()
      this.resizeObserver.disconnect()
      this.timer.dispose()
      this.pullRequestBubbles.dispose()
      this.racers.forEach((view) => view.dispose())
      this.racers.clear()
      this.entities.forEach((entity) => entity.dispose())
      this.renderer.dispose()
      this.renderer.domElement.remove()
    }
  }

  readonly cleanup: () => void

  private addLighting(): void {
    this.scene.add(new THREE.HemisphereLight("#b8b2ef", "#35233d", 2.1))
    const sun = new THREE.DirectionalLight("#ffe0bc", 3.2)
    sun.position.set(-5, 11, 7)
    sun.castShadow = true
    sun.shadow.mapSize.set(1536, 1536)
    sun.shadow.camera.left = -13
    sun.shadow.camera.right = 13
    sun.shadow.camera.top = 11
    sun.shadow.camera.bottom = -7
    this.scene.add(sun)
    const moonlight = new THREE.DirectionalLight("#969bff", 2.3)
    moonlight.position.set(-7, 7, -10)
    this.scene.add(moonlight)
  }

  private syncRacers(nextRacers: ReadonlyArray<Racer>): void {
    const nextIds = new Set(nextRacers.map((racer) => racer.id))
    this.racers.forEach((view, id) => {
      if (nextIds.has(id)) return
      view.dispose()
      this.racers.delete(id)
    })

    const laneWidth = Math.min(0.58, 6.25 / Math.max(nextRacers.length - 1, 1))
    nextRacers.forEach((racer, index) => {
      let view = this.racers.get(racer.id)
      if (view && view.appearanceKey !== appearanceKeyFor(racer)) {
        view.dispose()
        this.racers.delete(racer.id)
        view = undefined
      }
      if (!view) {
        view = new RacerView(racer.id, racer)
        this.racers.set(racer.id, view)
        this.racerLayer.add(view.object)
      }
      const laneZ = (index - (nextRacers.length - 1) / 2) * laneWidth
      const scale = nextRacers.length > 8 ? 0.67 : nextRacers.length > 5 ? 0.77 : 0.88
      view.setSnapshot(racer, laneZ, scale, this.phase, this.horizontalScale)
    })
  }

  private syncFinishTape(nextRaceNumber: number): void {
    if (!this.winnerId) {
      if (this.raceNumber !== nextRaceNumber || this.phase === "lobby") this.track.armFinishTape(0)
      this.raceNumber = nextRaceNumber
      return
    }
    if (this.raceNumber === nextRaceNumber) return
    this.raceNumber = nextRaceNumber
    const winner = this.racers.get(this.winnerId)
    this.track.armFinishTape(winner?.object.position.z ?? 0)
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    const previousScale = this.horizontalScale
    const nextScale = width < 650 ? 0.62 : 1
    if (previousScale !== nextScale) {
      this.racers.forEach((racer) => racer.rescaleHorizontal(previousScale, nextScale))
    }
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    if (width < 650) {
      this.compact = true
      this.horizontalScale = nextScale
      this.track.object.scale.x = this.horizontalScale
      this.duel.setCompactMode(true)
    } else {
      this.compact = false
      this.horizontalScale = nextScale
      this.track.object.scale.x = 1
      this.duel.setCompactMode(false)
    }
    this.camera.updateProjectionMatrix()
    this.syncRacers(gameActor.getSnapshot().context.racers)
  }

  private updateFinishTape(): void {
    if (!this.winnerId || this.track.isFinishTapeTorn) return
    if (this.phase !== "racing" && this.phase !== "finishing") return
    const winner = this.racers.get(this.winnerId)
    const leadingEdge = winner ? winner.object.position.x + winner.object.scale.x * 0.62 : Number.NEGATIVE_INFINITY
    if (leadingEdge >= FINISH_X * this.horizontalScale) {
      this.track.tearFinishTape()
    }
  }

  private updateCamera(delta: number): void {
    const pose = this.desiredCameraPose()
    if (!this.cameraInitialized) {
      this.camera.position.copy(pose.position)
      this.cameraTarget.copy(pose.target)
      this.camera.fov = pose.fov
      this.cameraInitialized = true
    } else {
      const follow = 1 - Math.exp(-3.2 * delta)
      this.camera.position.lerp(pose.position, follow)
      this.cameraTarget.lerp(pose.target, follow)
      this.camera.fov += (pose.fov - this.camera.fov) * follow
    }
    this.camera.lookAt(this.cameraTarget)
    this.camera.updateProjectionMatrix()
  }

  private desiredCameraPose(): CameraPose {
    const overview = this.overviewPose()
    if (this.phase === "lobby" || this.phase === "countdown") return overview

    const packX = this.packCenterX()
    const leaderX = this.fieldFrontX()
    const winnerZ = this.winnerId ? this.racers.get(this.winnerId)?.object.position.z ?? 0 : 0
    const front: CameraPose = {
      position: new THREE.Vector3(leaderX + (this.compact ? 4.5 : 5.6), this.compact ? 2.9 : 2.65, 0),
      target: new THREE.Vector3(packX - 0.35, 0.72, 0),
      fov: this.compact ? 54 : 43,
    }
    const overhead: CameraPose = {
      position: new THREE.Vector3(packX, this.compact ? 12.8 : 12.2, this.compact ? 7.8 : 7.3),
      target: new THREE.Vector3(packX, 0, 0),
      fov: this.compact ? 51 : 42,
    }
    const finishX = FINISH_X * this.horizontalScale
    const finish: CameraPose = {
      position: new THREE.Vector3(finishX + (this.compact ? 4.8 : 5.5), this.compact ? 2.9 : 2.55, winnerZ),
      target: new THREE.Vector3(finishX - 0.75, 0.76, winnerZ),
      fov: this.compact ? 53 : 41,
    }
    const ratio = this.phase === "finishing" || this.phase === "finished"
      ? 1
      : THREE.MathUtils.clamp(this.elapsed / Math.max(1, this.duration), 0, 1)

    if (ratio < 0.06) return overview
    if (ratio < 0.18) return blendPose(overview, front, (ratio - 0.06) / 0.12)
    if (ratio < 0.52) return front
    if (ratio < 0.66) return blendPose(front, overhead, (ratio - 0.52) / 0.14)
    if (ratio < 0.78) return overhead
    if (ratio < 0.9) return blendPose(overhead, finish, (ratio - 0.78) / 0.12)
    return finish
  }

  private overviewPose(): CameraPose {
    return {
      position: new THREE.Vector3(0, this.compact ? 8.8 : 8.4, this.compact ? 19.5 : 16.2),
      target: new THREE.Vector3(0, 0.45, -1.2),
      fov: this.compact ? 58 : 40,
    }
  }

  private packCenterX(): number {
    if (this.racers.size === 0) return 0
    let total = 0
    this.racers.forEach((racer) => { total += racer.object.position.x })
    return total / this.racers.size
  }

  private fieldFrontX(): number {
    let front = -7.65 * this.horizontalScale
    this.racers.forEach((racer) => { front = Math.max(front, racer.object.position.x) })
    return front
  }

  private animate = (): void => {
    this.frame = requestAnimationFrame(this.animate)
    this.timer.update()
    const delta = Math.min(this.timer.getDelta(), 0.05)
    const elapsed = this.timer.getElapsed()
    this.entities.forEach((entity) => entity.update(delta, elapsed))
    this.racers.forEach((view) => view.update(delta))
    this.updateFinishTape()
    this.updateCamera(delta)
    const ratio = this.elapsed / Math.max(1, this.duration)
    const closeUp = (this.phase === "racing" && ((ratio >= 0.18 && ratio < 0.52) || ratio >= 0.9)) || this.phase === "finishing"
    this.pullRequestBubbles.update(elapsed, closeUp, this.racers, this.camera)
    this.renderer.render(this.scene, this.camera)
  }
}

export const mountRaceScene = (node: HTMLDivElement | null): (() => void) | undefined => {
  if (!node) return undefined
  return new BeaverRaceScene(node).cleanup
}
