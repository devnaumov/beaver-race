import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"
import { LoopingInstances } from "./LoopingStrip"

export class RiverBank extends SceneEntity {
  private readonly scenery: LoopingInstances

  constructor(z: number, color: string) {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(90, 0.32, 0.62), color, [1, 1, 1], [0, -0.08, z]))
    const transform = new THREE.Object3D()
    const placements = Array.from({ length: 60 }, (_, index) => {
      transform.position.set(-35.4 + index * 1.2, 0.24, z + (index % 2 ? 0.18 : -0.18))
      transform.scale.set(1, 0.62 + (index % 3) * 0.14, 1)
      transform.rotation.z = (index % 3 - 1) * 0.12
      transform.updateMatrix()
      return transform.matrix.clone()
    })
    this.scenery = new LoopingInstances(new THREE.CylinderGeometry(0.018, 0.027, 1, 5), MeshFactory.material("#e5f0ed"), placements)
    this.object.add(this.scenery.mesh)
  }

  setTravel(distance: number): void {
    this.scenery.setTravel(distance)
  }

  override dispose(): void {
    this.scenery.dispose()
    super.dispose()
  }
}

export class RiverEnvironment extends SceneEntity {
  private readonly material: THREE.ShaderMaterial
  private readonly mist: THREE.ShaderMaterial
  private readonly banks = [new RiverBank(-3.72, "#dcebe9"), new RiverBank(-6.98, "#e5f0ed")]

  constructor() {
    super()
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        deep: { value: new THREE.Color("#386f84") },
        shallow: { value: new THREE.Color("#b5dcdf") },
      },
      vertexShader: `uniform float time; varying float wave; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position; wave=sin(p.x*1.8+time*1.7)*0.035+sin(p.y*4.0-time*2.1)*0.018; p.z+=wave; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform float time; uniform vec3 deep; uniform vec3 shallow; varying float wave; varying vec2 vUv; void main(){ float stripe=pow(max(0.0,sin(vUv.x*48.0+vUv.y*10.0-time*2.4)),18.0); vec3 color=mix(deep,shallow,vUv.y*0.72+wave*2.0)+stripe*vec3(0.42,0.42,0.3); gl_FragColor=vec4(color,0.94); }`,
    })
    const water = new THREE.Mesh(new THREE.PlaneGeometry(90, 3.2, 128, 12), this.material)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0.015, -5.35)
    water.receiveShadow = true
    this.mist = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float time;varying vec2 vUv;void main(){float edge=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);float w=sin(vUv.x*22.0+sin(vUv.y*8.0)+time*0.25)*0.5+0.5;gl_FragColor=vec4(0.8,0.92,0.92,edge*w*0.12);}`,
    })
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(90, 4), this.mist)
    mist.rotation.x = -Math.PI / 2 + 0.12
    mist.position.set(0, 0.6, -5.6)
    this.object.add(water, mist, ...this.banks.map((bank) => bank.object))
  }

  setTravel(distance: number): void {
    this.banks.forEach((bank) => bank.setTravel(distance))
  }

  override update(_delta: number, elapsed: number): void {
    this.material.uniforms.time!.value = elapsed
    this.mist.uniforms.time!.value = elapsed
  }

  override dispose(): void {
    this.banks.forEach((bank) => bank.dispose())
    super.dispose()
  }
}
