import * as THREE from "three"
import { pullRequestHistory, type ClosedPullRequest } from "../github/PullRequestHistory"
import { PullRequestChatter, type ThoughtBubble } from "../race/PullRequestChatter"
import type { RacerView } from "./beaver/RacerView"

export class PullRequestBubbles {
  private readonly layer = document.createElement("div")
  private readonly chatter = new PullRequestChatter()
  private readonly views = new Map<ThoughtBubble, HTMLDivElement>()
  private readonly anchor = new THREE.Vector3()
  private titles: ReadonlyArray<ClosedPullRequest> = []
  private disposed = false

  constructor(private readonly host: HTMLElement) {
    this.layer.className = "pr-thoughts"
    this.layer.setAttribute("aria-label", "Beaver thoughts from closed GitHub pull requests")
    this.host.append(this.layer)
    void pullRequestHistory.load().then((titles) => {
      if (!this.disposed) this.titles = titles
    })
  }

  update(now: number, visible: boolean, racers: ReadonlyMap<string, RacerView>, camera: THREE.PerspectiveCamera): void {
    const width = this.host.clientWidth
    const height = this.host.clientHeight
    const capacity = width < 480 ? 2 : 3
    const positions = new Map<string, { x: number; y: number }>()
    racers.forEach((racer, id) => {
      this.anchor.set(0, 2.15, 0)
      racer.object.localToWorld(this.anchor)
      this.anchor.project(camera)
      if (this.anchor.z > -1 && this.anchor.z < 1 && Math.abs(this.anchor.x) < 0.95 && Math.abs(this.anchor.y) < 0.95) {
        positions.set(id, { x: (this.anchor.x + 1) * width / 2, y: (1 - this.anchor.y) * height / 2 })
      }
    })
    const bubbles = this.chatter.update(now, visible, [...positions.keys()], this.titles, capacity)
    this.views.forEach((view, bubble) => {
      if (bubbles.includes(bubble)) return
      view.remove()
      this.views.delete(bubble)
    })
    const slotWidth = (width - 24) / capacity
    const bubbleWidth = Math.min(230, slotWidth - 12)
    for (const bubble of bubbles) {
      let view = this.views.get(bubble)
      if (!view) {
        view = this.createBubble(bubble)
        this.views.set(bubble, view)
        this.layer.append(view)
      }
      const position = positions.get(bubble.racerId)!
      const x = 12 + slotWidth * (bubble.slot + 0.5)
      const y = height * (bubble.slot % 2 === 0 ? 0.13 : 0.22)
      view.style.width = `${bubbleWidth}px`
      view.style.left = `${x}px`
      view.style.top = `${y}px`
      view.style.opacity = String(Math.min(1, (now - bubble.startedAt) / 0.2, (bubble.expiresAt - now) / 0.25))
      const bottom = y + view.offsetHeight
      view.querySelectorAll<HTMLElement>(".pr-thought-dot").forEach((dot, index) => {
        const t = (index + 1) / 4
        dot.style.left = `${(position.x - x) * t + bubbleWidth / 2}px`
        dot.style.top = `${(position.y - bottom) * t + view!.offsetHeight}px`
      })
    }
  }

  dispose(): void {
    this.disposed = true
    this.layer.remove()
    this.views.clear()
  }

  private createBubble(bubble: ThoughtBubble): HTMLDivElement {
    const view = document.createElement("div")
    view.className = "pr-thought"
    view.dataset.repository = bubble.pullRequest.repository
    const source = document.createElement("span")
    source.className = "pr-thought-source"
    source.textContent = `${bubble.pullRequest.repository.split("/")[1]} · #${bubble.pullRequest.number}`
    const title = document.createElement("p")
    title.textContent = bubble.pullRequest.title
    view.append(source, title)
    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("i")
      dot.className = "pr-thought-dot"
      dot.setAttribute("aria-hidden", "true")
      view.append(dot)
    }
    return view
  }
}
