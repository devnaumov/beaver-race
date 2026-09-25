import { useAtomValue } from "@effect/atom-react"
import type { FormEvent } from "react"
import { databaseStickers } from "./domain"
import { driverIconUrl } from "./driverIcons"
import { gameAtom, sendGameEvent } from "./store"
import { mountRaceScene } from "./three/BeaverRaceScene"

const BeaverMark = () => (
  <svg className="brand-mark" viewBox="0 0 72 72" aria-hidden="true">
    <path d="M9 44C2 34 5 21 16 15c15-9 37-2 44 13 7 16-4 34-22 36C25 66 15 57 9 44Z" fill="#9b5a2e" stroke="#20150f" strokeWidth="4" />
    <circle cx="49" cy="28" r="11" fill="#bb7741" stroke="#20150f" strokeWidth="4" />
    <circle cx="53" cy="25" r="2.8" fill="#20150f" />
    <path d="M59 31 68 35l-9 5Z" fill="#20150f" />
    <rect x="52" y="35" width="7" height="10" rx="1" fill="#fff8dc" stroke="#20150f" strokeWidth="2" />
    <path d="m14 46-9 12 19-3" fill="#5f3926" stroke="#20150f" strokeWidth="4" strokeLinejoin="round" />
  </svg>
)

const WinnerBeaver = ({ fur, accent, sticker }: { fur: string; accent: string; sticker: string }) => (
  <div className="winner-beaver" style={{ "--fur": fur, "--accent": accent } as React.CSSProperties} aria-hidden="true">
    <div className="winner-tail" />
    <div className="winner-body">
      <span className="winner-sticker"><img src={sticker} alt="" /></span>
      <div className="winner-arm left" />
      <div className="winner-arm right" />
    </div>
    <div className="winner-head">
      <div className="winner-ear left" />
      <div className="winner-ear right" />
      <span className="winner-eye left" />
      <span className="winner-eye right" />
      <div className="winner-muzzle"><i /><b /><b /></div>
      <div className="winner-crown">♛</div>
    </div>
  </div>
)

export const App = () => {
  const snapshot = useAtomValue(gameAtom)
  const { racers, winnerId, countdown, elapsed, duration, error, raceNumber } = snapshot.context
  const isLobby = snapshot.matches("lobby")
  const isCountdown = snapshot.matches("countdown")
  const isRacing = snapshot.matches("racing")
  const isFinishing = snapshot.matches("finishing")
  const isFinished = snapshot.matches("finished")
  const winner = racers.find((racer) => racer.id === winnerId)
  const standings = [...racers].sort((a, b) => b.progress - a.progress)

  const addRacer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    sendGameEvent({ type: "ADD_RACER", name: String(data.get("name") ?? "") })
    form.reset()
    form.querySelector<HTMLInputElement>("input")?.focus()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Beaver Race, наверх">
          <BeaverMark />
          <span><b>BEAVER</b><em>RACE</em></span>
        </a>
        <div className="edition">
          <span className="live-dot" />
          Лесная лига · сезон 04
        </div>
        <div className="tech-badge"><span>POWERED BY</span> EFFECT 4 / XSTATE</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>LIVE</span> КУБОК ЗОЛОТОГО БРЕВНА</div>
          <h1>Быстрее.<br />Выше. <i>Бобрее.</i></h1>
          <p>Соберите команду, раздайте экипировку и узнайте, кто первым прогрызет финишную ленту.</p>
        </div>
        <div className="hero-stats">
          <div><strong>{String(racers.length).padStart(2, "0")}</strong><span>БОБРОВ<br />НА СТАРТЕ</span></div>
          <div><strong>{String(raceNumber).padStart(2, "0")}</strong><span>ЗАЕЗД<br />НОМЕР</span></div>
          <div><strong>{isRacing ? Math.max(1, Math.ceil((duration - elapsed) / 1_000)) : isFinishing ? "0" : "∞"}</strong><span>СЕКУНД<br />ДО ДРАМЫ</span></div>
        </div>
      </section>

      <section className="race-layout">
        <aside className="roster-panel">
          <div className="panel-heading">
            <div><span>01 / СОСТАВ</span><h2>Участники</h2></div>
            <b>{racers.length}/12</b>
          </div>

          <form className="add-racer" onSubmit={addRacer}>
            <label htmlFor="racer-name">Имя нового спортсмена</label>
            <div>
              <input id="racer-name" name="name" placeholder="Например, Саша" autoComplete="off" disabled={!isLobby} maxLength={22} />
              <button type="submit" disabled={!isLobby || racers.length >= 12} aria-label="Добавить участника">+</button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
          </form>

          <div className="roster" aria-label="Список участников">
            {racers.map((racer, index) => (
              <article className="racer-card" key={racer.id}>
                <div className="racer-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="fur-swatch" style={{ background: racer.fur }}><span><img src={driverIconUrl(racer.sticker.id)} alt={racer.sticker.name} /></span></div>
                <div className="racer-info">
                  <h3>{racer.name}</h3>
                  <p>{racer.accessory}</p>
                  <span style={{ color: racer.sticker.color }}>{racer.sticker.name}</span>
                </div>
                {isLobby && <div className="racer-actions">
                  <button type="button" onClick={() => sendGameEvent({ type: "REROLL", id: racer.id })} aria-label={`Сменить образ для ${racer.name}`}>↻</button>
                  <button type="button" onClick={() => sendGameEvent({ type: "REMOVE_RACER", id: racer.id })} aria-label={`Удалить ${racer.name}`}>×</button>
                </div>}
              </article>
            ))}
          </div>

          <button className="reroll-all" type="button" onClick={() => sendGameEvent({ type: "REROLL" })} disabled={!isLobby || racers.length === 0}>
            <span>↻</span> Перемешать экипировку
          </button>
        </aside>

        <section className="broadcast-panel">
          <div className="broadcast-bar">
            <div className="on-air"><span /> ПРЯМОЙ ЭФИР</div>
            <div className="fight-label">НА ЗАДНЕМ ПЛАНЕ: DBEAVER <b>VS</b> CLOUDBEAVER</div>
            <div className="camera-label">CAM 01 · TRACK</div>
          </div>
          <div className="scene-wrap">
            <div className="sun-glare" />
            <div className="three-stage" ref={mountRaceScene} />
            <div className="scene-vignette" />
            {isLobby && <div className="scene-prompt"><span>СТАРТОВАЯ РЕШЕТКА</span><b>Бобры разминают лапы</b></div>}
            {isCountdown && <div className="countdown" key={countdown}><small>ПРИГОТОВИТЬСЯ</small><strong>{countdown}</strong></div>}
            {(isRacing || isFinishing) && <div className="race-clock"><small>ВРЕМЯ ГОНКИ</small><b>{(elapsed / 1_000).toFixed(1)}s</b></div>}
          </div>

          <div className="race-console">
            <div className="standings">
              <span className="console-label">ТЕКУЩАЯ ПОЗИЦИЯ</span>
              <div>
                {standings.slice(0, 5).map((racer, index) => (
                  <span key={racer.id} className={index === 0 && !isLobby ? "leader" : ""}>
                    <i>{index + 1}</i>{racer.name}<b>{Math.round(racer.progress)}%</b>
                  </span>
                ))}
              </div>
            </div>
            <button className="start-button" type="button" onClick={() => sendGameEvent({ type: "START" })} disabled={!isLobby}>
              <span>{isLobby ? "ЗАПУСТИТЬ" : isFinished || isFinishing ? "ФИНИШ" : "ГОНКА ИДЕТ"}</span>
              <b>{isLobby ? "ГОНКУ" : "•••"}</b>
              <i>→</i>
            </button>
          </div>
        </section>
      </section>

      <section className="sticker-deck" aria-label="Доступные наклейки">
        <span>СПОНСОРЫ ГОНКИ</span>
        <div>{databaseStickers.map((sticker) => <b key={sticker.name} style={{ "--sticker": sticker.color } as React.CSSProperties}><img src={driverIconUrl(sticker.id)} alt="" /><small>{sticker.name}</small></b>)}</div>
      </section>

      <footer><b>BEAVER RACE © 2026</b><span>Случайность честная. Бобры настоящие.*</span><small>* Почти настоящие. Ни один бобр не пострадал.</small></footer>

      {isFinished && winner && (
        <div className="winner-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-title">
          <div className="confetti c1" /><div className="confetti c2" /><div className="confetti c3" />
          <div className="winner-rays" />
          <div className="winner-copy">
            <span>ПОБЕДИТЕЛЬ ГОНКИ #{String(raceNumber).padStart(2, "0")}</span>
            <h2 id="winner-title">{winner.name}</h2>
            <p>{winner.accessory} · команда {winner.sticker.name}</p>
            <button type="button" onClick={() => sendGameEvent({ type: "RESET" })}>Еще один заезд <b>↻</b></button>
          </div>
          <WinnerBeaver fur={winner.fur} accent={winner.accent} sticker={driverIconUrl(winner.sticker.id)} />
          <div className="winner-word">ЧЕМПИОН</div>
        </div>
      )}
    </main>
  )
}
