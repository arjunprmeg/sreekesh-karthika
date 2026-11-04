import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, Check, ChevronDown, Copy, ExternalLink, Heart, MapPin, Share2, Volume2, VolumeX } from "lucide-react"
import { weddingConfig as config } from "./config"

const pad = (n: number) => String(n).padStart(2, "0")

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function downloadCalendar(type: "wedding" | "reception") {
  const event = config[type]
  const title = type === "wedding" ? "Wedding of Sreekesh & Karthika" : "Wedding Reception of Sreekesh & Karthika"
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sreekesh & Karthika//Wedding Invitation//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${type}-sreekesh-karthika-2027`, `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(new Date(event.start))}`, `DTEND:${formatIcsDate(new Date(event.end))}`,
    `SUMMARY:${title}`, `LOCATION:${event.venue.replace(/,/g, "\\,")}`,
    `DESCRIPTION:With love, we invite you to celebrate with us. Directions: ${event.maps}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n")
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `${type}-sreekesh-karthika.ics`
  link.click()
  URL.revokeObjectURL(url)
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

function InvitationCover({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const startX = useRef<number | null>(null)
  return <div className={`cover ${open ? "is-open" : ""}`} aria-hidden={open} onClick={onOpen}
    onTouchStart={(e) => { startX.current = e.touches[0].clientX }}
    onTouchEnd={(e) => { if (startX.current !== null && Math.abs(e.changedTouches[0].clientX - startX.current) > 45) onOpen() }}>
    <button className="cover-trigger" onClick={onOpen} aria-label="Open wedding invitation">
      <span className="cover-kicker">Together with their families</span>
      <span className="cover-names">ശ്രീകേഷ് <i>&</i> കാർത്തിക</span>
      <span className="cover-save">Save the Date</span>
      <span className="cover-date">24 · January · 2027</span>
      <span className="open-pill">Swipe or tap to open <ChevronDown /></span>
    </button>
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
    <div className="event-image"><img src={wedding ? config.images.templeFacade : config.images.floral} alt={wedding ? "Guruvayur Sri Krishna Temple facade in warm evening light" : "Peacock feathers with a golden flower on blue watercolor"} /></div>
    <div className="event-content">
      <span className="event-number">{wedding ? "01" : "02"}</span>
      <p className="event-kicker">{wedding ? "The sacred ceremony" : "An afternoon of celebration"}</p>
      <h3>{wedding ? "വിവാഹം" : "വിവാഹ സൽക്കാരം"}</h3>
      <p className="event-couple">ശ്രീകേഷ് <i>&</i> കാർത്തിക</p>
      <dl><div><dt>Date</dt><dd>{event.dateLabel}</dd></div><div><dt>Time</dt><dd>{event.timeLabel}</dd></div><div><dt>Venue</dt><dd>{event.venue}</dd></div></dl>
      <div className="actions"><a className="button primary" href={event.maps} target="_blank" rel="noreferrer"><MapPin />Get {wedding ? "Wedding" : "Reception"} Directions<ExternalLink /></a><button className="button secondary" onClick={() => downloadCalendar(type)}><CalendarDays />Add to Calendar</button></div>
    </div>
  </article>
}

export default function App() {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const musicEnabled = useRef(true)
  const [musicPlaying, setMusicPlaying] = useState(false)
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
  const copyLink = async () => {
    const url = window.location.href
    try { await navigator.clipboard.writeText(url) } catch { const area = document.createElement("textarea"); area.value = url; document.body.append(area); area.select(); document.execCommand("copy"); area.remove() }
    setCopied(true); window.setTimeout(() => setCopied(false), 2200)
  }
  const share = async () => {
    const text = "ശ്രീകേഷിന്റെയും കാർത്തികയുടെയും വിവാഹത്തിലേക്ക് സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു. 💛\n\nവിവാഹം: 24 ജനുവരി 2027, ഗുരുവായൂർ ക്ഷേത്രം.\nവിവാഹ സൽക്കാരം: 26 ജനുവരി 2027, രശ്മിവരം, പയ്യോളി."
    if (navigator.share) { try { await navigator.share({ title: "Sreekesh & Karthika — Wedding Invitation", text, url: window.location.href }); return } catch { return } }
    await copyLink()
  }
  return <>
    <audio ref={audioRef} src="./assets/Thanthaay.mp3" autoPlay loop preload="auto"
      onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)}
      onError={() => setMusicPlaying(false)} />
    <button type="button" className="music-toggle" onClick={toggleMusic}
      aria-label={musicPlaying ? "Turn background music off" : "Turn background music on"}
      aria-pressed={musicPlaying}>
      {musicPlaying ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      <span>Music {musicPlaying ? "on" : "off"}</span>
    </button>
    <InvitationCover open={opened} onOpen={openInvitation} />
    <main className={opened ? "revealed" : ""}>
      <section className="hero" id="home">
        <div className="hero-art"><div className="portrait-frame"><img src={config.images.couple} alt="Sreekesh and Karthika together" /></div></div>
        <div className="hero-copy"><p className="eyebrow">Save the date · 24.01.2027</p><h1><span>ശ്രീകേഷ്</span><i>&</i><span>കാർത്തിക</span></h1><p className="malayalam-welcome">ഞങ്ങളുടെ വിവാഹത്തിലേക്ക്<br/>സ്നേഹപൂർവ്വം സ്വാഗതം</p><p className="date-line">24 January 2027 <b>·</b> Sunday</p><a href="#blessing" className="scroll-cue">Begin our story <ChevronDown /></a></div>
      </section>

      <section className="blessing" id="blessing">
        <div className="blessing-image"><img src={config.images.templeWide} alt="Pilgrims walking through the Guruvayur Temple complex at sunset" /></div>
        <div className="blessing-copy"><span className="peacock-mark">❧</span><SectionHeading eyebrow="With divine grace">ശ്രീ ഗുരുവായൂരപ്പന്റെ അനുഗ്രഹത്തോടെ</SectionHeading><p>ഭഗവാന്റെ അനുഗ്രഹത്താൽ ഞങ്ങളുടെ ജീവിതത്തിലെ പുതിയൊരു അധ്യായത്തിന് തുടക്കമാകുന്നു.</p><p className="english-blessing">With Lord Guruvayurappan&apos;s blessings, we begin a new chapter of our lives.</p></div>
      </section>

      <section className="countdown-section"><SectionHeading eyebrow="Until we say yes">The Auspicious Moment</SectionHeading><Countdown /></section>

      <section className="events" id="events"><SectionHeading eyebrow="Join our celebrations">Two Days, One Beautiful Beginning</SectionHeading><div className="event-list"><EventCard type="wedding"/><EventCard type="reception"/></div></section>

      <section className="closing"><span className="closing-mark">SK</span><p>നിങ്ങളുടെ സാന്നിധ്യവും അനുഗ്രഹവും<br/>ഞങ്ങൾക്ക് അമൂല്യമാണ്</p><h2>With love, we await you.</h2><div className="closing-actions"><button className="button gold" onClick={share}><Share2 />Share Invitation</button><button className="button outline" onClick={copyLink}>{copied ? <Check /> : <Copy />}{copied ? "Link Copied!" : "Copy Link"}</button></div><Heart className="heart" aria-hidden="true" /></section>
    </main>
    {opened && <nav className="quick-actions" aria-label="Invitation actions"><button onClick={share} aria-label="Share invitation"><Share2 /></button><a href={config.wedding.maps} target="_blank" rel="noreferrer" aria-label="Wedding location"><MapPin /></a><button onClick={() => downloadCalendar("wedding")} aria-label="Add wedding to calendar"><CalendarDays /></button></nav>}
  </>
}
