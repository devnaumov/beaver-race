// Reproducible CC0 motion retarget. No robot mesh is shipped with the game.
// Usage: node scripts/import-running.mjs [path/to/RobotExpressive.glb]
import { readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import * as THREE from "three"

const source = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb"
const bytes = process.argv[2] ? await readFile(process.argv[2]) : Buffer.from(await (await fetch(source)).arrayBuffer())
const jsonLength = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString())
const binary = bytes.subarray(28 + jsonLength)
function accessor(index) {
  const a = gltf.accessors[index], view = gltf.bufferViews[a.bufferView]
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type]
  return Array.from({ length: a.count * size }, (_, i) => binary.readFloatLE((view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * 4))
}
const nodes = gltf.nodes.map((node) => {
  const object = new THREE.Object3D()
  if (node.translation) object.position.fromArray(node.translation)
  if (node.rotation) object.quaternion.fromArray(node.rotation)
  if (node.scale) object.scale.fromArray(node.scale)
  return object
})
gltf.nodes.forEach((node, i) => node.children?.forEach((child) => nodes[i].add(nodes[child])))
const animation = gltf.animations.find((a) => a.name === "Running")
const times = accessor(animation.samplers[0].input)
const channels = animation.channels.filter((c) => c.target.path !== "weights").map((c) => {
  const sampler = animation.samplers[c.sampler]
  return { node: c.target.node, path: c.target.path, values: accessor(sampler.output) }
})
const find = (name) => {
  const joint = gltf.nodes.findIndex((n) => n.name === name && n.children?.length)
  return joint >= 0 ? joint : gltf.nodes.findIndex((n) => n.name === name)
}
const position = (name) => nodes[find(name)].getWorldPosition(new THREE.Vector3())
const angle = (from, to) => {
  const direction = position(to).sub(position(from))
  // Robot forward +Z -> beaver forward +X. Project limb motion onto the sagittal plane.
  return Math.atan2(direction.z, -direction.y)
}
const tracks = Object.fromEntries(["UpperLeg_L", "LowerLeg_L", "UpperLeg_R", "LowerLeg_R", "UpperArm_L", "LowerArm_L", "UpperArm_R", "LowerArm_R"].map((name) => [name, []]))
for (let frame = 0; frame < times.length; frame++) {
  for (const c of channels) {
    const size = c.path === "rotation" ? 4 : 3
    const target = c.path === "rotation" ? nodes[c.node].quaternion : c.path === "translation" ? nodes[c.node].position : nodes[c.node].scale
    target.fromArray(c.values, frame * size)
  }
  nodes[0].updateMatrixWorld(true)
  for (const side of ["L", "R"]) {
    const thigh = angle(`UpperLeg.${side}`, `LowerLeg.${side}`)
    const shin = angle(`LowerLeg.${side}`, `LowerLeg.${side}_end`)
    const arm = angle(`UpperArm.${side}`, `LowerArm.${side}`)
    const forearm = angle(`LowerArm.${side}`, `Palm2.${side}`)
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
    tracks[`UpperLeg_${side}`].push(wrap(thigh))
    tracks[`LowerLeg_${side}`].push(wrap(shin - thigh))
    tracks[`UpperArm_${side}`].push(wrap(arm))
    tracks[`LowerArm_${side}`].push(wrap(forearm - arm))
  }
}
const output = {
  source, author: "Quaternius (Tomás Laulhé)", license: "CC0-1.0", animation: "Running",
  sourceSha256: createHash("sha256").update(bytes).digest("hex"),
  duration: times.at(-1), times, tracks,
}
await writeFile(new URL("../src/three/beaver/running.json", import.meta.url), JSON.stringify(output, (_, value) => typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value, 2) + "\n")
console.log(`Imported ${times.length} frames, ${output.duration}s, ${Object.keys(tracks).length} skeletal tracks (CC0).`)
