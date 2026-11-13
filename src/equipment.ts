export const equipmentSlots = ["head", "face", "neck", "body", "hand", "offhand", "back"] as const
export type EquipmentSlot = (typeof equipmentSlots)[number]
export const slotLabels: Record<EquipmentSlot, string> = {
  head: "Headwear", face: "Face", neck: "Neck", body: "Outfit", hand: "Main paw", offhand: "Other paw", back: "Back",
}

export const equipmentCatalog = [
  { id: "santa", slot: "head", name: "Santa hat", theme: "Christmas" },
  { id: "elf", slot: "head", name: "Elf cap", theme: "Christmas" },
  { id: "snowman", slot: "head", name: "Snowman top hat", theme: "Christmas" },
  { id: "antlers", slot: "head", name: "Reindeer antlers", theme: "Christmas" },
  { id: "winter", slot: "head", name: "Pom-pom beanie", theme: "Christmas" },
  { id: "crown", slot: "head", name: "Ice crown", theme: "Adventure" },
  { id: "glasses", slot: "face", name: "Golden spectacles", theme: "Christmas" },
  { id: "rudolph", slot: "face", name: "Rudolph nose", theme: "Christmas" },
  { id: "scarf", slot: "neck", name: "Candy-striped scarf", theme: "Christmas" },
  { id: "bells", slot: "neck", name: "Jingle bells", theme: "Christmas" },
  { id: "bow", slot: "neck", name: "Gift bow", theme: "Christmas" },
  { id: "santa-coat", slot: "body", name: "Santa coat", theme: "Christmas" },
  { id: "elf-tunic", slot: "body", name: "Workshop tunic", theme: "Christmas" },
  { id: "sweater", slot: "body", name: "Snowflake sweater", theme: "Christmas" },
  { id: "armor", slot: "body", name: "Winter knight armor", theme: "Adventure" },
  { id: "candy-cane", slot: "hand", name: "Candy cane", theme: "Christmas" },
  { id: "sword", slot: "hand", name: "Knight's sword", theme: "Adventure" },
  { id: "ice-sword", slot: "hand", name: "Frostblade", theme: "Adventure" },
  { id: "axe", slot: "hand", name: "Woodland axe", theme: "Adventure" },
  { id: "wand", slot: "hand", name: "Christmas star wand", theme: "Christmas" },
  { id: "lantern", slot: "hand", name: "Winter lantern", theme: "Christmas" },
  { id: "shield", slot: "offhand", name: "Round oak shield", theme: "Adventure" },
  { id: "ice-shield", slot: "offhand", name: "Snowflake shield", theme: "Adventure" },
  { id: "gift", slot: "offhand", name: "Wrapped present", theme: "Christmas" },
  { id: "bell", slot: "offhand", name: "Christmas bell", theme: "Christmas" },
  { id: "cocoa", slot: "offhand", name: "Hot cocoa", theme: "Christmas" },
  { id: "gingerbread", slot: "offhand", name: "Gingerbread friend", theme: "Christmas" },
  { id: "sack", slot: "back", name: "Santa's gift sack", theme: "Christmas" },
  { id: "cape", slot: "back", name: "Winter champion cape", theme: "Adventure" },
  { id: "wreath", slot: "back", name: "Holly wreath", theme: "Christmas" },
  { id: "tree", slot: "back", name: "Little Christmas tree", theme: "Christmas" },
] as const satisfies ReadonlyArray<{ id: string; slot: EquipmentSlot; name: string; theme: string }>

export type EquipmentId = (typeof equipmentCatalog)[number]["id"]
export type Equipment = Record<EquipmentSlot, EquipmentId | null>
export const emptyEquipment = (): Equipment => ({ head: null, face: null, neck: null, body: null, hand: null, offhand: null, back: null })
export const isEquipment = (value: unknown): value is Equipment => {
  if (!value || typeof value !== "object") return false
  return equipmentSlots.every((slot) => {
    const id = (value as Record<string, unknown>)[slot]
    return id === null || equipmentCatalog.some((item) => item.id === id && item.slot === slot)
  })
}
export const costumeEquipment = (accessory: string): Equipment => {
  const equipment = emptyEquipment()
  switch (accessory) {
    case "Красная кепка": return { ...equipment, head: "santa", body: "santa-coat" }
    case "Корона": return { ...equipment, head: "elf", body: "elf-tunic" }
    case "Котелок": return { ...equipment, head: "snowman", neck: "scarf" }
    case "Плащ чемпиона": return { ...equipment, head: "winter", body: "sweater", neck: "scarf" }
    case "Круглые очки": return { ...equipment, head: "winter", face: "glasses", neck: "bells" }
    default: return { ...equipment, head: "antlers", face: "rudolph", neck: "bow" }
  }
}
export const equipmentSummary = (equipment: Equipment): string =>
  [equipment.head, equipment.body, equipment.hand].filter(Boolean).map((id) => equipmentCatalog.find((item) => item.id === id)?.name).join(" · ") || "Natural woodland beaver"
