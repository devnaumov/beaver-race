import * as THREE from "three"
import { SceneEntity } from "../core/SceneEntity"
import { batWings } from "../core/HalloweenMeshes"

export class CloudLayer extends SceneEntity {
  private readonly clouds: ReadonlyArray<THREE.Group>

  constructor() {
    super()
    this.clouds = Array.from({ length: 7 }, (_, index) => {
      const cloud = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({ color: index % 2 ? "#40334f" : "#51465f", roughness: 1, transparent: true, opacity: 0.45, depthWrite: false })
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
  private readonly bats: THREE.Group[] = []

  constructor() {
    super()
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(48, 32, 18),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color("#0d1029") },
          horizonColor: { value: new THREE.Color("#554263") },
          bottomColor: { value: new THREE.Color("#292231") },
        },
        vertexShader: `varying vec3 vPosition; void main(){ vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vPosition; uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor; void main(){ float h=normalize(vPosition).y; vec3 color=h>0.05?mix(horizonColor,topColor,smoothstep(0.05,0.72,h)):mix(bottomColor,horizonColor,smoothstep(-0.2,0.05,h)); gl_FragColor=vec4(color,1.0); }`,
      }),
    )
    dome.position.y = -3
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 20), new THREE.MeshBasicMaterial({ color: "#fff0c2" }))
    moon.position.set(-7, 4.35, -16)
    for (let index = 0; index < 5; index += 1) {
      const crater = new THREE.Mesh(new THREE.CircleGeometry(0.14 + index * 0.035, 16), new THREE.MeshBasicMaterial({ color: "#d3c9ad", transparent: true, opacity: 0.35 }))
      crater.position.set(-0.6 + (index % 3) * 0.5, -0.5 + Math.floor(index / 3) * 0.8, 1.32)
      moon.add(crater)
    }
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec2 vUv; void main(){float r=length(vUv-0.5)*2.0;gl_FragColor=vec4(0.85,0.75,0.6,pow(max(0.0,1.0-r),2.0)*0.3);}`,
    }))
    halo.position.copy(moon.position).add(new THREE.Vector3(0, 0, -0.2))
    for (let index = 0; index < 9; index += 1) {
      const bat = batWings()
      bat.scale.setScalar(0.2 + (index % 3) * 0.06)
      this.bats.push(bat)
      this.object.add(bat)
    }
    for (let index = 0; index < 55; index += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (index % 3) * 0.008, 4, 4), new THREE.MeshBasicMaterial({ color: "#e0d7fa" }))
      star.position.set(Math.sin(index * 7.13) * 23, 2.8 + (index % 13) * 0.65, -24 - index % 7)
      this.object.add(star)
    }
    this.object.add(dome, halo, moon, this.clouds.object)
  }

  override update(delta: number, elapsed: number): void {
    this.clouds.update(delta)
    this.bats.forEach((bat, index) => {
      bat.position.set(-8 + index * 1.8 + Math.sin(elapsed * 0.3 + index) * 1.5, 4.7 + Math.sin(elapsed * 0.7 + index * 2) * 0.6 + (index % 3) * 0.6, -13 - index % 3)
      bat.rotation.z = Math.sin(elapsed * 1.5 + index) * 0.15
      bat.children.forEach((wing, side) => { wing.rotation.y = Math.sin(elapsed * 7 + index) * 0.55 * (side ? 1 : -1) })
    })
  }
}
