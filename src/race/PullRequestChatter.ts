import type { ClosedPullRequest } from "../github/PullRequestHistory"

export interface ThoughtBubble {
  readonly racerId: string
  readonly pullRequest: ClosedPullRequest
  readonly startedAt: number
  readonly expiresAt: number
  readonly slot: number
}

export class PullRequestChatter {
  private bubbles: ThoughtBubble[] = []
  private nextAt = 0

  constructor(private readonly random = Math.random) {}

  update(now: number, visible: boolean, racerIds: ReadonlyArray<string>, titles: ReadonlyArray<ClosedPullRequest>, capacity = 3): ReadonlyArray<ThoughtBubble> {
    const limit = Math.max(0, Math.min(3, Math.floor(capacity)))
    if (!visible) {
      this.bubbles = []
      this.nextAt = now
      return this.bubbles
    }
    this.bubbles = this.bubbles.filter((bubble) => bubble.expiresAt > now && racerIds.includes(bubble.racerId) && bubble.slot < limit)
    if (now < this.nextAt || this.bubbles.length >= limit) return this.bubbles

    const racers = racerIds.filter((id) => !this.bubbles.some((bubble) => bubble.racerId === id))
    const choices = titles.filter((title) => !this.bubbles.some((bubble) => bubble.pullRequest.title === title.title))
    if (racers.length === 0 || choices.length === 0) return this.bubbles
    const sources = [...new Set(choices.map((title) => title.repository))]
    const repository = sources[Math.floor(this.random() * sources.length)]!
    const sourceTitles = choices.filter((title) => title.repository === repository)
    const slot = [0, 1, 2].find((index) => !this.bubbles.some((bubble) => bubble.slot === index))!
    this.bubbles.push({
      racerId: racers[Math.floor(this.random() * racers.length)]!,
      pullRequest: sourceTitles[Math.floor(this.random() * sourceTitles.length)]!,
      startedAt: now,
      expiresAt: now + 3.6 + this.random() * 0.8,
      slot,
    })
    this.nextAt = now + 0.65
    return this.bubbles
  }
}
