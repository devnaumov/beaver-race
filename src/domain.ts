import { Effect } from "effect"
import type { DriverIconId } from "./driverIcons"

export interface DatabaseSticker {
  readonly id: DriverIconId
  readonly name: string
  readonly short: string
  readonly color: string
}

export const databaseStickers: ReadonlyArray<DatabaseSticker> = [
  { id: "postgresql", name: "PostgreSQL", short: "PG", color: "#4169e1" },
  { id: "mysql", name: "MySQL", short: "MY", color: "#4479a1" },
  { id: "sqlite", name: "SQLite", short: "SQ", color: "#003b57" },
  { id: "oracle", name: "Oracle", short: "OR", color: "#e30613" },
  { id: "mongodb", name: "MongoDB", short: "MG", color: "#47a248" },
  { id: "redis", name: "Redis", short: "RD", color: "#ff4438" },
  { id: "clickhouse", name: "ClickHouse", short: "CH", color: "#ffcc01" },
  { id: "mariadb", name: "MariaDB", short: "MA", color: "#003545" },
]

export const accessories = [
  "Красная кепка",
  "Корона",
  "Котелок",
  "Плащ чемпиона",
  "Круглые очки",
  "Молния на хвосте",
] as const

const furColors = ["#9b5a2e", "#6f3c25", "#ba7540", "#4f3028", "#c48b5b", "#7e4d35"] as const
const accentColors = ["#ff4f3d", "#16a085", "#f5b335", "#3975db", "#9b59b6", "#ef6c35"] as const
const bellyColors = ["#e8bb82", "#f0cf99", "#d99d68", "#c78c63", "#f3d8aa"] as const
const bodyTypes = ["compact", "athletic", "round", "tall"] as const

export interface BeaverAppearance {
  readonly bodyType: (typeof bodyTypes)[number]
  readonly bodyScale: readonly [number, number, number]
  readonly headScale: readonly [number, number, number]
  readonly muzzleScale: readonly [number, number, number]
  readonly tailScale: readonly [number, number, number]
  readonly belly: string
  readonly eyeSpacing: number
  readonly earSize: number
  readonly toothSize: number
  readonly gaitCadence: number
  readonly gaitBounce: number
  readonly runningLean: number
}

export interface Racer {
  readonly id: string
  readonly name: string
  readonly fur: string
  readonly accent: string
  readonly accessory: (typeof accessories)[number]
  readonly sticker: DatabaseSticker
  readonly appearance: BeaverAppearance
  readonly progress: number
  readonly speed: number
  readonly seed: number
}

const hashName = (name: string): number => {
  let value = 2166136261
  for (let index = 0; index < name.length; index += 1) {
    value ^= name.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

export const createRacer = (name: string, salt = Math.random()): Racer =>
  Effect.runSync(
    Effect.sync(() => {
      const seed = (hashName(name) + Math.floor(salt * 1_000_000)) >>> 0
      const bodyType = bodyTypes[(seed >>> 2) % bodyTypes.length]!
      const bodyScale: BeaverAppearance["bodyScale"] =
        bodyType === "compact" ? [1.16, 0.94, 1.06]
        : bodyType === "athletic" ? [0.82, 1.3, 0.8]
        : bodyType === "round" ? [1.32, 1.16, 1.18]
        : [0.78, 1.47, 0.86]
      return {
        id: `${seed.toString(36)}-${Date.now().toString(36)}`,
        name,
        fur: furColors[seed % furColors.length]!,
        accent: accentColors[(seed >>> 4) % accentColors.length]!,
        accessory: accessories[(seed >>> 8) % accessories.length]!,
        sticker: databaseStickers[(seed >>> 12) % databaseStickers.length]!,
        appearance: {
          bodyType,
          bodyScale,
          headScale: [0.8 + ((seed >>> 5) % 5) * 0.085, 0.82 + ((seed >>> 7) % 4) * 0.095, 0.82 + ((seed >>> 9) % 4) * 0.08],
          muzzleScale: [0.88 + ((seed >>> 11) % 5) * 0.06, 0.7 + ((seed >>> 13) % 4) * 0.07, 0.9 + ((seed >>> 15) % 4) * 0.06],
          tailScale: [1.18 + ((seed >>> 17) % 5) * 0.12, 0.27 + ((seed >>> 19) % 4) * 0.035, 0.62 + ((seed >>> 21) % 4) * 0.06],
          belly: bellyColors[(seed >>> 6) % bellyColors.length]!,
          eyeSpacing: 0.18 + ((seed >>> 10) % 5) * 0.025,
          earSize: 0.11 + ((seed >>> 14) % 5) * 0.012,
          toothSize: 0.82 + ((seed >>> 18) % 5) * 0.08,
          gaitCadence: 0.88 + ((seed >>> 20) % 7) * 0.045,
          gaitBounce: 0.78 + ((seed >>> 23) % 6) * 0.07,
          runningLean: 0.035 + ((seed >>> 25) % 5) * 0.012,
        },
        progress: 0,
        speed: 0,
        seed,
      }
    }),
  )

export const rerollRacer = (racer: Racer): Racer => {
  const next = createRacer(racer.name)
  return { ...next, id: racer.id, progress: racer.progress, speed: racer.speed }
}
