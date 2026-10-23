import { describe, expect, it } from "vitest"
import type { ClosedPullRequest } from "../github/PullRequestHistory"
import { PullRequestChatter } from "./PullRequestChatter"

const racers = Array.from({ length: 12 }, (_, index) => `racer-${index}`)
const titles: ClosedPullRequest[] = Array.from({ length: 20 }, (_, index) => ({
  repository: index % 2 === 0 ? "dbeaver/dbeaver" : "dbeaver/cloudbeaver",
  number: index + 1,
  title: `Closed pull request ${index + 1}`,
}))

describe("PullRequestChatter", () => {
  it("never exceeds three bubbles or repeats a racer or title on screen", () => {
    const chatter = new PullRequestChatter()
    let maximum = 0
    for (let now = 0; now < 60; now += 0.05) {
      const bubbles = chatter.update(now, true, racers, titles, 12)
      maximum = Math.max(maximum, bubbles.length)
      expect(bubbles.length).toBeLessThanOrEqual(3)
      expect(new Set(bubbles.map((bubble) => bubble.racerId)).size).toBe(bubbles.length)
      expect(new Set(bubbles.map((bubble) => bubble.pullRequest.title)).size).toBe(bubbles.length)
      expect(bubbles.every((bubble) => bubble.expiresAt > now)).toBe(true)
    }
    expect(maximum).toBe(3)
  })

  it("clears bubbles outside close-ups and starts fresh on the next shot", () => {
    const chatter = new PullRequestChatter(() => 0)
    const first = chatter.update(1, true, racers, titles)[0]!
    expect(chatter.update(1.5, false, racers, titles)).toHaveLength(0)
    const next = chatter.update(2, true, racers, titles)
    expect(next).toHaveLength(1)
    expect(next[0]).not.toBe(first)
  })

  it("handles fewer racers, missing data, and a smaller mobile capacity", () => {
    const chatter = new PullRequestChatter(() => 0)
    expect(chatter.update(0, true, racers, [])).toHaveLength(0)
    expect(chatter.update(0, true, [], titles)).toHaveLength(0)
    chatter.update(1, true, racers, titles)
    chatter.update(2, true, racers, titles)
    expect(chatter.update(3, true, racers, titles)).toHaveLength(3)
    expect(chatter.update(3.1, true, racers, titles, 2)).toHaveLength(2)
    expect(chatter.update(3.2, true, ["racer-0"], titles).length).toBeLessThanOrEqual(1)
  })
})
