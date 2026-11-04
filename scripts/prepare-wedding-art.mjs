import sharp from "sharp"
import { mkdir } from "node:fs/promises"

// Deterministic crops/masking only: never modify or regenerate the couple's faces.
const reference = "public/wedding-design-reference.png.png"
const output = "public/assets/decor"
await mkdir(output, { recursive: true })
const { width, height } = await sharp(reference).metadata()
if (width !== 941 || height !== 1671) throw new Error("Expected the supplied 941 × 1671 reference")
const mask = Buffer.from(`<svg width="941" height="890" xmlns="http://www.w3.org/2000/svg">
  <path fill="white" fill-rule="evenodd" d="M0 0H941V875H0Z
    M185 875V390Q185 300 280 260L330 205L400 185H565L620 235L710 300L755 390V875Z"/>
</svg>`)
await sharp(reference).extract({ left: 0, top: 0, width: 941, height: 890 })
  .composite([{ input: mask, blend: "dest-in" }]).webp({ quality: 88 }).toFile(`${output}/arch.webp`)
const leftLotus = await sharp(reference).extract({ left: 0, top: 1390, width: 185, height: 281 }).toBuffer()
const rightLotus = await sharp(reference).extract({ left: 756, top: 1390, width: 185, height: 281 }).toBuffer()
const water = await sharp(reference).extract({ left: 185, top: 1515, width: 571, height: 156 }).toBuffer()
await sharp({ create: { width: 941, height: 281, channels: 4, background: "#00162b" } })
  .composite([{ input: leftLotus, left: 0, top: 0 }, { input: rightLotus, left: 756, top: 0 }, { input: water, left: 185, top: 125 }])
  .webp({ quality: 85 }).toFile(`${output}/lotus-footer.webp`)
await sharp("public/assets/couple/bride-groomportrait-.png").resize({ width: 1000, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 100 }).toFile("public/assets/couple/bride-groom-portrait.webp")
console.log("Prepared reference artwork and transparent portrait; originals preserved.")
