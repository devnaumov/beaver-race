import * as THREE from "three"
import { MeshFactory } from "./MeshFactory"

export const giftBox = (size = 1, color = "#bb3548"): THREE.Group => {
  const gift = new THREE.Group()
  gift.add(
    MeshFactory.mesh(new THREE.BoxGeometry(0.64, 0.56, 0.64), color),
    MeshFactory.mesh(new THREE.BoxGeometry(0.69, 0.1, 0.69), color, [1, 1, 1], [0, 0.3, 0]),
    MeshFactory.mesh(new THREE.BoxGeometry(0.12, 0.58, 0.66), "#edc86f"),
    MeshFactory.mesh(new THREE.BoxGeometry(0.66, 0.58, 0.12), "#edc86f"),
    MeshFactory.mesh(new THREE.BoxGeometry(0.12, 0.015, 0.7), "#edc86f", [1, 1, 1], [0, 0.36, 0]),
    MeshFactory.mesh(new THREE.BoxGeometry(0.7, 0.015, 0.12), "#edc86f", [1, 1, 1], [0, 0.36, 0]),
  )
  for (const side of [-1, 1]) {
    const bow = MeshFactory.mesh(new THREE.TorusGeometry(0.12, 0.032, 6, 12), "#edc86f", [1, 0.55, 1], [side * 0.11, 0.42, 0])
    bow.rotation.y = side * 0.4
    gift.add(bow)
  }
  gift.scale.setScalar(size)
  return gift
}

export const festiveHat = (color = "#bb3548", elf = false): THREE.Group => {
  const hat = new THREE.Group()
  const tip = MeshFactory.mesh(new THREE.ConeGeometry(0.35, 0.65, 14), color, [1, 1, 1], [-0.07, 0.32, 0])
  tip.rotation.z = 0.28
  hat.add(
    tip,
    MeshFactory.mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.14, 18), elf ? "#bb3548" : "#edf5ec"),
    MeshFactory.mesh(new THREE.SphereGeometry(elf ? 0.09 : 0.13, 10, 8), elf ? "#edc86f" : "#edf5ec", [1, 1, 1], [-0.16, 0.65, 0]),
  )
  return hat
}

export const christmasStar = (radius = 0.22): THREE.Mesh => {
  const shape = new THREE.Shape()
  for (let index = 0; index < 10; index += 1) {
    const angle = Math.PI / 2 + index * Math.PI / 5
    const r = index % 2 ? radius * 0.45 : radius
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: "#ffe2a0", side: THREE.DoubleSide }))
}
