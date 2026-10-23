import { afterEach, describe, expect, it, vi } from "vitest"
import { PullRequestHistory } from "./PullRequestHistory"

const pr = (number: number, title: string, state = "closed") => ({ number, title, state })
const response = (data: unknown, link?: string) => new Response(JSON.stringify(data), {
  headers: link ? { Link: link } : {},
})

afterEach(() => vi.unstubAllGlobals())

describe("PullRequestHistory", () => {
  it("calls the browser fetch without binding it to the history instance", async () => {
    vi.stubGlobal("fetch", async function (this: unknown) {
      if (this instanceof PullRequestHistory) throw new TypeError("Illegal invocation")
      return response([pr(1, "Browser title")])
    })
    expect(await new PullRequestHistory().load()).toHaveLength(2)
  })

  it("loads closed PRs from both repositories and samples their older history", async () => {
    const request = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input))
      expect(url.searchParams.get("state")).toBe("closed")
      if (url.searchParams.has("page")) {
        expect(url.searchParams.get("page")).toBe("6")
        return response([pr(1, "Historical title"), pr(2, "Open PR", "open"), { title: "Invalid" }])
      }
      return response([pr(100, "Recent title")], `<${url}&page=10>; rel="last"`)
    })
    const history = new PullRequestHistory(request, () => 0.5)
    const items = await history.load()
    expect(items).toHaveLength(4)
    expect(new Set(items.map((item) => item.repository))).toEqual(new Set(["dbeaver/dbeaver", "dbeaver/cloudbeaver"]))
    expect(items.map((item) => item.title)).not.toContain("Open PR")
    await history.load()
    expect(request).toHaveBeenCalledTimes(4)
  })

  it("keeps one repository working if the other is rate-limited", async () => {
    const request = vi.fn<typeof fetch>(async (input) => String(input).includes("/cloudbeaver/")
      ? new Response(null, { status: 403 })
      : response([pr(5, "Available title")]))
    expect(await new PullRequestHistory(request).load()).toEqual([
      { repository: "dbeaver/dbeaver", number: 5, title: "Available title" },
    ])
  })

  it("reuses the persistent cache without GitHub requests", async () => {
    const storage = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })
    const request = vi.fn<typeof fetch>(async () => response([pr(7, "Cached title")]))
    const items = await new PullRequestHistory(request).load()
    request.mockClear()
    expect(await new PullRequestHistory(request).load()).toEqual(items)
    expect(request).not.toHaveBeenCalled()
  })

  it("resolves to an empty pool when GitHub is unavailable without a cache", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Offline"))
    expect(await new PullRequestHistory(request).load()).toEqual([])
  })
})
