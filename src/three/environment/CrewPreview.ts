import * as THREE from "three"
import type { Racer } from "../../domain"
import { appearanceKeyFor } from "../beaver/BeaverModel"
import { PreviewBeaver, type PreviewPlacement } from "../beaver/PreviewBeaver"
import { christmasStar, giftBox } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

const crewLayout = (count: number, compact: boolean): ReadonlyArray<PreviewPlacement> => {
  if (count <= 3) {
    const spots = count === 2 ? [[-1.8, 0.8], [1.8, 1.5]] : [[-2.7, 0.5], [0.1, 2.1], [2.8, 0.2]]
    return spots.slice(0, count).map(([x, z], index) => ({ x: x!, y: 0, z: z!, yaw: -Math.PI / 2 + (index - 1) * 0.15 }))
  }
  const columns = compact ? count <= 4 ? 2 : 3 : 4
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const rowCount = Math.min(columns, count - row * columns)
    return {
      x: (index % columns - (rowCount - 1) / 2) * 2.85 + (row % 2 ? 0.25 : -0.15),
      y: row * 0.28,
      z: 2.5 - row * 2.7 + Math.sin(index * 2.4) * 0.18,
      yaw: -Math.PI / 2 + (index % 3 - 1) * 0.18,
    }
  })
}

export class CrewPreview extends SceneEntity {
  private readonly crew = new Map<string, PreviewBeaver>()
  private readonly terraces = new THREE.Group()
  private readonly flames = new THREE.Group()
  private readonly firelight = new THREE.PointLight("#ffc67c", 8, 13, 2)
  private readonly embers: THREE.Mesh[] = []
  private placements: ReadonlyArray<PreviewPlacement> = []
  private layoutKey = ""

  constructor() {
    super()
    this.object.visible = false
    this.object.add(MeshFactory.mesh(new THREE.PlaneGeometry(80, 80), "#dcebe9"))
    const ground = this.object.children[0]!
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.04
    this.object.add(this.terraces)
    this.createTrees()
    this.createFire()
    this.createStringLights()
    for (let index = 0; index < 10; index += 1) {
      const gift = giftBox(0.65 + index % 3 * 0.2, index % 2 ? "#bb3548" : "#23735a")
      gift.position.set((index % 2 ? -1 : 1) * (5.9 + Math.sin(index) * 0.5), 0.3, -4 + Math.floor(index / 2) * 1.5)
      gift.rotation.y = index * 0.7
      this.object.add(gift)
    }
    for (const x of [-6.6, 6.6]) {
      const lantern = new THREE.Group()
      lantern.add(
        MeshFactory.mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), "#344d45", [1, 1, 1], [0, 0.07, 0]),
        MeshFactory.mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), "#344d45", [1, 1, 1], [0, 0.62, 0]),
      )
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.46, 0.33), new THREE.MeshBasicMaterial({ color: "#ffe1a1" }))
      glow.position.y = 0.34
      lantern.add(glow)
      lantern.position.set(x, 0, 3.5)
      this.object.add(lantern)
    }
  }

  private createTrees(): void {
    for (let index = 0; index < 11; index += 1) {
      const hero = index === 5
      const tree = new THREE.Group()
      const height = hero ? 6.2 : 3.8 + index % 3 * 0.7
      tree.position.set(-12 + index * 2.4, 0, -9.5 - (index % 2) * 1.2)
      tree.add(MeshFactory.mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.2, 9), "#68503b", [1, 1, 1], [0, 0.4, 0]))
      for (let tier = 0; tier < 4; tier += 1) {
        const radius = (hero ? 1.85 : 1.25) * (1 - tier * 0.2)
        const y = 1.2 + tier * height * 0.19
        tree.add(
          MeshFactory.mesh(new THREE.ConeGeometry(radius, height * 0.4, 12), tier % 2 ? "#24584c" : "#337460", [1, 1, 1], [0, y, 0]),
          MeshFactory.mesh(new THREE.ConeGeometry(radius * 0.85, height * 0.32, 12), "#edf5ec", [1, 1, 1], [0, y + height * 0.07, 0]),
        )
        if (hero) {
          for (let bulb = 0; bulb < 10; bulb += 1) {
            const angle = bulb * Math.PI / 5 + tier * 0.5
            const ornament = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 6), new THREE.MeshBasicMaterial({ color: bulb % 2 ? "#ffe1a1" : "#e86068" }))
            ornament.position.set(Math.cos(angle) * radius * 0.82, y - height * 0.1, Math.sin(angle) * radius * 0.82)
            tree.add(ornament)
          }
        }
      }
      const star = christmasStar(hero ? 0.4 : 0.2)
      star.position.y = 1.2 + height * 0.77
      tree.add(star)
      this.object.add(tree)
    }
  }

  private createFire(): void {
    const fire = new THREE.Group()
    fire.position.set(0, 0, -0.45)
    for (let index = 0; index < 9; index += 1) {
      const angle = index * Math.PI * 2 / 9
      fire.add(MeshFactory.mesh(new THREE.DodecahedronGeometry(0.22, 0), "#82938d", [1, 0.65, 0.85], [Math.cos(angle) * 0.7, 0.13, Math.sin(angle) * 0.7]))
    }
    for (const angle of [-0.65, 0.65]) {
      const log = MeshFactory.mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 8), "#68503b", [1, 1, 1], [0, 0.18, 0])
      log.rotation.set(Math.PI / 2, 0, angle)
      fire.add(log)
    }
    for (let index = 0; index < 3; index += 1) {
      const flame = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshBasicMaterial({ color: index % 2 ? "#ffe1a1" : "#ed9455" }))
      flame.position.set((index - 1) * 0.18, 0.47, 0)
      flame.scale.set(0.7, 1.6 - index * 0.15, 0.8)
      this.flames.add(flame)
    }
    this.firelight.position.set(0, 1.4, 0)
    fire.add(this.flames, this.firelight)
    for (let index = 0; index < 8; index += 1) {
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), new THREE.MeshBasicMaterial({ color: "#ffe1a1", transparent: true }))
      fire.add(ember)
      this.embers.push(ember)
    }
    this.object.add(fire)
  }

  private createStringLights(): void {
    const points = Array.from({ length: 25 }, (_, index) => new THREE.Vector3(-7 + index * 14 / 24, 4.5 + (index - 12) ** 2 / 140, -5.8))
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.018, 4, false), MeshFactory.material("#344d45"))
    this.object.add(cable)
    points.forEach((point, index) => {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: ["#ffe1a1", "#e86068", "#87dcc2"][index % 3]! }))
      bulb.position.copy(point).add(new THREE.Vector3(0, -0.1, 0))
      this.object.add(bulb)
    })
    for (const x of [-7.1, 7.1]) this.object.add(MeshFactory.mesh(new THREE.CylinderGeometry(0.065, 0.12, 5.7, 8), "#68503b", [1, 1, 1], [x, 2.7, -5.8]))
  }

  setRacers(racers: ReadonlyArray<Racer>, compact: boolean): void {
    const key = JSON.stringify([compact, racers.map((racer) => [racer.id, appearanceKeyFor(racer)])])
    if (key === this.layoutKey) return
    this.layoutKey = key
    this.crew.forEach((beaver) => beaver.dispose())
    this.crew.clear()
    this.terraces.children.slice().forEach((child) => {
      const mesh = child as THREE.Mesh
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      this.terraces.remove(child)
    })
    this.placements = crewLayout(racers.length, compact)
    racers.forEach((racer, index) => {
      const placement = this.placements[index]!
      const beaver = new PreviewBeaver(racer, index)
      beaver.setPlacement(placement)
      this.crew.set(racer.id, beaver)
      this.object.add(beaver.object)
      if (placement.y > 0) {
        this.terraces.add(MeshFactory.mesh(new THREE.SphereGeometry(1, 16, 8), "#dcebe9", [1.9, 0.25 + placement.y, 1.6], [placement.x, -0.25, placement.z]))
      }
    })
  }

  cameraPose(progress: number, aspect: number, reducedMotion: boolean) {
    const minZ = Math.min(0, ...this.placements.map((placement) => placement.z))
    const maxZ = Math.max(0, ...this.placements.map((placement) => placement.z))
    const halfWidth = Math.max(3.8, ...this.placements.map((placement) => Math.abs(placement.x) + 1.1))
    const halfDepth = Math.max(3, (maxZ - minZ) / 2 + 1.5)
    const portrait = aspect < 1
    const sweep = portrait ? 0.3 : 0.55
    const angle = reducedMotion ? 0 : THREE.MathUtils.lerp(-sweep, sweep, THREE.MathUtils.smoothstep(progress, 0, 1))
    const fov = portrait ? 50 : 42
    const span = halfWidth * Math.cos(sweep) + halfDepth * Math.sin(sweep)
    const radius = Math.max(10.5, span / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * Math.max(0.35, aspect)) * 1.1)
    const focusZ = (minZ + maxZ) / 2 - 0.6
    return {
      position: new THREE.Vector3(Math.sin(angle) * radius, this.crew.size > 6 ? portrait ? 10.5 : 7 : portrait ? 7 : 5, focusZ + Math.cos(angle) * radius),
      target: new THREE.Vector3(0, 1, focusZ),
      fov,
    }
  }

  override update(delta: number, elapsed: number): void {
    this.crew.forEach((beaver) => beaver.update(delta, elapsed))
    this.flames.children.forEach((flame, index) => {
      flame.scale.y = 1.5 + Math.sin(elapsed * 7 + index * 2) * 0.25
      flame.rotation.y = elapsed * 0.4 + index
    })
    this.firelight.intensity = 8 + Math.sin(elapsed * 6) * 0.5
    this.embers.forEach((ember, index) => {
      const life = (elapsed * 0.6 + index / this.embers.length) % 1
      ember.position.set(Math.sin(index * 2 + life * 4) * life * 0.4, 0.5 + life * 1.6, Math.cos(index * 3) * life * 0.3)
      ;(ember.material as THREE.MeshBasicMaterial).opacity = 1 - life
    })
  }

  override dispose(): void {
    this.crew.forEach((beaver) => beaver.dispose())
    this.crew.clear()
    super.dispose()
  }
}
