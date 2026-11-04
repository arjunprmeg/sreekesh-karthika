import sharp from "sharp"

// Optimize the supplied artwork without altering its design or transparency.
const assets = [
  ["extured (1).png", "temple"],
  ["extured (2).png", "divider"],
  ["extured (3).png", "mural"],
  ["extured (4).png", "corner"],
  ["extured (5).png", "pillar"],
  ["extured (6).png", "palm"],
  ["extured.png", "lotus"],
]
for (const [source, name] of assets) {
  const info = await sharp(`public/assets/bg/${source}`)
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(`public/assets/bg/${name}.webp`)
  console.log(`${name}: ${Math.round(info.size / 1024)} KB`)
}
