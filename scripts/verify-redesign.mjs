import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import ts from "typescript"

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(ts.transpile(source, { module: ts.ModuleKind.ESNext })).toString("base64")}`
const configUrl = moduleUrl(await readFile("src/config.ts", "utf8"))
const calendarSource = (await readFile("src/calendar.ts", "utf8")).replace('"./config"', JSON.stringify(configUrl))
const { buildCalendar } = await import(moduleUrl(calendarSource))
for (const [type, start, end] of [["wedding", "20270124T030000Z", "20270124T040000Z"], ["reception", "20270126T083000Z", "20270126T103000Z"]]) {
  const calendar = buildCalendar(type, new Date("2026-11-04T00:00:00Z"))
  assert.ok(calendar.includes(`DTSTART:${start}\r\nDTEND:${end}`))
  assert.ok(calendar.endsWith("END:VCALENDAR\r\n"))
  assert.ok(calendar.includes("LOCATION:"))
}
console.log("Both calendar events preserve Asia/Kolkata times via UTC serialization.")

const browserPath = process.env.REVIEW_BROWSER || "C:/Program Files/Google/Chrome/Application/chrome.exe"
const reviewDir = await mkdtemp(join(tmpdir(), "wedding-review-"))
const preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort", "--base", "/sreekesh-karthika/"], { windowsHide: true, stdio: "ignore" })
const browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${reviewDir}`, "about:blank"], { windowsHide: true, stdio: "ignore" })
let socket
try {
  let port
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(reviewDir, "DevToolsActivePort"), "utf8")).split("\n")[0]; break } catch { await wait(100) }
  }
  assert.ok(port, "Chrome debugging must be available")
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch("http://127.0.0.1:4173/sreekesh-karthika/", { signal: AbortSignal.timeout(1000) })).ok) break } catch { /* Wait for preview. */ }
    await wait(100)
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) })).json()
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Chrome connection timed out")), 5000)
    socket.addEventListener("open", () => { clearTimeout(timeout); resolve() }, { once: true })
    socket.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("Chrome connection failed")) }, { once: true })
  })
  let id = 0
  const pending = new Map()
  const assetErrors = []
  const runtimeErrors = []
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const request = pending.get(message.id)
      if (message.error) request.reject(new Error(JSON.stringify(message.error)))
      else request.resolve(message.result)
      pending.delete(message.id)
    }
    if (message.method === "Network.responseReceived" && message.params.response.url.startsWith("http://127.0.0.1:4173/") && message.params.response.status >= 400) assetErrors.push(message.params.response.url)
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.text)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id
    pending.set(messageId, { resolve, reject })
    socket.send(JSON.stringify({ id: messageId, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await send("Page.enable")
  await send("Runtime.enable")
  await send("Network.enable")
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send("Page.navigate", { url: "http://127.0.0.1:4173/sreekesh-karthika/" })
  for (let i = 0; i < 100; i++) { if (await evaluate("!!document.querySelector('.slide-track')")) break; await wait(100) }
  await evaluate("Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 8000))]).then(() => true)")
  assert.equal(await evaluate("document.querySelector('main').inert"), true)
  const cover = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
  await writeFile(join(reviewDir, "cover-390.png"), Buffer.from(cover.data, "base64"))
  const lampStart = await evaluate("getComputedStyle(document.querySelector('.cover .lamp-left')).transform")
  await wait(650)
  assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.cover .lamp-left')).transform"), lampStart, "Lamp visibly oscillates independently on the cover")
  await evaluate("document.querySelector('.cover-content').click()")
  assert.equal(await evaluate("document.querySelector('main').inert"), true, "Cover tap must not bypass slider")
  const slider = await evaluate(`(()=>{const thumb=document.querySelector('.slide-thumb').getBoundingClientRect();return{x:thumb.x+thumb.width/2,y:thumb.y+thumb.height/2,distance:document.querySelector('.slide-track').clientWidth-64}})()`)
  const mouseSlide = async (fraction) => {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: slider.x, y: slider.y, button: "left", buttons: 1, clickCount: 1 })
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: slider.x + slider.distance * fraction, y: slider.y, button: "left", buttons: 1 })
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: slider.x + slider.distance * fraction, y: slider.y, button: "left", buttons: 0, clickCount: 1 })
  }
  await mouseSlide(.4)
  await wait(350)
  assert.equal(await evaluate("document.querySelector('.slide-track').getAttribute('aria-valuenow')"), "0", "Incomplete drag resets")
  assert.equal(await evaluate("document.querySelector('main').inert"), true)
  await mouseSlide(1)
  await wait(150)
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy .eyebrow')).animationName"), "invitation-reveal")
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy .eyebrow')).opacity"), "0", "Reveal waits for opening doors")
  await wait(2600)
  assert.equal(await evaluate("[...document.querySelectorAll('.hero h1 > *')].every(el=>getComputedStyle(el).opacity==='1')"), true, "Names complete their staggered entrance")
  assert.equal(await evaluate("document.querySelector('main').inert"), false)
  assert.equal(await evaluate("document.querySelector('.cover').inert"), true)
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.arch-art')).transform"), "none", "Arch remains stationary while lamps swing")
  assert.equal(await evaluate("document.querySelectorAll('.count').length"), 4)
  const before = await evaluate("document.querySelector('.countdown').getAttribute('aria-label')")
  await wait(1200)
  assert.notEqual(await evaluate("document.querySelector('.countdown').getAttribute('aria-label')"), before)
  for (const width of [375, 390, 430, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 })
    await wait(150)
    const layout = await evaluate(`(() => {
      const main = document.querySelector('main').getBoundingClientRect();
      const names = [...document.querySelectorAll('h1 span')].map(el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,scroll:el.scrollWidth,width:el.clientWidth} });
      return {scroll:document.documentElement.scrollWidth,viewport:innerWidth,mainWidth:main.width,names,portrait:document.querySelector('.portrait-frame img').naturalWidth};
    })()`)
    assert.ok(layout.scroll <= width, `${width}px: horizontal overflow`)
    assert.ok(layout.mainWidth <= 620, "Desktop composition stays constrained")
    assert.ok(layout.portrait > 0, "Portrait loads at repository subpath")
    for (const name of layout.names) assert.ok(name.scroll <= name.width + 1, "Malayalam names fit")
    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
    await writeFile(join(reviewDir, `hero-${width}.png`), Buffer.from(screenshot.data, "base64"))
    console.log(`${width}px: no horizontal overflow, portrait loaded, names fit.`)
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate(`(async()=>{for(const image of document.querySelectorAll('img[loading="lazy"]')){image.scrollIntoView({behavior:'instant'});await image.decode()}return true})()`)
  await evaluate("window.scrollTo({top:0,behavior:'instant'});true")
  const metrics = await send("Page.getLayoutMetrics")
  const fullPage = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 390, height: metrics.cssContentSize.height, scale: 1 } })
  await writeFile(join(reviewDir, "full-page-390.png"), Buffer.from(fullPage.data, "base64"))
  const maps = await evaluate("[...document.querySelectorAll('a[target=\"_blank\"]')].map(a=>a.href)")
  assert.ok(maps.includes("https://maps.app.goo.gl/8jQV7yQxYLCxtCeU8"))
  assert.ok(maps.includes("https://maps.app.goo.gl/9HpKPjxdM1rJcyHJ6"))
  const downloads = await evaluate(`(async () => {
    const blobs=[]; const original=URL.createObjectURL; const click=HTMLAnchorElement.prototype.click;
    URL.createObjectURL=blob=>{blobs.push(blob);return original(blob)}; HTMLAnchorElement.prototype.click=function(){};
    [...document.querySelectorAll('.actions button')].forEach(button=>button.click());
    const calendars=await Promise.all(blobs.map(blob=>blob.text())); URL.createObjectURL=original; HTMLAnchorElement.prototype.click=click; return calendars;
  })()`)
  assert.equal(downloads.length, 2)
  assert.ok(downloads[0].includes("DTSTART:20270124T030000Z"))
  assert.ok(downloads[1].includes("DTSTART:20270126T083000Z"))
  const whatsappClicks = await evaluate(`(()=>{
    window.whatsappClicks=[];window.nativeShareCalls=0;window.clipboardCalls=0;
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{window.nativeShareCalls++}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{window.clipboardCalls++}}});
    const links=[...document.querySelectorAll('a[href^="https://wa.me/"]')];
    for(const link of links){link.addEventListener('click',event=>{event.preventDefault();window.whatsappClicks.push(link.href)});link.click()}
    return {urls:window.whatsappClicks,nativeShare:window.nativeShareCalls,clipboard:window.clipboardCalls};
  })()`)
  assert.equal(whatsappClicks.urls.length, 2, "Both Share controls navigate to WhatsApp")
  for (const href of whatsappClicks.urls) {
    const message = new URL(href).searchParams.get("text")
    assert.ok(message.includes("ശ്രീകേഷ് & കാർത്തിക"))
    assert.ok(message.includes("https://sreekesh-karthika.vercel.app/"))
    assert.ok(message.includes("24 ജനുവരി 2027"))
    assert.ok(message.includes("26 ജനുവരി 2027"))
    assert.ok(!message.includes("localhost"))
  }
  assert.equal(whatsappClicks.nativeShare, 0)
  assert.equal(whatsappClicks.clipboard, 0, "Sharing never copies the link")
  const html = await (await fetch("http://127.0.0.1:4173/sreekesh-karthika/")).text()
  assert.match(html, /property="og:image" content="https:\/\/sreekesh-karthika.vercel.app\/assets\/couple\/previ.jpeg"/)
  assert.match(html, /property="og:image:width" content="1076"/)
  assert.match(html, /property="og:image:height" content="1599"/)
  const previewImage = await fetch("http://127.0.0.1:4173/sreekesh-karthika/assets/couple/previ.jpeg")
  assert.equal(previewImage.status, 200)
  assert.match(previewImage.headers.get("content-type"), /image\/jpeg/)
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: reviewDir })
  await evaluate("document.querySelector('.closing-actions a[download]').click()")
  let letter
  for (let i = 0; i < 50; i++) {
    try { letter = await readFile(join(reviewDir, "Sreekesh-Karthika-Invitation.jpeg")); break } catch { await wait(100) }
  }
  assert.ok(letter, "Invitation letter downloads")
  assert.deepEqual(letter, await readFile("public/assets/couple/letter-of-invite.jpeg"), "Download matches the supplied JPEG")
  await evaluate("document.querySelector('.music-toggle').click()")
  await wait(300)
  const playing = await evaluate("!document.querySelector('audio').paused")
  if (!playing) await evaluate("document.querySelector('.music-toggle').click()")
  await wait(500)
  assert.equal(await evaluate("document.querySelector('audio').loop"), true)
  assert.equal(await evaluate("!document.querySelector('audio').paused"), true)
  await evaluate("document.querySelector('.music-toggle').click()")
  assert.equal(await evaluate("document.querySelector('audio').paused"), true)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] })
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.slide-label')).animationName"), "none")
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy .eyebrow')).animationName"), "none")
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero .lamp-left')).animationName"), "none", "Reduced motion disables lamp swing")
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send("Emulation.setTouchEmulationEnabled", { enabled: true })
  await send("Page.navigate", { url: "http://127.0.0.1:4173/sreekesh-karthika/" })
  for (let i = 0; i < 100; i++) { if (await evaluate("!!document.querySelector('.slide-track') && document.querySelector('main').inert")) break; await wait(100) }
  const touchSlider = await evaluate(`(()=>{const thumb=document.querySelector('.slide-thumb').getBoundingClientRect();return{x:thumb.x+thumb.width/2,y:thumb.y+thumb.height/2,distance:document.querySelector('.slide-track').clientWidth-64}})()`)
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchSlider.x, y: touchSlider.y }] })
  await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchSlider.x + touchSlider.distance, y: touchSlider.y }] })
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await wait(100)
  assert.equal(await evaluate("document.querySelector('main').inert"), false, "Sliding thumb opens invitation on touch")
  await send("Page.navigate", { url: "http://127.0.0.1:4173/sreekesh-karthika/" })
  for (let i = 0; i < 100; i++) { if (await evaluate("!!document.querySelector('.slide-track') && document.querySelector('main').inert")) break; await wait(100) }
  await evaluate("document.querySelector('.slide-track').focus()")
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 })
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 })
  assert.equal(await evaluate("document.querySelector('main').inert"), false, "Keyboard alternative opens invitation")
  assert.deepEqual(assetErrors, [])
  assert.deepEqual(runtimeErrors, [])
  console.log("WhatsApp navigation (no clipboard), preview metadata/image, slider, animations, invitation download, countdown, maps, calendars and music passed.")
  console.log(`Screenshots: ${reviewDir}`)
} finally {
  socket?.close()
  browser.kill()
  preview.kill()
}
