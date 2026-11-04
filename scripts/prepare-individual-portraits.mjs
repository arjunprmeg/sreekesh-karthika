import sharp from "sharp"

for (const [source, name] of [["1.png", "bride"], ["2.png", "groom"]]) {
  const result = await sharp(`public/assets/couple/${source}`)
    .resize({ width: 700, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(`public/assets/couple/${name}.webp`)
  console.log(`${name}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`)
}
