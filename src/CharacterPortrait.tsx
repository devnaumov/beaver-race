import { useEffect, useRef, useState } from "react"
import type { Racer } from "./domain"
import { CharacterPreview } from "./three/beaver/CharacterPreview"

/** Victory uses the very same model, rig and saved equipment as the race. */
export function CharacterPortrait({ racer }: { readonly racer: Racer }) {
  const host = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    if (!host.current) return
    let portrait: CharacterPreview | undefined
    try {
      portrait = new CharacterPreview(host.current, () => setUnavailable(true))
      portrait.setRacer(racer)
    } catch { setUnavailable(true) }
    return () => portrait?.dispose()
  }, [racer])
  return <div className="winner-beaver-3d" ref={host} role="img" aria-label={`${racer.name} in their selected equipment`}>{unavailable && <span className="portrait-fallback">Our Christmas champion: {racer.name}</span>}</div>
}
