import * as THREE from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"

/** Collapse a rigid, untextured attachment into one draw per material, never across joints. */
export function batchStaticMeshes(group: THREE.Group): void {
  let articulated = false
  group.traverse((node) => { if (node instanceof THREE.Bone || node instanceof THREE.SkinnedMesh) articulated = true })
  if (articulated) return
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  const batches = new Map<string, { material: THREE.MeshStandardMaterial; geometries: THREE.BufferGeometry[] }>()
  const originals: THREE.Mesh[] = []
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.SkinnedMesh || !(child.material instanceof THREE.MeshStandardMaterial) || child.material.map) return
    const material = child.material
    const key = [material.color.getHex(), material.roughness, material.metalness, material.emissive.getHex(), material.emissiveIntensity, material.side].join(":")
    let batch = batches.get(key)
    if (!batch) { batch = { material, geometries: [] }; batches.set(key, batch) }
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld))
    batch.geometries.push(geometry)
    originals.push(child)
  })
  const retained = new Set(Array.from(batches.values(), (batch) => batch.material))
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries)
    if (!geometry) throw new Error("Incompatible static character geometry")
    batch.geometries.forEach((part) => part.dispose())
    const mesh = new THREE.Mesh(geometry, batch.material)
    mesh.castShadow = mesh.receiveShadow = true
    group.add(mesh)
  }
  for (const mesh of originals) {
    mesh.removeFromParent()
    mesh.geometry.dispose()
    if (!retained.has(mesh.material as THREE.MeshStandardMaterial)) (mesh.material as THREE.Material).dispose()
  }
}
