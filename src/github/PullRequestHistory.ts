export const repositories = ["dbeaver/dbeaver", "dbeaver/cloudbeaver"] as const
export type Repository = (typeof repositories)[number]

export interface ClosedPullRequest {
  readonly repository: Repository
  readonly number: number
  readonly title: string
}

const CACHE_KEY = "beaver-race:closed-pull-requests:v1"
const CACHE_TTL = 6 * 60 * 60 * 1_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const parsePullRequests = (data: unknown, repository: Repository): ClosedPullRequest[] => {
  if (!Array.isArray(data)) return []
  return data.flatMap((item: unknown) =>
    isRecord(item) && item.state === "closed" && typeof item.number === "number" && typeof item.title === "string" && item.title.trim()
      ? [{ repository, number: item.number, title: item.title.trim() }]
      : [],
  )
}

export class PullRequestHistory {
  private pending: Promise<ReadonlyArray<ClosedPullRequest>> | undefined

  constructor(private readonly request: typeof fetch = (...args) => fetch(...args), private readonly random = Math.random) {}

  load(): Promise<ReadonlyArray<ClosedPullRequest>> {
    if (!this.pending) this.pending = this.loadHistory()
    return this.pending
  }

  private async loadHistory(): Promise<ReadonlyArray<ClosedPullRequest>> {
    const cached = this.readCache()
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) return cached.items

    const results = await Promise.allSettled(repositories.map((repository) => this.loadRepository(repository)))
    const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    if (items.length === 0) return cached?.items ?? []
    // Preserve the other repository if GitHub is temporarily unavailable for it.
    const available = new Set(items.map((item) => item.repository))
    items.push(...(cached?.items.filter((item) => !available.has(item.repository)) ?? []))
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }))
    } catch {
      // Storage may be unavailable; the in-memory cache still avoids repeat requests.
    }
    return items
  }

  private readCache(): { savedAt: number; items: ClosedPullRequest[] } | undefined {
    try {
      const data: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null")
      if (!isRecord(data) || typeof data.savedAt !== "number" || !Array.isArray(data.items)) return
      const items = data.items.filter((item: unknown): item is ClosedPullRequest =>
        isRecord(item) && repositories.includes(item.repository as Repository) &&
        typeof item.number === "number" && typeof item.title === "string" && item.title.trim().length > 0,
      )
      if (items.length > 0) return { savedAt: data.savedAt, items }
    } catch {
      // A malformed or inaccessible cache must not interrupt the race.
    }
  }

  private async loadRepository(repository: Repository): Promise<ClosedPullRequest[]> {
    const url = new URL(`https://api.github.com/repos/${repository}/pulls`)
    url.search = new URLSearchParams({ state: "closed", sort: "created", direction: "desc", per_page: "100" }).toString()
    const first = await this.fetchPage(url)
    const lastLink = first.link?.split(",").find((link) => /rel="last"/.test(link))?.match(/<([^>]+)>/)?.[1]
    const lastPage = lastLink ? Number(new URL(lastLink).searchParams.get("page")) : 1
    const recent = parsePullRequests(first.data, repository)
    if (!Number.isSafeInteger(lastPage) || lastPage <= 1) return recent

    // Sample an older page as well, so titles are not limited to the latest PRs.
    url.searchParams.set("page", String(2 + Math.floor(this.random() * (lastPage - 1))))
    try {
      const historical = await this.fetchPage(url)
      return [...recent, ...parsePullRequests(historical.data, repository)]
    } catch {
      return recent
    }
  }

  private async fetchPage(url: URL): Promise<{ data: unknown; link: string | null }> {
    const response = await this.request(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
    return { data: await response.json(), link: response.headers.get("Link") }
  }
}

export const pullRequestHistory = new PullRequestHistory()
