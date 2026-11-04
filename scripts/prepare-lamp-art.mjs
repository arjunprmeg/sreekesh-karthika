import sharp from "sharp"

const source = "public/assets/decor/arch.webp"
const output = "public/assets/decor"
// Isolate only the existing brass/chain/flame pixels from the supplied artwork.
// The two large-lamp masks exclude the adjacent small lamps.
const lamps = [
  { name: "lamp-left", left: 60, top: 60, width: 95, height: 270, large: true },
  { name: "lamp-right", left: 790, top: 60, width: 95, height: 270, large: true },
  { name: "lamp-small-left", left: 121, top: 95, width: 32, height: 140 },
  { name: "lamp-small-right", left: 790, top: 95, width: 32, height: 140 },
]
for (const { name, large, ...region } of lamps) {
  const { data, info } = await sharp(source).extract(region).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const index = (y * info.width + x) * 4
      const red = data[index], green = data[index + 1], blue = data[index + 2]
      const warm = Math.max(red - blue, Math.min(red, green, blue) - 95)
      const isolated = !large || y > 175 || (x >= 33 && x <= 61)
      data[index + 3] = isolated ? Math.round(data[index + 3] * Math.max(0, Math.min(1, (warm - 5) / 25))) : 0
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ lossless: true }).toFile(`${output}/${name}.webp`)
}
const removal = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="941" height="890">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="2"/></filter></defs>
  <g fill="white" filter="url(#soft)"><rect x="54" y="54" width="105" height="282" rx="7"/><rect x="783" y="54" width="109" height="282" rx="7"/></g>
</svg>`)
await sharp(source).composite([{ input: removal, blend: "dest-out" }])
  .webp({ quality: 90 }).toFile(`${output}/arch-without-lamps.webp`)
console.log("Prepared independent lamp layers and a stationary arch; original artwork preserved.")
