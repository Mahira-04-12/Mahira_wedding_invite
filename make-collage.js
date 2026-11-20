const sharp = require("sharp");
const path = require("path");

const assets = (f) => path.join(__dirname, "public", "assets", f);

async function cell(file, w, h) {
  return sharp(assets(file))
    .rotate()
    .resize(w, h, { fit: "cover", position: "attention" })
    .toBuffer();
}

async function makeCollage(opts) {
  const { name, width, height, cols, rows, gap, images } = opts;
  const cellW = Math.floor((width - (cols - 1) * gap) / cols);
  const cellH = Math.floor((height - (rows - 1) * gap) / rows);
  const composites = [];

  for (let i = 0; i < images.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * (cellW + gap);
    const y = row * (cellH + gap);
    const buf = await cell(images[i], cellW, cellH);
    composites.push({ input: buf, left: x, top: y });
  }

  await sharp({
    create: { width, height, channels: 3, background: { r: 13, g: 40, b: 24 } },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(assets(name));

  console.log(`${name}: ${width}x${height}`);
}

async function run() {
  // Portrait 3x3 (phones / portrait screens) — matches couple.jpg at 1080x1458
  await makeCollage({
    name: "collage-portrait.jpg",
    width: 1080,
    height: 1458,
    cols: 3,
    rows: 3,
    gap: 3,
    images: [
      "6.jpg", "1.jpg", "7.jpg",
      "5.jpg", "8.jpg", "3.jpg",
      "2.jpg", "4.jpg", "9.jpg",
    ],
  });

  // Landscape 3x2 (desktop / wide screens) — 1920x1080
  await makeCollage({
    name: "collage-landscape.jpg",
    width: 1920,
    height: 1080,
    cols: 3,
    rows: 2,
    gap: 3,
    images: [
      "6.jpg", "1.jpg", "7.jpg",
      "8.jpg", "4.jpg", "9.jpg",
    ],
  });
}

run().catch(console.error);
