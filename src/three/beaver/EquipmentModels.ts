import * as THREE from "three"
import type { Racer } from "../../domain"
import type { EquipmentId } from "../../equipment"
import { giftBox } from "../core/ChristmasMeshes"
import { MeshFactory } from "../core/MeshFactory"
import { batchStaticMeshes } from "../core/batchStaticMeshes"
import { CarolerAccessory, ReindeerAccessory, SantaHatAccessory, ScarfAccessory, SnowmanHatAccessory } from "./Accessories"

const snow = "#f1ecd9", gold = "#d7ae55", green = "#23735a", red = "#bb3548", ice = "#8ed9e8"
const mesh = MeshFactory.mesh.bind(MeshFactory)
const sphere = (r: number) => new THREE.SphereGeometry(r, 20, 14)
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z)
const metal = (geometry: THREE.BufferGeometry, color: string, position: [number, number, number] = [0, 0, 0]) => {
  const item = mesh(geometry, color, [1, 1, 1], position)
  ;(item.material as THREE.Material).dispose()
  item.material = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.65 })
  return item
}

function extrude(points: [number, number][], depth: number, color: string): THREE.Mesh {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.012, bevelThickness: 0.012 })
  geometry.translate(0, 0, -depth / 2)
  return metal(geometry, color)
}

function star(radius: number, color = gold) {
  return extrude(Array.from({ length: 10 }, (_, i) => {
    const angle = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * 0.45 : radius
    return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number]
  }), 0.045, color)
}

function bow(color = red): THREE.Group {
  const group = new THREE.Group()
  for (const side of [-1, 1]) {
    const loop = mesh(new THREE.TorusGeometry(0.13, 0.045, 8, 20), color, [1, 0.65, 1], [side * 0.13, 0, 0])
    loop.rotation.y = side * 0.35
    const ribbon = mesh(box(0.105, 0.22, 0.035), color, [1, 1, 1], [side * 0.075, -0.15, 0])
    ribbon.rotation.z = side * 0.25
    group.add(loop, ribbon)
  }
  group.add(mesh(sphere(0.065), gold))
  return group
}

function bell(size = 1): THREE.Group {
  const group = new THREE.Group()
  const profile = [new THREE.Vector2(0.04, 0.2), new THREE.Vector2(0.1, 0.18), new THREE.Vector2(0.13, 0.09), new THREE.Vector2(0.16, -0.05), new THREE.Vector2(0.2, -0.1), new THREE.Vector2(0.18, -0.12), new THREE.Vector2(0.12, -0.06), new THREE.Vector2(0.08, 0.1)]
  const shell = metal(new THREE.LatheGeometry(profile, 24), gold)
  ;(shell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
  group.add(shell, metal(sphere(0.045), gold, [0, -0.1, 0]), metal(new THREE.TorusGeometry(0.055, 0.018, 6, 12), gold, [0, 0.23, 0]))
  group.scale.setScalar(size)
  return group
}

function snowflake(radius: number): THREE.Group {
  const group = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const branch = new THREE.Group()
    branch.rotation.z = i * Math.PI / 3
    branch.add(mesh(box(0.018, radius * 2, 0.025), snow))
    for (const side of [-1, 1]) {
      const twig = mesh(box(0.015, radius * 0.55, 0.025), snow, [1, 1, 1], [side * radius * 0.12, radius * 0.55, 0])
      twig.rotation.z = -side * 0.65
      branch.add(twig)
    }
    group.add(branch)
  }
  return group
}

/** Every inventory entry is built as closed/extruded 3D geometry, with no image billboards. */
export function createEquipmentModel(id: EquipmentId, racer: Racer): THREE.Group {
  const group = new THREE.Group()
  group.name = `equipment:${id}`
  const a = racer.appearance
  switch (id) {
    case "santa": case "elf": group.add(new SantaHatAccessory(id === "elf").object); break
    case "snowman": group.add(new SnowmanHatAccessory().object); break
    case "antlers": {
      group.add(new ReindeerAccessory(a, false).object)
      break
    }
    case "glasses": {
      group.add(new CarolerAccessory(a, false).object)
      break
    }
    case "rudolph": {
      const nose = mesh(sphere(0.115), red, [1, 1, 1], [0.79 + 0.47 * (a.headScale[0] - 1), 1.13, 0])
      ;(nose.material as THREE.MeshStandardMaterial).emissive.set("#851b22")
      group.add(nose)
      break
    }
    case "winter": {
      group.add(mesh(sphere(0.35), racer.accent, [1, 0.95, 1], [0.08, 1.67, 0]), mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.13, 28), snow, [1, 1, 1], [0.08, 1.56, 0]), mesh(sphere(0.12), snow, [1, 1, 1], [0.08, 2.02, 0]))
      for (let i = 0; i < 20; i++) {
        const angle = i * Math.PI / 10
        group.add(mesh(new THREE.CapsuleGeometry(0.012, 0.1, 3, 5), snow, [1, 1, 1], [0.08 + Math.cos(angle) * 0.37, 1.56, Math.sin(angle) * 0.37]))
      }
      break
    }
    case "crown": {
      group.add(metal(new THREE.CylinderGeometry(0.34, 0.35, 0.12, 24, 1, true), gold, [0.08, 1.58, 0]))
      for (let i = 0; i < 7; i++) {
        const angle = i * Math.PI * 2 / 7
        group.add(metal(new THREE.ConeGeometry(0.09, 0.28, 4), ice, [0.08 + Math.cos(angle) * 0.31, 1.76, Math.sin(angle) * 0.31]))
      }
      break
    }
    case "scarf": group.add(new ScarfAccessory().object); break
    case "bells": {
      const collar = mesh(new THREE.TorusGeometry(0.34, 0.04, 8, 24), red, [1, 1, 1], [0.02, 1.0, 0])
      collar.rotation.x = Math.PI / 2
      group.add(collar)
      for (let i = 0; i < 5; i++) {
        const b = bell(0.42), angle = i * Math.PI * 2 / 5
        b.position.set(0.02 + Math.cos(angle) * 0.35, 0.91, Math.sin(angle) * 0.35)
        group.add(b)
      }
      break
    }
    case "bow": {
      const b = bow(racer.accent)
      b.rotation.y = Math.PI / 2
      b.position.set(0.47, 0.99, 0)
      group.add(b)
      break
    }
    case "santa-coat": case "elf-tunic": case "sweater": case "armor": {
      const color = id === "santa-coat" ? red : id === "elf-tunic" ? green : id === "armor" ? "#74919c" : racer.accent
      const torso = mesh(sphere(0.59), color, [1.04 * a.bodyScale[0], 0.91 * a.bodyScale[1], 0.92 * a.bodyScale[2]], [0, 0.72, 0])
      if (id === "armor") {
        ;(torso.material as THREE.Material).dispose()
        torso.material = new THREE.MeshStandardMaterial({ color, roughness: 0.36, metalness: 0.7 })
      }
      group.add(torso)
      const belt = mesh(new THREE.TorusGeometry(0.53, 0.045, 8, 32), id === "sweater" ? snow : "#293633", [a.bodyScale[0], a.bodyScale[2], 1], [0, 0.57, 0])
      belt.rotation.x = Math.PI / 2
      group.add(belt)
      if (id === "sweater") {
        for (const side of [-1, 1]) {
          const flake = snowflake(0.17)
          flake.position.set(0.03, 0.83, side * 0.55 * a.bodyScale[2])
          group.add(flake)
        }
      } else {
        for (let i = 0; i < 3; i++) group.add(metal(sphere(0.035), gold, [0.58 * a.bodyScale[0], 0.74 + i * 0.13, 0]))
        group.add(metal(box(0.055, 0.13, 0.18), gold, [0.57 * a.bodyScale[0], 0.57, 0]))
        if (id === "santa-coat") {
          const trim = mesh(new THREE.TorusGeometry(0.47, 0.06, 8, 32), snow, [a.bodyScale[0], a.bodyScale[2], 1], [0, 0.35, 0])
          trim.rotation.x = Math.PI / 2
          group.add(trim)
        }
      }
      break
    }
    case "sword": case "ice-sword": {
      const blade = extrude([[-0.055, 0.1], [-0.065, 0.68], [0, 0.85], [0.065, 0.68], [0.055, 0.1]], 0.035, id === "ice-sword" ? ice : "#c6d7da")
      group.add(blade, metal(box(0.34, 0.06, 0.08), gold, [0, 0.11, 0]), mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12), "#573c32", [1, 1, 1], [0, -0.04, 0]), metal(sphere(0.055), gold, [0, -0.18, 0]))
      group.add(metal(box(0.012, 0.55, 0.045), snow, [0, 0.4, 0]))
      break
    }
    case "axe": {
      group.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.9, 12), "#78502f", [1, 1, 1], [0, 0.25, 0]))
      const blade = extrude([[-0.05, 0.4], [-0.27, 0.32], [-0.34, 0.64], [-0.05, 0.57], [0.05, 0.57], [0.05, 0.4]], 0.09, "#b1c8d0")
      group.add(blade, metal(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), gold, [0, 0.5, 0]))
      break
    }
    case "candy-cane": {
      const points = [new THREE.Vector3(0, -0.13, 0), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0.56, 0)]
      for (let i = 0; i <= 16; i++) {
        const angle = Math.PI - i * Math.PI / 16
        points.push(new THREE.Vector3(0.13 + Math.cos(angle) * 0.13, 0.56 + Math.sin(angle) * 0.13, 0))
      }
      const curve = new THREE.CatmullRomCurve3(points)
      group.add(mesh(new THREE.TubeGeometry(curve, 64, 0.045, 10, false), snow))
      for (let i = 0; i < 16; i++) {
        const t = (i + 0.3) / 16, ring = mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 10), red)
        ring.position.copy(curve.getPoint(t))
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangent(t))
        group.add(ring)
      }
      break
    }
    case "wand": {
      const top = star(0.22)
      top.position.y = 0.67
      group.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 12), red, [1, 1, 1], [0, 0.23, 0]), top)
      break
    }
    case "shield": case "ice-shield": {
      const shield = new THREE.Group()
      if (id === "shield") {
        const disk = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.075, 32), "#875d3c")
        disk.rotation.x = Math.PI / 2
        shield.add(disk, metal(new THREE.TorusGeometry(0.29, 0.024, 8, 32), gold), metal(sphere(0.075), "#acbdc5", [0, 0, 0.07]))
        for (let i = -2; i <= 2; i++) shield.add(mesh(box(0.012, Math.sqrt(0.28 ** 2 - (i * 0.095) ** 2) * 2, 0.01), "#5e402c", [1, 1, 1], [i * 0.095, 0, 0.043]))
        for (let i = 0; i < 10; i++) shield.add(metal(sphere(0.018), gold, [Math.cos(i * Math.PI / 5) * 0.26, Math.sin(i * Math.PI / 5) * 0.26, 0.06]))
      } else {
        shield.add(extrude([[-0.29, 0.25], [0, 0.34], [0.29, 0.25], [0.25, -0.14], [0, -0.38], [-0.25, -0.14]], 0.075, ice))
        const flake = snowflake(0.21)
        flake.position.z = 0.06
        shield.add(flake)
      }
      const grip = mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), "#5e402c", [1, 0.65, 1], [0, 0, -0.09])
      shield.add(grip)
      shield.position.set(0.03, 0.04, 0.13)
      group.add(shield)
      break
    }
    case "gift": {
      const gift = giftBox(0.65, racer.accent)
      gift.position.y = 0.12
      group.add(gift)
      break
    }
    case "bell": {
      const handheld = bell(1.2)
      handheld.position.y = -0.27
      group.add(handheld)
      break
    }
    case "cocoa": {
      const cup = mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.24, 24), red, [1, 1, 1], [0, 0.12, 0])
      const handle = mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 20), snow, [1, 1, 1], [0.16, 0.12, 0])
      group.add(cup, handle, mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.015, 24), "#54362a", [1, 1, 1], [0, 0.244, 0]))
      for (let i = 0; i < 3; i++) group.add(mesh(box(0.045, 0.035, 0.045), snow, [1, 1, 1], [-0.05 + i * 0.05, 0.26, 0.025 * (i % 2)]))
      break
    }
    case "gingerbread": {
      group.add(mesh(sphere(0.115), "#bc8247", [1, 1, 0.45], [0, 0.34, 0]), mesh(new THREE.CapsuleGeometry(0.09, 0.16, 6, 14), "#bc8247", [1, 1, 0.5], [0, 0.12, 0]))
      for (const side of [-1, 1]) {
        const arm = mesh(new THREE.CapsuleGeometry(0.045, 0.16, 4, 10), "#bc8247", [1, 1, 0.55], [side * 0.12, 0.15, 0])
        arm.rotation.z = side * 0.9
        group.add(arm, mesh(new THREE.CapsuleGeometry(0.045, 0.14, 4, 10), "#bc8247", [1, 1, 0.55], [side * 0.06, -0.06, 0]), mesh(sphere(0.017), snow, [1, 1, 0.5], [side * 0.04, 0.36, 0.05]))
      }
      for (let i = 0; i < 3; i++) group.add(mesh(sphere(0.022), i % 2 ? green : red, [1, 1, 0.5], [0, 0.2 - i * 0.065, 0.05]))
      break
    }
    case "lantern": {
      group.add(metal(box(0.28, 0.035, 0.24), "#344b43", [0, 0.05, 0]), metal(new THREE.ConeGeometry(0.21, 0.14, 4), "#344b43", [0, 0.39, 0]), metal(new THREE.TorusGeometry(0.09, 0.018, 8, 18), gold, [0, 0.53, 0]))
      for (const x of [-0.11, 0.11]) for (const z of [-0.09, 0.09]) group.add(metal(box(0.025, 0.28, 0.025), gold, [x, 0.2, z]))
      const light = mesh(sphere(0.095), "#ffe6a0", [0.7, 1.4, 0.7], [0, 0.21, 0])
      ;(light.material as THREE.MeshStandardMaterial).emissive.set("#e5a83c")
      ;(light.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5
      group.add(light)
      // Put the carrying ring, rather than the lantern's base, at the paw socket.
      group.children.forEach((child) => { child.position.y -= 0.53 })
      break
    }
    case "sack": {
      group.add(mesh(sphere(0.38), red, [0.8, 1.15, 1], [-0.49, 0.86, 0]), mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 18), gold, [1, 1, 1], [-0.49, 1.23, 0]))
      const present = giftBox(0.4, green)
      present.position.set(-0.49, 1.27, 0)
      group.add(present)
      break
    }
    case "cape": {
      const geometry = new THREE.PlaneGeometry(0.75, 0.93, 16, 16)
      const positions = geometry.attributes.position!
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i)
        positions.setXYZ(i, x * (1.2 - y * 0.6), y, Math.cos(x * 22) * 0.04 - (0.46 - y) * 0.18)
      }
      geometry.computeVertexNormals()
      // A solid, bevelled clasp and double-sided folded cloth surface.
      const cape = mesh(geometry, racer.accent)
      ;(cape.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
      cape.rotation.y = Math.PI / 2
      cape.position.set(-0.52, 0.78, 0)
      const clasp = star(0.1)
      clasp.rotation.y = Math.PI / 2
      clasp.position.set(0.38, 1.01, 0)
      group.add(cape, clasp)
      break
    }
    case "wreath": {
      const wreath = mesh(new THREE.TorusGeometry(0.32, 0.09, 10, 32), green)
      wreath.rotation.y = Math.PI / 2
      wreath.position.set(-0.55, 0.9, 0)
      group.add(wreath)
      for (let i = 0; i < 12; i++) group.add(mesh(sphere(i % 3 ? 0.045 : 0.06), i % 3 ? red : gold, [1, 1, 1], [-0.64, 0.9 + Math.cos(i * Math.PI / 6) * 0.32, Math.sin(i * Math.PI / 6) * 0.32]))
      const b = bow()
      b.rotation.y = Math.PI / 2
      b.position.set(-0.65, 0.62, 0)
      group.add(b)
      break
    }
    case "tree": {
      group.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), "#78502f", [1, 1, 1], [-0.6, 0.6, 0]))
      for (let i = 0; i < 3; i++) group.add(mesh(new THREE.ConeGeometry(0.35 - i * 0.075, 0.47, 16), green, [1, 1, 1], [-0.6, 0.85 + i * 0.23, 0]))
      const top = star(0.13)
      top.position.set(-0.6, 1.68, 0)
      group.add(top)
      for (let i = 0; i < 9; i++) group.add(mesh(sphere(0.045), i % 2 ? red : gold, [1, 1, 1], [-0.6 + Math.cos(i * 2.4) * 0.22, 0.7 + i * 0.085, Math.sin(i * 2.4) * 0.22]))
      break
    }
  }
  batchStaticMeshes(group)
  return group
}
