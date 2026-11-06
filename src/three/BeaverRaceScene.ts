import * as THREE from "three"
import type { Racer } from "../domain"
import type { RacePhase } from "../gameMachine"
import { gameActor } from "../store"
import { PREVIEW_DURATION, RaceCourse } from "../race/RaceCourse"
import { appearanceKeyFor } from "./beaver/BeaverModel"
import { RacerView } from "./beaver/RacerView"
import type { SceneEntity } from "./core/SceneEntity"
import { BackgroundDuel } from "./environment/BackgroundDuel"
import { CrewPreview } from "./environment/CrewPreview"
import { ForestBackdrop } from "./environment/ForestBackdrop"
import { RiverEnvironment } from "./environment/RiverEnvironment"
import { SkyEnvironment } from "./environment/SkyEnvironment"
import { Snowfall } from "./environment/Snowfall"
import { TrackEnvironment } from "./environment/TrackEnvironment"
import { PullRequestBubbles } from "./PullRequestBubbles"

interface CameraPose {
  readonly position: THREE.Vector3
  readonly target: THREE.Vector3
  readonly fov: number
}

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
  private readonly snow = new Snowfall()
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  private readonly river = new RiverEnvironment()
  private readonly track = new TrackEnvironment()
  private readonly forest = new ForestBackdrop()
  private readonly duel = new BackgroundDuel()
  private readonly preview = new CrewPreview()
  private readonly entities: ReadonlyArray<SceneEntity>
  private readonly resizeObserver: ResizeObserver
  private readonly pullRequestBubbles: PullRequestBubbles
  private frame = 0
  private phase: RacePhase = "lobby"
  private elapsed = 0
  private course = new RaceCourse()
  private duration = this.course.duration
  private travel = 0
  private targetTravel = 0
  private winnerId: string | null = null
  private raceNumber = 0
  private compact = false
  private cameraInitialized = false
  private previewStartedAt = 0

  constructor(private readonly host: HTMLElement) {
    this.entities = [this.sky, this.forest, this.river, this.track, this.duel, this.snow, this.preview]
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.domElement.setAttribute("aria-label", "Christmas beaver race with festive costumes, presents, decorated fir trees, and falling snow")
    this.host.append(this.renderer.domElement)
    this.pullRequestBubbles = new PullRequestBubbles(this.host)

    this.camera.position.set(0, 8.2, 15.5)
    this.camera.lookAt(0, 0.45, -1)
    this.scene.add(this.sky.object, this.forest.object, this.river.object, this.track.object, this.duel.object, this.snow.object, this.racerLayer, this.preview.object)
    this.addLighting()

    const subscription = gameActor.subscribe((snapshot) => {
      this.syncPhase(snapshot.value as RacePhase)
      this.elapsed = snapshot.context.elapsed
      this.duration = snapshot.context.duration
      if (this.course.duration !== this.duration) this.course = new RaceCourse(this.duration)
      this.winnerId = snapshot.context.winnerId
      this.syncRacers(snapshot.context.racers)
      this.syncFinishTape(snapshot.context.raceNumber)
    })
    const initialSnapshot = gameActor.getSnapshot()
    this.syncPhase(initialSnapshot.value as RacePhase)
    this.elapsed = initialSnapshot.context.elapsed
    this.duration = initialSnapshot.context.duration
    this.course = new RaceCourse(this.duration)
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

  private syncPhase(nextPhase: RacePhase): void {
    if (this.phase === nextPhase) return
    const wasPreview = this.phase === "preview"
    this.phase = nextPhase
    const previewing = nextPhase === "preview"
    this.preview.object.visible = previewing
    this.racerLayer.visible = !previewing
    for (const entity of [this.track, this.forest, this.river, this.duel]) entity.object.visible = !previewing
    if (previewing) this.previewStartedAt = performance.now()
    if (previewing || wasPreview) this.cameraInitialized = false
    this.renderer.domElement.setAttribute("aria-label", previewing
      ? "Meet the racers in their selected Christmas costumes around a snowy woodland campfire"
      : "Christmas beaver race with festive costumes, presents, decorated fir trees, and falling snow")
  }

  private addLighting(): void {
    this.scene.add(new THREE.HemisphereLight("#d6edf1", "#324e48", 2.1))
    const sun = new THREE.DirectionalLight("#fff0cf", 3.2)
    sun.position.set(-5, 11, 7)
    sun.castShadow = true
    sun.shadow.mapSize.set(1536, 1536)
    sun.shadow.camera.left = -13
    sun.shadow.camera.right = 13
    sun.shadow.camera.top = 11
    sun.shadow.camera.bottom = -7
    this.scene.add(sun)
    const moonlight = new THREE.DirectionalLight("#a3d8ef", 2.3)
    moonlight.position.set(-7, 7, -10)
    this.scene.add(moonlight)
  }

  private syncRacers(nextRacers: ReadonlyArray<Racer>): void {
    if (this.phase === "preview") this.preview.setRacers(nextRacers, this.compact)
    const leaderProgress = Math.max(0, ...nextRacers.map((racer) => racer.progress))
    this.targetTravel = this.course.travel(leaderProgress)
    if (this.phase === "lobby") {
      this.travel = 0
      this.track.setTravel(0, this.course.finishX(0), false)
      this.cameraInitialized = false
    }
    const nextIds = new Set(nextRacers.map((racer) => racer.id))
    this.racers.forEach((view, id) => {
      if (nextIds.has(id)) return
      view.dispose()
      this.racers.delete(id)
    })

    const laneWidth = Math.min(1.5, 6.25 / Math.max(nextRacers.length - 1, 1))
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
      view.setSnapshot(racer, laneZ, scale, this.phase, this.course.racerX(racer.progress, leaderProgress), this.course.finishX(this.targetTravel), racer.speed * this.course.length / 100)
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
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    if (width < 650) {
      this.compact = true
      this.duel.setCompactMode(true)
    } else {
      this.compact = false
      this.duel.setCompactMode(false)
    }
    this.camera.updateProjectionMatrix()
    this.syncRacers(gameActor.getSnapshot().context.racers)
  }

  private updateFinishTape(): void {
    if (!this.winnerId || this.track.isFinishTapeTorn) return
    if (this.phase !== "finishing") return
    const winner = this.racers.get(this.winnerId)
    const leadingEdge = winner ? winner.object.position.x + winner.object.scale.x * 0.62 : Number.NEGATIVE_INFINITY
    if (leadingEdge >= this.track.finish.position.x) {
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
    if (this.phase === "preview") {
      const progress = THREE.MathUtils.clamp((performance.now() - this.previewStartedAt) / PREVIEW_DURATION, 0, 1)
      return this.preview.cameraPose(progress, this.camera.aspect, this.reducedMotion.matches)
    }
    const overview = this.overviewPose()
    if (this.phase === "lobby" || this.phase === "countdown") return overview

    const packX = this.packCenterX()
    const leaderX = this.fieldFrontX()
    const winnerZ = this.winnerId ? this.racers.get(this.winnerId)?.object.position.z ?? 0 : 0
    const frontFov = this.compact ? 54 : 43
    let laneExtent = 0.7
    this.racers.forEach((racer) => { laneExtent = Math.max(laneExtent, Math.abs(racer.object.position.z) + 0.7) })
    const fieldDistance = laneExtent / (Math.tan(THREE.MathUtils.degToRad(frontFov / 2)) * this.camera.aspect)
    const frontOffset = Math.max(this.compact ? 4.5 : 5.6, fieldDistance - (leaderX - packX + 0.35))
    const front: CameraPose = {
      position: new THREE.Vector3(leaderX + frontOffset, this.compact ? 2.9 : 2.65, 0),
      target: new THREE.Vector3(packX - 0.35, 0.72, 0),
      fov: frontFov,
    }
    const overhead: CameraPose = {
      position: new THREE.Vector3(packX, this.compact ? 12.8 : 12.2, this.compact ? 7.8 : 7.3),
      target: new THREE.Vector3(packX, 0, 0),
      fov: this.compact ? 51 : 42,
    }
    // Track the leader until the real finish arrives, rather than flying ahead to an empty road.
    const finishX = Math.min(this.track.finish.position.x, leaderX)
    const finish: CameraPose = {
      position: new THREE.Vector3(finishX + (this.compact ? 4.8 : 5.5), this.compact ? 2.9 : 2.55, winnerZ),
      target: new THREE.Vector3(finishX - 0.75, 0.76, winnerZ),
      fov: this.compact ? 53 : 41,
    }
    const ratio = this.phase === "finishing" || this.phase === "finished"
      ? 1
      : THREE.MathUtils.clamp(this.elapsed / Math.max(1, this.duration), 0, 1)

    if (this.reducedMotion.matches) return overview
    if (ratio < 0.06) return overview
    if (ratio < 0.18) return blendPose(overview, front, (ratio - 0.06) / 0.12)
    if (ratio < 0.52) return front
    if (ratio < 0.66) return blendPose(front, overhead, (ratio - 0.52) / 0.14)
    if (ratio < 0.78) return overhead
    if (ratio < 0.9) return blendPose(overhead, finish, (ratio - 0.78) / 0.12)
    return finish
  }

  private overviewPose(): CameraPose {
    const x = this.phase === "lobby" ? 0 : this.packCenterX()
    return {
      position: new THREE.Vector3(x, this.compact ? 8.8 : 8.4, this.compact ? 19.5 : 16.2),
      target: new THREE.Vector3(x, 0.45, -1.2),
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
    let front = this.course.startX
    this.racers.forEach((racer) => { front = Math.max(front, racer.object.position.x) })
    return front
  }

  private animate = (): void => {
    this.frame = requestAnimationFrame(this.animate)
    this.timer.update()
    const delta = Math.min(this.timer.getDelta(), 0.05)
    const elapsed = this.timer.getElapsed()
    this.snow.reducedMotion = this.reducedMotion.matches
    this.travel += (this.targetTravel - this.travel) * (1 - Math.exp(-13 * delta))
    const finishX = this.course.finishX(this.travel)
    this.track.setTravel(this.travel, finishX, (this.phase === "racing" || this.phase === "finishing" || this.phase === "finished") && finishX < 22)
    this.forest.setTravel(this.reducedMotion.matches ? 0 : this.travel * 0.8)
    this.river.setTravel(this.travel)
    this.duel.object.position.x = -this.travel
    this.entities.forEach((entity) => {
      const stillPreview = this.phase === "preview" && this.reducedMotion.matches
      if (entity.object.visible) entity.update(stillPreview ? 0 : delta, stillPreview ? 0 : elapsed)
    })
    this.racers.forEach((view) => view.update(delta))
    this.updateFinishTape()
    this.updateCamera(delta)
    const ratio = this.elapsed / Math.max(1, this.duration)
    const closeUp = !this.reducedMotion.matches && ((this.phase === "racing" && ((ratio >= 0.18 && ratio < 0.52) || ratio >= 0.9)) || this.phase === "finishing")
    this.pullRequestBubbles.update(elapsed, closeUp, this.racers, this.camera)
    this.renderer.render(this.scene, this.camera)
  }
}

export const mountRaceScene = (node: HTMLDivElement | null): (() => void) | undefined => {
  if (!node) return undefined
  return new BeaverRaceScene(node).cleanup
}
