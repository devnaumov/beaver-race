import { bodyTypes, createRacer, databaseStickers, type BeaverAppearance, type Racer } from "./domain"
import { emptyEquipment, equipmentSlots, isEquipment } from "./equipment"

export type CharacterCustomization = Pick<Racer, "fur" | "accent" | "sticker" | "appearance" | "equipment">
const color = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
const inRange = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
const scale = (value: unknown, min: number, max: number): value is BeaverAppearance["bodyScale"] => Array.isArray(value) && value.length === 3 && value.every((v) => inRange(v, min, max))

export function parseCustomization(value: unknown): CharacterCustomization | null {
  if (!value || typeof value !== "object") return null
  const v = value as Record<string, unknown>
  if (!color(v.fur) || !color(v.accent) || !isEquipment(v.equipment) || !v.appearance || typeof v.appearance !== "object") return null
  const a = v.appearance as Record<string, unknown>
  if (!bodyTypes.includes(a.bodyType as BeaverAppearance["bodyType"]) || !color(a.belly)) return null
  if (!scale(a.bodyScale, 0.65, 1.5) || !scale(a.headScale, 0.7, 1.4) || !scale(a.muzzleScale, 0.6, 1.3) || !scale(a.tailScale, 0.15, 2)) return null
  if (!inRange(a.eyeSpacing, 0.12, 0.32) || !inRange(a.earSize, 0.07, 0.2) || !inRange(a.toothSize, 0.6, 1.4)
    || !inRange(a.gaitCadence, 0.7, 1.5) || !inRange(a.gaitBounce, 0.5, 1.5) || !inRange(a.runningLean, 0, 0.15)) return null
  const sticker = databaseStickers.find((s) => s.id === (v.sticker as { id?: unknown } | null)?.id)
  if (!sticker) return null
  const equipment = emptyEquipment()
  for (const slot of equipmentSlots) equipment[slot] = v.equipment[slot]
  // Rebuild from known fields, never trust stored materials, URLs or arbitrary geometry.
  return {
    fur: v.fur, accent: v.accent, sticker, equipment,
    appearance: {
      bodyType: a.bodyType as BeaverAppearance["bodyType"], belly: a.belly,
      bodyScale: [...a.bodyScale], headScale: [...a.headScale],
      muzzleScale: [...a.muzzleScale], tailScale: [...a.tailScale],
      eyeSpacing: a.eyeSpacing, earSize: a.earSize, toothSize: a.toothSize,
      gaitCadence: a.gaitCadence, gaitBounce: a.gaitBounce, runningLean: a.runningLean,
    },
  }
}

export function serializeCharacters(racers: ReadonlyArray<Racer>): string {
  return JSON.stringify({ version: 1, characters: racers.map(({ name, seed, fur, accent, sticker, appearance, equipment }) => ({ name, seed, fur, accent, sticker, appearance, equipment })) })
}

export function restoreCharacters(json: string | null): ReadonlyArray<Racer> | undefined {
  try {
    const data: unknown = JSON.parse(json ?? "null")
    if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 || !("characters" in data) || !Array.isArray(data.characters) || data.characters.length > 12) return undefined
    const names = new Set<string>()
    const racers: Racer[] = []
    for (const item of data.characters) {
      if (!item || typeof item !== "object" || typeof item.name !== "string") return undefined
      const name = item.name.trim().replace(/\s+/g, " ")
      if (name.length < 2 || name.length > 22 || names.has(name.toLowerCase())) return undefined
      const customization = parseCustomization(item)
      if (!customization || !inRange(item.seed, 0, 0xffffffff) || !Number.isInteger(item.seed)) return undefined
      names.add(name.toLowerCase())
      racers.push({ ...createRacer(name, 0), ...customization, seed: item.seed, progress: 0, speed: 0 })
    }
    return racers
  } catch { return undefined }
}
