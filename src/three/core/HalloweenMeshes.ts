import * as THREE from "three"
import { MeshFactory } from "./MeshFactory"

export const jackOLantern = (size = 1): THREE.Group => {
  const pumpkin = new THREE.Group()
  for (let rib = 0; rib < 8; rib += 1) {
    const angle = rib * Math.PI / 4
    pumpkin.add(MeshFactory.mesh(new THREE.SphereGeometry(0.3, 12, 9), rib % 2 ? "#ed761a" : "#c94b0c", [0.78, 1, 0.78], [Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16]))
  }
  const glow = new THREE.MeshBasicMaterial({ color: "#ffe181", side: THREE.DoubleSide })
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.075, 3), glow)
    eye.position.set(side * 0.135, 0.065, 0.395)
    eye.rotation.z = Math.PI / 2
    pumpkin.add(eye)
  }
  const grin = new THREE.Shape()
  grin.moveTo(-0.22, 0)
  grin.lineTo(-0.12, -0.09)
  grin.lineTo(0.12, -0.09)
  grin.lineTo(0.22, 0)
  grin.lineTo(0.055, -0.035)
  grin.lineTo(0.055, -0.005)
  grin.lineTo(-0.015, -0.005)
  grin.lineTo(-0.015, -0.035)
  grin.closePath()
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(grin), glow)
  mouth.position.set(0, -0.09, 0.395)
  const stem = MeshFactory.mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.16, 6), "#647443", [1, 1, 1], [0, 0.34, 0])
  stem.rotation.z = -0.2
  pumpkin.add(mouth, stem)
  pumpkin.scale.setScalar(size)
  return pumpkin
}

export const batWings = (color = "#161323"): THREE.Group => {
  const wings = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0.2, 0.32, 0.55, 0.4, 0.9, 0.5)
  shape.lineTo(0.72, -0.12)
  shape.quadraticCurveTo(0.57, 0.08, 0.43, -0.22)
  shape.quadraticCurveTo(0.28, -0.04, 0.16, -0.28)
  shape.closePath()
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }))
    wing.scale.x = side
    wings.add(wing)
  }
  return wings
}
