import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class CloudLayer extends SceneEntity {
  private readonly clouds: ReadonlyArray<THREE.Group>

  constructor() {
    super()
    this.clouds = Array.from({ length: 7 }, (_, index) => {
      const cloud = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({ color: index % 2 ? "#fff5d9" : "#ffffff", roughness: 1 })
      for (let puff = 0; puff < 5; puff += 1) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.65 + (puff % 2) * 0.18, 12, 8), material)
        sphere.scale.y = 0.55
        sphere.position.set((puff - 2) * 0.55, Math.sin(puff) * 0.12, 0)
        cloud.add(sphere)
      }
      cloud.position.set(-11 + index * 3.6, 6.8 + (index % 3) * 0.75, -15 - (index % 2) * 3)
      cloud.scale.setScalar(0.7 + (index % 3) * 0.18)
      this.object.add(cloud)
      return cloud
    })
  }

  override update(delta: number): void {
    this.clouds.forEach((cloud, index) => {
      cloud.position.x += delta * (0.12 + index * 0.012)
      if (cloud.position.x > 12) cloud.position.x = -12
    })
  }
}

export class SkyEnvironment extends SceneEntity {
  readonly clouds = new CloudLayer()

  constructor() {
    super()
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(48, 32, 18),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color("#4e9ed6") },
          horizonColor: { value: new THREE.Color("#c8dfaa") },
          bottomColor: { value: new THREE.Color("#f5d28b") },
        },
        vertexShader: `varying vec3 vPosition; void main(){ vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vPosition; uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor; void main(){ float h=normalize(vPosition).y; vec3 color=h>0.05?mix(horizonColor,topColor,smoothstep(0.05,0.72,h)):mix(bottomColor,horizonColor,smoothstep(-0.2,0.05,h)); gl_FragColor=vec4(color,1.0); }`,
      }),
    )
    dome.position.y = -3
    const sun = MeshFactory.mesh(new THREE.SphereGeometry(1.1, 20, 14), "#ffd86a", [1, 1, 1], [-8, 8.4, -20])
    const glow = new THREE.PointLight("#ffdca0", 38, 45, 1.4)
    glow.position.copy(sun.position)
    this.object.add(dome, sun, glow, this.clouds.object)
  }

  override update(delta: number, elapsed: number): void {
    this.clouds.update(delta)
  }
}
