import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import type { Racer } from "../../domain"
import { SceneEntity } from "../core/SceneEntity"
import { MeshFactory } from "../core/MeshFactory"
import { BeaverAnimator } from "./BeaverAnimator"
import { RacerBeaver } from "./BeaverModel"

export class CharacterPreview extends SceneEntity {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30)
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly observer: ResizeObserver
  private model: RacerBeaver | null = null
  private animator: BeaverAnimator | null = null
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  private lastTime = 0
  private frame = 0
  private running = false
  private lost = false

  constructor(private readonly host: HTMLElement, onContextLost: () => void) {
    super()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D beaver preview. Use the rotation buttons or drag to orbit.")
    this.renderer.domElement.addEventListener("webglcontextlost", this.contextLost)
    this.onContextLost = onContextLost
    host.append(this.renderer.domElement)
    this.camera.position.set(4.4, 2.25, 3.3)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1, 0)
    this.controls.enablePan = false
    this.controls.enableDamping = true
    this.controls.minDistance = 3
    this.controls.maxDistance = 7
    this.controls.minPolarAngle = 0.4
    this.controls.maxPolarAngle = Math.PI * 0.52
    this.controls.update()
    this.controls.saveState()
    this.scene.add(this.object, new THREE.HemisphereLight("#edf5ec", "#426d62", 3))
    const key = new THREE.DirectionalLight("#ffe5b8", 4)
    key.position.set(3, 5, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = key.shadow.camera.bottom = -3
    key.shadow.camera.right = key.shadow.camera.top = 3
    const rim = new THREE.DirectionalLight("#99dfed", 3)
    rim.position.set(-3, 3, -4)
    this.scene.add(key, rim)
    const podium = MeshFactory.mesh(new THREE.CylinderGeometry(1.22, 1.3, 0.16, 64), "#ece6d1", [1, 1, 1], [0, -0.1, 0])
    const rimMesh = MeshFactory.mesh(new THREE.TorusGeometry(1.24, 0.035, 8, 64), "#bb3548", [1, 1, 1], [0, -0.1, 0])
    rimMesh.rotation.x = Math.PI / 2
    this.object.add(podium, rimMesh)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(host)
    this.resize()
    this.frame = requestAnimationFrame(this.animate)
  }

  private readonly onContextLost: () => void
  private readonly contextLost = (event: Event) => {
    event.preventDefault()
    this.lost = true
    this.onContextLost()
  }

  setRacer(racer: Racer): void {
    const yaw = this.model?.object.rotation.y ?? 0
    this.animator?.dispose()
    this.model?.dispose()
    this.model = new RacerBeaver(racer)
    this.model.object.rotation.y = yaw
    this.animator = new BeaverAnimator(this.model.rig, racer.appearance)
    this.object.add(this.model.object)
  }

  setRunning(running: boolean): void { this.running = running }
  rotate(direction: number): void { if (this.model) this.model.object.rotation.y += direction * Math.PI / 4 }
  resetView(): void {
    this.controls.reset()
    if (this.model) this.model.object.rotation.y = 0
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private readonly animate = (time: number) => {
    this.frame = requestAnimationFrame(this.animate)
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0
    this.lastTime = time
    if (document.hidden || this.lost) return
    if (this.model && this.animator) {
      const pose = this.animator.update(this.reducedMotion.matches ? 0 : delta, this.running ? 4 : 0, this.running)
      this.model.object.position.y = pose.bounce
      this.model.object.rotation.z = pose.lean
    }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  override dispose(): void {
    cancelAnimationFrame(this.frame)
    this.observer.disconnect()
    this.controls.dispose()
    this.animator?.dispose()
    this.renderer.domElement.removeEventListener("webglcontextlost", this.contextLost)
    this.scene.traverse((node) => { if (node instanceof THREE.DirectionalLight) node.shadow.dispose() })
    super.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }
}
