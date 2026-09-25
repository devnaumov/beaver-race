import * as THREE from "three"
import { MeshFactory } from "../core/MeshFactory"
import { SceneEntity } from "../core/SceneEntity"

export class RiverBank extends SceneEntity {
  constructor(z: number, color: string) {
    super()
    this.object.add(MeshFactory.mesh(new THREE.BoxGeometry(23, 0.32, 0.62), color, [1, 1, 1], [0, -0.08, z]))
    for (let index = 0; index < 18; index += 1) {
      const reed = MeshFactory.mesh(new THREE.CylinderGeometry(0.018, 0.027, 0.62 + (index % 3) * 0.14, 5), index % 2 ? "#5f7d31" : "#7e9138", [1, 1, 1], [-10.2 + index * 1.2, 0.24, z + (index % 2 ? 0.18 : -0.18)])
      reed.rotation.z = (index % 3 - 1) * 0.12
      this.object.add(reed)
    }
  }
}

export class RiverEnvironment extends SceneEntity {
  private readonly material: THREE.ShaderMaterial

  constructor() {
    super()
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        deep: { value: new THREE.Color("#246d84") },
        shallow: { value: new THREE.Color("#64c4c4") },
      },
      vertexShader: `uniform float time; varying float wave; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position; wave=sin(p.x*1.8+time*1.7)*0.035+sin(p.y*4.0-time*2.1)*0.018; p.z+=wave; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform float time; uniform vec3 deep; uniform vec3 shallow; varying float wave; varying vec2 vUv; void main(){ float stripe=pow(max(0.0,sin(vUv.x*48.0+vUv.y*10.0-time*2.4)),18.0); vec3 color=mix(deep,shallow,vUv.y*0.72+wave*2.0)+stripe*vec3(0.42,0.42,0.3); gl_FragColor=vec4(color,0.94); }`,
    })
    const water = new THREE.Mesh(new THREE.PlaneGeometry(23, 3.2, 64, 12), this.material)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0.015, -5.35)
    water.receiveShadow = true
    this.object.add(water, new RiverBank(-3.72, "#668940").object, new RiverBank(-6.98, "#527638").object)
  }

  override update(_delta: number, elapsed: number): void {
    this.material.uniforms.time!.value = elapsed
  }
}
