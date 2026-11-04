import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, PointerEvent } from "react"
import { ArrowRight, CalendarDays, ChevronDown, Download, ExternalLink, Heart, MapPin, Share2, Volume2, VolumeX } from "lucide-react"
import { weddingConfig as config } from "./config"
import { buildCalendar } from "./calendar"
import { whatsappShareUrl } from "./share"

const pad = (n: number) => String(n).padStart(2, "0")

function downloadCalendar(type: "wedding" | "reception") {
  const ics = buildCalendar(type)
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `${type}-sreekesh-kashmeera.ics`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Countdown() {
  const target = useMemo(() => new Date(config.wedding.start).getTime(), [])
  const [remaining, setRemaining] = useState(Math.max(0, target - Date.now()))
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000)
    return () => window.clearInterval(timer)
  }, [target])
  if (remaining === 0) return <p className="arrived">Our Special Day Has Arrived!</p>
  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining / 3600000) % 24)
  const minutes = Math.floor((remaining / 60000) % 60)
  const seconds = Math.floor((remaining / 1000) % 60)
  return <div className="countdown" aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until the wedding`}>
    {[[days,"Days"],[hours,"Hours"],[minutes,"Minutes"],[seconds,"Seconds"]].map(([value,label]) => <div className="count" key={label}><strong>{pad(Number(value))}</strong><span>{label}</span></div>)}
  </div>
}

function BackgroundArt({ variant }: { variant: "cover" | "hero" | "blessing" | "countdown" | "events" | "closing" }) {
  const artwork = (name: string, position: string) => <img key={`${name}-${position}`} className={`bg-art bg-art-${position}`} src={`./assets/bg/${name}.webp`} alt="" loading={variant === "cover" || variant === "hero" ? "eager" : "lazy"} decoding="async" />
  return <div className={`section-art section-art-${variant}`} aria-hidden="true">
    {variant === "cover" && <>{artwork("corner", "top-left")}{artwork("corner", "top-right")}{artwork("temple", "temple")}{artwork("lotus", "bottom-left")}{artwork("lotus", "bottom-right")}</>}
    {variant === "hero" && <>{artwork("palm", "hero-left")}{artwork("lotus", "hero-right")}</>}
    {variant === "blessing" && <>{artwork("mural", "mural-left")}{artwork("mural", "mural-right")}{artwork("corner", "bottom-left")}</>}
    {variant === "countdown" && <>{artwork("temple", "temple")}{artwork("corner", "top-left")}{artwork("corner", "top-right")}</>}
    {variant === "events" && <>{artwork("palm", "palm-left")}{artwork("palm", "palm-right")}{artwork("lotus", "bottom-left")}{artwork("lotus", "bottom-right")}</>}
    {variant === "closing" && <>{artwork("corner", "top-left")}{artwork("corner", "top-right")}{artwork("lotus", "bottom-left")}{artwork("lotus", "bottom-right")}</>}
  </div>
}

function HangingLamps() {
  return <div className="hanging-lamps" aria-hidden="true">
    <img className="hanging-lamp lamp-left" src="./assets/decor/lamp-left.webp" width="95" height="270" alt="" />
    <img className="hanging-lamp lamp-right" src="./assets/decor/lamp-right.webp" width="95" height="270" alt="" />
    <img className="hanging-lamp lamp-small-left" src="./assets/decor/lamp-small-left.webp" width="32" height="140" alt="" />
    <img className="hanging-lamp lamp-small-right" src="./assets/decor/lamp-small-right.webp" width="32" height="140" alt="" />
  </div>
}

function SlideToOpen({ onOpen }: { onOpen: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; distance: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const reset = () => {
    drag.current = null
    setDragging(false)
    setOffset(0)
    setProgress(0)
  }
  const pointerProgress = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return null
    return Math.max(0, Math.min(1, (event.clientX - drag.current.startX) / drag.current.distance))
  }
  const keyboardProgress = (value: number) => {
    const next = Math.max(0, Math.min(100, value))
    setProgress(next)
    setOffset((trackRef.current!.clientWidth - 64) * next / 100)
    if (next === 100) onOpen()
  }
  return <div className={`slide-track ${dragging ? "is-dragging" : ""}`} ref={trackRef}
    role="slider" tabIndex={0} aria-label="Slide to open invitation" aria-orientation="horizontal"
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}
    aria-valuetext={progress >= 90 ? "Release to open" : "Slide right to open; or press Enter"}
    style={{ "--slide-offset": `${offset}px` } as CSSProperties}
    onPointerDown={(event) => {
      if (event.button !== 0 || !(event.target as Element).closest(".slide-thumb")) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { pointerId: event.pointerId, startX: event.clientX - offset, distance: event.currentTarget.clientWidth - 64 }
      setDragging(true)
    }}
    onPointerMove={(event) => {
      const value = pointerProgress(event)
      if (value === null) return
      setOffset(value * drag.current!.distance)
      setProgress(value * 100)
    }}
    onPointerUp={(event) => {
      const value = pointerProgress(event)
      if (value === null) return
      if (value >= .9) { drag.current = null; setDragging(false); onOpen() }
      else reset()
    }}
    onPointerCancel={reset}
    onLostPointerCapture={() => { if (drag.current) reset() }}
    onKeyDown={(event) => {
      if (["Enter", " ", "End", "ArrowRight", "ArrowLeft", "Home"].includes(event.key)) {
        event.preventDefault()
        if (event.key === "Enter" || event.key === " " || event.key === "End") keyboardProgress(100)
        else if (event.key === "Home") keyboardProgress(0)
        else keyboardProgress(progress + (event.key === "ArrowRight" ? 20 : -20))
      }
    }}>
    <span className="slide-label" aria-hidden="true" style={{ opacity: Math.max(0, 1 - progress / 70) }}>slide to open</span>
    <span className="slide-thumb" aria-hidden="true"><ArrowRight /></span>
  </div>
}

function InvitationCover({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return <div className={`cover ${open ? "is-open" : ""}`} role="dialog" aria-label="Wedding invitation cover" aria-modal={!open} aria-hidden={open} inert={open}>
    <BackgroundArt variant="cover" />
    <div className="cover-lamp-stage"><HangingLamps /></div>
    <div className="cover-content">
      <span className="cover-kicker">Together with their families</span>
      <span className="cover-seal" aria-hidden="true">SK</span>
      <span className="cover-names">{config.couple.groom} <i>&</i> {config.couple.bride}</span>
      <span className="cover-save">Save the Date</span>
      <span className="cover-date">24 · January · 2027</span>
    </div>
    <SlideToOpen onOpen={onOpen} />
    <div className="door door-left" /><div className="door door-right" />
  </div>
}

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <header className="section-heading"><span>{eyebrow}</span><h2>{children}</h2><div className="flourish">✦</div></header>
}

function EventCard({ type }: { type: "wedding" | "reception" }) {
  const event = config[type]
  const wedding = type === "wedding"
  return <article className={`event-card ${type}`}>
    {wedding && <div className="event-image"><img loading="lazy" decoding="async" width="800" height="480" src={config.images.templeFacade} alt="Guruvayur Sri Krishna Temple" /></div>}
    <div className="event-content">
      <span className="event-number">{wedding ? "01" : "02"}</span>
      <p className="event-kicker">{wedding ? "The sacred ceremony" : "An afternoon of celebration"}</p>
      <h3>{wedding ? "വിവാഹം" : "വിവാഹ സൽക്കാരം"}</h3>
      <p className="event-couple">{config.couple.groom} <i>&</i> {config.couple.bride}</p>
      <dl><div><dt>Date</dt><dd>{event.dateLabel}</dd></div><div><dt>Time</dt><dd>{event.timeLabel}</dd></div><div><dt>Venue</dt><dd>{event.venue}</dd></div></dl>
      <div className="actions"><a className="button primary" href={event.maps} target="_blank" rel="noreferrer"><MapPin />Get {wedding ? "Wedding" : "Reception"} Directions<ExternalLink /></a><button className="button secondary" onClick={() => downloadCalendar(type)}><CalendarDays />Add to Calendar</button></div>
    </div>
  </article>
}

export default function App() {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const musicEnabled = useRef(true)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (!opened) document.body.style.overflow = "hidden"
    else mainRef.current?.focus({ preventScroll: true })
    return () => { document.body.style.overflow = previousOverflow }
  }, [opened])
  const playMusic = () => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.45
      void audio.play().catch(() => { /* The music button remains available if autoplay is blocked. */ })
    }
  }
  useEffect(() => {
    playMusic()
  }, [])
  const openInvitation = () => {
    setOpened(true)
    if (musicEnabled.current) playMusic()
  }
  const toggleMusic = () => {
    if (audioRef.current && !audioRef.current.paused) {
      musicEnabled.current = false
      audioRef.current.pause()
    } else {
      musicEnabled.current = true
      playMusic()
    }
  }
  return <>
    <audio ref={audioRef} src="./assets/Thanthaay.mp3" autoPlay loop preload="metadata"
      onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)}
      onError={() => setMusicPlaying(false)} />
    <button type="button" className="music-toggle" onClick={toggleMusic}
      aria-label={musicPlaying ? "Turn background music off" : "Turn background music on"}
      aria-pressed={musicPlaying}>
      {musicPlaying ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      <span>Music {musicPlaying ? "on" : "off"}</span>
    </button>
    <InvitationCover open={opened} onOpen={openInvitation} />
    <main ref={mainRef} tabIndex={-1} inert={!opened} className={opened ? "revealed" : ""}>
      <section className="hero" id="home">
        <BackgroundArt variant="hero" />
        <div className="hero-art">
          <img className="arch-art" src="./assets/decor/arch-without-lamps.webp" width="941" height="890" alt="" aria-hidden="true" />
          <HangingLamps />
          <div className="portrait-frame"><img src={config.images.couple} width="1000" height="964" fetchPriority="high" decoding="async" alt={`${config.couple.english} together`} /></div>
        </div>
        <div className="hero-copy"><p className="eyebrow">Save the date · 24 Jan 2027</p><h1><span>{config.couple.groom}</span><i>&</i><span>{config.couple.bride}</span></h1><div className="fine-rule" aria-hidden="true">✦</div><p className="malayalam-welcome">ഞങ്ങളുടെ വിവാഹത്തിലേക്ക്<br/>സ്നേഹപൂർവ്വം സ്വാഗതം</p>
          <nav className="quick-actions" aria-label="Invitation actions"><a href={whatsappShareUrl} aria-label="Share invitation on WhatsApp"><Share2 /><span>Share</span></a><a href={config.wedding.maps} target="_blank" rel="noreferrer"><MapPin /><span>Location</span></a><button onClick={() => downloadCalendar("wedding")}><CalendarDays /><span>Calendar</span></button></nav>
          <a href="#blessing" className="scroll-cue">Our celebration <ChevronDown /></a>
        </div>
        <img className="lotus-art" src="./assets/decor/lotus-footer.webp" width="941" height="281" alt="" aria-hidden="true" />
      </section>

      <section className="blessing" id="blessing">
        <BackgroundArt variant="blessing" />
        <div className="blessing-image"><img loading="lazy" decoding="async" width="800" height="600" src={config.images.templeWide} alt="Guruvayur Temple complex at sunset" /></div>
        <div className="blessing-copy"><span className="peacock-mark">❧</span><SectionHeading eyebrow="With divine grace">ശ്രീ ഗുരുവായൂരപ്പന്റെ അനുഗ്രഹത്തോടെ</SectionHeading><p>ഭഗവാന്റെ അനുഗ്രഹത്താൽ ഞങ്ങളുടെ ജീവിതത്തിലെ പുതിയൊരു അധ്യായത്തിന് തുടക്കമാകുന്നു.</p><p className="english-blessing">With Lord Guruvayurappan&apos;s blessings, we begin a new chapter of our lives.</p></div>
      </section>

      <section className="countdown-section"><BackgroundArt variant="countdown" /><SectionHeading eyebrow="Until we say yes">The Auspicious Moment</SectionHeading><Countdown /></section>

      <section className="events" id="events"><BackgroundArt variant="events" /><SectionHeading eyebrow="Join our celebrations">Two Days, One Beautiful Beginning</SectionHeading><div className="event-list"><EventCard type="wedding"/><EventCard type="reception"/></div></section>

      <section className="closing"><BackgroundArt variant="closing" /><span className="closing-mark">SK</span><p>നിങ്ങളുടെ സാന്നിധ്യവും അനുഗ്രഹവും<br/>ഞങ്ങൾക്ക് അമൂല്യമാണ്</p><h2>With love, we await you.</h2><div className="closing-actions"><a className="button gold" href={whatsappShareUrl}><Share2 />Share on WhatsApp</a><a className="button outline" href="./assets/couple/letter-of-invite.jpeg" download="Sreekesh-Kashmeera-Invitation.jpeg"><Download />Download Invitation Letter</a></div><Heart className="heart" aria-hidden="true" /></section>
      <section className="couple-intro" aria-label="The bride and groom">
        <BackgroundArt variant="closing" />
        <SectionHeading eyebrow="A new chapter">The Bride &amp; Groom</SectionHeading>
        <div className="couple-portraits">
          <figure><div className="individual-portrait"><img src={config.images.bride} alt="Kashmeera, the bride, at a temple" width="406" height="351" loading="lazy" decoding="async" /></div><figcaption><span>The bride</span><h3>{config.couple.bride}</h3></figcaption></figure>
          <figure><div className="individual-portrait"><img src={config.images.groom} alt="Sreekesh, the groom, at a temple" width="458" height="458" loading="lazy" decoding="async" /></div><figcaption><span>The groom</span><h3>{config.couple.groom}</h3></figcaption></figure>
        </div>
      </section>
      <footer className="site-credit">Made with love by <a href="https://kadathanadtimes.com/contact" target="_blank" rel="noopener noreferrer">Team KTimes</a></footer>
    </main>
  </>
}
