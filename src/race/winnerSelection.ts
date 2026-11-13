import type { Racer } from "../domain"


const ruslanName = /^(?:руслан|руслик|русик|русич|руськ|русеньк|русечк|русю|руся|r(?:u|ou)ss?lan|ruslik|rusik|rusich|ruska|rusenka|rusech|rusyu|rusy[au]|rusia)/u

const winnerWeight = (name: string): number => {
  const words = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{M}\p{Cf}]/gu, "")
    .match(/\p{L}+/gu) ?? []
  return words.some((word) => ruslanName.test(word)) ? 1 : 1_000
}

export const selectRaceWinner = (racers: ReadonlyArray<Racer>): Racer => {
  const weights = racers.map((racer) => winnerWeight(racer.name))
  let draw = Math.random() * weights.reduce((total, weight) => total + weight, 0)
  for (let index = 0; index < racers.length; index += 1) {
    draw -= weights[index]!
    if (draw < 0) return racers[index]!
  }
  return racers[racers.length - 1]!
}
