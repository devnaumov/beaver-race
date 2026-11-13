import { useEffect, useRef, useState } from "react"
import { accentColors, bodyScaleFor, bodyTypes, createRacer, databaseStickers, furColors, type BeaverAppearance, type Racer } from "./domain"
import { costumeEquipment, emptyEquipment, equipmentCatalog, equipmentSlots, slotLabels, type EquipmentSlot } from "./equipment"
import { driverIconUrl } from "./driverIcons"
import { sendGameEvent } from "./store"
import { CharacterPreview } from "./three/beaver/CharacterPreview"
import "./character-editor.css"

interface Props { readonly racer: Racer; readonly onClose: () => void }
type EditorTab = "wardrobe" | "appearance"
const presets = [
  { name: "Santa", costume: "Красная кепка" }, { name: "Elf", costume: "Корона" },
  { name: "Snowman", costume: "Котелок" }, { name: "Reindeer", costume: "Молния на хвосте" },
] as const

export function CharacterEditor({ racer, onClose }: Props) {
  const [draft, setDraft] = useState(racer)
  const [tab, setTab] = useState<EditorTab>("wardrobe")
  const [slot, setSlot] = useState<EquipmentSlot>("head")
  const [running, setRunning] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const previewHost = useRef<HTMLDivElement>(null)
  const preview = useRef<CharacterPreview | null>(null)
  const selected = draft.equipment[slot]
  const equippedCount = Object.values(draft.equipment).filter(Boolean).length

  useEffect(() => {
    const active = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.showModal()
    dialog.current?.querySelector<HTMLElement>("h2")?.focus()
    return () => { document.body.style.overflow = overflow; active?.focus({ preventScroll: true }) }
  }, [])

  useEffect(() => {
    if (!previewHost.current) return
    try {
      preview.current = new CharacterPreview(previewHost.current, () => setPreviewError(true))
    } catch { setPreviewError(true) }
    return () => { preview.current?.dispose(); preview.current = null }
  }, [])
  useEffect(() => { preview.current?.setRacer(draft) }, [draft])
  useEffect(() => { preview.current?.setRunning(running) }, [running])

  const appearance = <K extends keyof BeaverAppearance>(key: K, value: BeaverAppearance[K]) =>
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, [key]: value } }))

  const save = () => {
    sendGameEvent({ type: "CUSTOMIZE_RACER", id: racer.id, customization: draft })
    onClose()
  }

  const moveTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const next = tab === "wardrobe" ? "appearance" : "wardrobe"
    setTab(next)
    document.getElementById(`editor-tab-${next}`)?.focus()
  }

  return (
    <dialog ref={dialog} className="character-editor" aria-labelledby="editor-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
      <header className="editor-heading">
        <div><span>NORTH POLE / CHARACTER WORKSHOP</span><h2 id="editor-title" tabIndex={-1}>Make it <i>{racer.name}.</i></h2></div>
        <button type="button" className="editor-close" onClick={onClose} aria-label="Close editor without saving">×</button>
      </header>
      <div className="editor-layout">
        <section className="editor-preview" aria-label="Character preview">
          <div className="preview-caption"><span>LIVE 3D PREVIEW</span><b>{running ? "RUN CYCLE" : "FITTING ROOM"}</b></div>
          <div className="character-viewport" ref={previewHost} />
          {previewError && <p className="preview-error" role="status">3D preview unavailable. You can still edit and save your character. Reload to retry WebGL.</p>}
          <div className="preview-controls">
            <div className="preview-orbit"><button type="button" onClick={() => preview.current?.rotate(-1)} aria-label="Rotate left">↶</button><button type="button" onClick={() => preview.current?.resetView()}>Reset view</button><button type="button" onClick={() => preview.current?.rotate(1)} aria-label="Rotate right">↷</button></div>
            <button className="run-toggle" type="button" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? "Ⅱ Pause run" : "▷ Test run"}</button>
          </div>
          <p className="preview-hint">Drag to rotate · Scroll to zoom · {equippedCount}/7 slots equipped</p>
          <p className="motion-credit">Original beaver rig · Run motion by Quaternius / CC0</p>
        </section>

        <section className="editor-options" aria-label="Character settings">
          <div className="editor-tabs" role="tablist" aria-label="Editor sections" onKeyDown={moveTab}>
            {(["wardrobe", "appearance"] as const).map((value) => <button type="button" key={value} role="tab" id={`editor-tab-${value}`} aria-selected={tab === value} aria-controls={`editor-panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}>{value === "wardrobe" ? "01 / Wardrobe" : "02 / Appearance"}</button>)}
          </div>
          {tab === "wardrobe" ? <div className="editor-option-scroll" role="tabpanel" id="editor-panel-wardrobe" aria-labelledby="editor-tab-wardrobe" tabIndex={0}>
            <div className="preset-heading"><h3>A little Christmas magic</h3><button type="button" onClick={() => setDraft((d) => ({ ...d, equipment: emptyEquipment() }))}>Unequip all</button></div>
            <div className="outfit-presets" aria-label="Outfit presets">
              {presets.map((preset) => <button type="button" key={preset.name} onClick={() => setDraft((d) => ({ ...d, accessory: preset.costume, equipment: costumeEquipment(preset.costume) }))}>{preset.name}</button>)}
              <button type="button" onClick={() => setDraft((d) => ({ ...d, equipment: { ...emptyEquipment(), head: "crown", body: "armor", hand: "ice-sword", offhand: "ice-shield", back: "cape" } }))}>Winter knight</button>
            </div>
            <div className="equipment-slots" role="group" aria-label="Equipment slots">
              {equipmentSlots.map((value) => <button type="button" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}><span>{slotLabels[value]}</span><small>{draft.equipment[value] ? "●" : "○"}</small></button>)}
            </div>
            <div className="inventory-heading"><h3>{slotLabels[slot]}</h3><span>{equipmentCatalog.filter((item) => item.slot === slot).length} items + unequipped</span></div>
            <div className="equipment-list" role="group" aria-label={`Choose ${slotLabels[slot].toLowerCase()}`}>
              <button type="button" aria-pressed={selected === null} onClick={() => setDraft((d) => ({ ...d, equipment: { ...d.equipment, [slot]: null } }))}><span className="item-index">00</span><span><b>None</b><small>Keep this slot free</small></span><span className="item-check">{selected === null ? "✓" : "+"}</span></button>
              {equipmentCatalog.filter((item) => item.slot === slot).map((item, index) => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setDraft((d) => ({ ...d, equipment: { ...d.equipment, [slot]: item.id } }))}><span className="item-index">{String(index + 1).padStart(2, "0")}</span><span><b>{item.name}</b><small>{item.theme} collection · 3D model</small></span><span className="item-check">{selected === item.id ? "✓" : "+"}</span></button>)}
            </div>
            <p className="editor-footnote">Mix collections freely. All equipment is cosmetic and keeps the race fair.</p>
          </div> : <div className="editor-option-scroll appearance-options" role="tabpanel" id="editor-panel-appearance" aria-labelledby="editor-tab-appearance" tabIndex={0}>
            <fieldset><legend>Fur color</legend><div className="color-swatches">{furColors.map((color) => <button type="button" key={color} style={{ background: color }} aria-label={`Fur ${color}`} aria-pressed={draft.fur === color} onClick={() => setDraft((d) => ({ ...d, fur: color }))}>{draft.fur === color ? "✓" : ""}</button>)}<label className="custom-color">Custom<input type="color" aria-label="Custom fur color" value={draft.fur} onChange={(e) => setDraft((d) => ({ ...d, fur: e.target.value }))} /></label></div></fieldset>
            <fieldset><legend>Outfit accent</legend><div className="color-swatches">{accentColors.map((color) => <button type="button" key={color} style={{ background: color }} aria-label={`Accent ${color}`} aria-pressed={draft.accent === color} onClick={() => setDraft((d) => ({ ...d, accent: color }))}>{draft.accent === color ? "✓" : ""}</button>)}<label className="custom-color">Custom<input type="color" aria-label="Custom outfit accent" value={draft.accent} onChange={(e) => setDraft((d) => ({ ...d, accent: e.target.value }))} /></label></div></fieldset>
            <fieldset><legend>Build</legend><div className="body-options">{bodyTypes.map((type) => <button type="button" key={type} aria-pressed={draft.appearance.bodyType === type} onClick={() => setDraft((d) => ({ ...d, appearance: { ...d.appearance, bodyType: type, bodyScale: bodyScaleFor(type) } }))}>{type}</button>)}</div></fieldset>
            <div className="appearance-sliders">
              <label>Head size <output>{draft.appearance.headScale[0].toFixed(2)}</output><input type="range" min="0.7" max="1.35" step="0.01" value={draft.appearance.headScale[0]} onChange={(e) => { const size = Number(e.target.value); appearance("headScale", [size, size, size]) }} /></label>
              <label>Tail length <output>{draft.appearance.tailScale[0].toFixed(2)}</output><input type="range" min="1.1" max="1.9" step="0.01" value={draft.appearance.tailScale[0]} onChange={(e) => appearance("tailScale", [Number(e.target.value), draft.appearance.tailScale[1], draft.appearance.tailScale[2]])} /></label>
              <label>Ear size <output>{draft.appearance.earSize.toFixed(2)}</output><input type="range" min="0.08" max="0.19" step="0.005" value={draft.appearance.earSize} onChange={(e) => appearance("earSize", Number(e.target.value))} /></label>
              <label>Front teeth <output>{draft.appearance.toothSize.toFixed(2)}</output><input type="range" min="0.6" max="1.35" step="0.01" value={draft.appearance.toothSize} onChange={(e) => appearance("toothSize", Number(e.target.value))} /></label>
              <label className="belly-picker">Muzzle & belly<input type="color" aria-label="Muzzle and belly color" value={draft.appearance.belly} onChange={(e) => appearance("belly", e.target.value)} /></label>
            </div>
            <fieldset><legend>Team badge</legend><div className="badge-options">{databaseStickers.map((sticker) => <button type="button" key={sticker.id} aria-pressed={draft.sticker.id === sticker.id} onClick={() => setDraft((d) => ({ ...d, sticker }))}><img src={driverIconUrl(sticker.id)} alt="" />{sticker.name}</button>)}</div></fieldset>
            <button type="button" className="randomize-appearance" onClick={() => { const next = createRacer(racer.name); setDraft((d) => ({ ...d, fur: next.fur, appearance: next.appearance })) }}>↻ Randomize features, keep equipment</button>
          </div>}
        </section>
      </div>
      <footer className="editor-footer"><span>Changes apply only when saved.</span><div><button type="button" onClick={onClose}>Cancel</button><button type="button" className="save-character" onClick={save}>Save character <span>→</span></button></div></footer>
    </dialog>
  )
}
