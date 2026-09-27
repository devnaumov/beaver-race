import * as THREE from "three"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createRacer, type BeaverAppearance } from "../../domain"
import { MeshFactory } from "../core/MeshFactory"
import { AccessoryFactory } from "./Accessories"
import { BeaverModel } from "./BeaverModel"
import { FacePart } from "./parts"

const bodyScales: ReadonlyArray<BeaverAppearance["bodyScale"]> = [
  [1.16, 0.94, 1.06],
  [0.82, 1.3, 0.8],
  [1.32, 1.16, 1.18],
  [0.78, 1.47, 0.86],
]

describe("beaver geometry attachments", () => {
  afterEach(() => vi.restoreAllMocks())

  it("places eyes in front of the scaled head surface", () => {
    const appearance = createRacer("DBeaver", 0.17).appearance
    const face = new FacePart("#a96332", appearance)
    const eye = face.object.children[2] as THREE.Mesh
    const z = Math.abs(eye.position.z)
    const radiusX = 0.47 * appearance.headScale[0]
    const radiusY = 0.47 * appearance.headScale[1]
    const radiusZ = 0.47 * appearance.headScale[2]
    const headSurfaceX = 0.17 + radiusX * Math.sqrt(1 - ((1.35 - 1.22) / radiusY) ** 2 - (z / radiusZ) ** 2)

    expect(eye.position.x).toBeGreaterThan(headSurfaceX)
  })

  it("keeps both shoulders symmetric and inside every torso width", () => {
    const racer = createRacer("shoulders", 0.31)

    for (const bodyScale of bodyScales) {
      const model = new BeaverModel({ ...racer, accessory: "Корона", appearance: { ...racer.appearance, bodyScale } }, false)
      const leftZ = model.rig.leftArm.object.position.z
      const rightZ = model.rig.rightArm.object.position.z
      const torsoRadiusZ = 0.58 * 0.9 * bodyScale[2]

      expect(leftZ).toBeCloseTo(-rightZ)
      expect(Math.abs(leftZ)).toBeLessThan(torsoRadiusZ)
      expect(Math.abs(rightZ)).toBeLessThan(torsoRadiusZ)
    }
  })

  it("keeps the driver badge against a narrow torso", () => {
    vi.spyOn(MeshFactory, "texture").mockReturnValue(new THREE.Texture())
    const racer = createRacer("badge", 0.42)
    const bodyScale: BeaverAppearance["bodyScale"] = [0.82, 1.3, 0.8]
    const model = new BeaverModel({ ...racer, accessory: "Корона", appearance: { ...racer.appearance, bodyScale } })
    const badgeGroup = model.object.children[9] as THREE.Group
    const badge = badgeGroup.children[0] as THREE.Mesh
    const torsoRadiusZ = 0.58 * 0.9 * bodyScale[2]

    expect(badge.position.z - torsoRadiusZ).toBeLessThan(0.02)
  })

  it("aligns glasses with both eyes on the front of the face", () => {
    const racer = { ...createRacer("glasses", 0.24), accessory: "Круглые очки" as const }
    const glasses = new AccessoryFactory().create(racer)
    const leftLens = glasses.object.children[0] as THREE.Mesh
    const rightLens = glasses.object.children[1] as THREE.Mesh

    expect(leftLens.rotation.y).toBeCloseTo(Math.PI / 2)
    expect(leftLens.position.z).toBeCloseTo(-racer.appearance.eyeSpacing)
    expect(rightLens.position.z).toBeCloseTo(racer.appearance.eyeSpacing)
  })
})
