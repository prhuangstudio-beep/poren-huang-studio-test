const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const [inputDirectory, outputDirectory] = process.argv.slice(2);
if (!inputDirectory || !outputDirectory) throw new Error('Usage: node remove-donut-background.js <input-directory> <output-directory>');

const isBackground = (red, green, blue) => {
  const high = Math.max(red, green, blue), low = Math.min(red, green, blue);
  return high >= 186 && high - low <= 30;
};

const isSculpture = (red, green, blue, alpha) => {
  const high = Math.max(red, green, blue), low = Math.min(red, green, blue);
  return alpha > 20 && (high - low > 35 || low < 170);
};

const findPieces = (data, width, height) => {
  const count = width * height, mask = new Uint8Array(count), labels = new Int32Array(count);
  for (let index = 0; index < count; index += 1) {
    const pixel = index * 4;
    if (isSculpture(data[pixel], data[pixel + 1], data[pixel + 2], data[pixel + 3])) mask[index] = 1;
  }
  const pieces = [], queue = new Int32Array(count);
  let nextLabel = 1;
  for (let start = 0; start < count; start += 1) {
    if (!mask[start] || labels[start]) continue;
    let head = 0, tail = 0, area = 0, x0 = width, y0 = height, x1 = 0, y1 = 0;
    queue[tail++] = start; labels[start] = nextLabel;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      area += 1; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const neighbours = [index - 1, index + 1, index - width, index + width];
      for (const neighbour of neighbours) {
        if (neighbour < 0 || neighbour >= count || labels[neighbour] || !mask[neighbour]) continue;
        const neighbourX = neighbour % width;
        if ((neighbour === index - 1 && neighbourX === width - 1) || (neighbour === index + 1 && neighbourX === 0)) continue;
        labels[neighbour] = nextLabel; queue[tail++] = neighbour;
      }
    }
    if (area > 400) pieces.push({ label: nextLabel, area, x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 });
    nextLabel += 1;
  }
  return { labels, pieces: pieces.sort((a, b) => b.area - a.area).slice(0, 6) };
};

const alignedMain = async (source, reference, target) => {
  const main = await sharp(source).resize(1920, 1080, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const base = await sharp(reference).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mainPieces = findPieces(main.data, main.info.width, main.info.height);
  const basePieces = findPieces(base.data, base.info.width, base.info.height);
  const layers = await Promise.all(mainPieces.pieces.map(async (piece, index) => {
    const destination = basePieces.pieces[index], width = piece.width, height = piece.height, pixels = Buffer.alloc(width * height * 4);
    for (let y = piece.y0; y <= piece.y1; y += 1) for (let x = piece.x0; x <= piece.x1; x += 1) {
      const sourceIndex = y * main.info.width + x, sourcePixel = sourceIndex * 4, targetPixel = ((y - piece.y0) * width + x - piece.x0) * 4;
      main.data.copy(pixels, targetPixel, sourcePixel, sourcePixel + 4);
      if (mainPieces.labels[sourceIndex] !== piece.label) pixels[targetPixel + 3] = 0;
    }
    const image = await sharp(pixels, { raw: { width, height, channels: 4 } }).resize(destination.width, destination.height, { fit: 'fill' }).png().toBuffer();
    return { input: image, left: destination.x0, top: destination.y0 };
  }));
  await sharp({ create: { width: 1920, height: 1080, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } }).composite(layers).webp({ quality: 90, alphaQuality: 100 }).toFile(target);
};

const clearConnectedBackground = (data, width, height) => {
  const pixels = width * height, visible = new Uint8Array(pixels), queue = new Int32Array(pixels);
  let head = 0, tail = 0;
  const add = index => {
    if (visible[index]) return;
    const pixel = index * 4;
    if (!isBackground(data[pixel], data[pixel + 1], data[pixel + 2])) return;
    visible[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) { add(x); add((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { add(y * width); add(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width);
    if (x) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (y) add(index - width);
    if (y < height - 1) add(index + width);
  }
  for (let index = 0; index < pixels; index += 1) if (visible[index]) data[index * 4 + 3] = 0;
};

async function convert(source, target, shouldCleanBackground, isMainFrame) {
  if (isMainFrame) {
    await alignedMain(source, path.join(inputDirectory, '32..png'), target);
    return;
  }
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (shouldCleanBackground) clearConnectedBackground(data, info.width, info.height);
  await sharp(data, { raw: info }).webp({ quality: 90, alphaQuality: 100 }).toFile(target);
}

const mainFile = 'IMPORTANT_CORRECTION_The_curre_Nano_Banana_2_431471.png';
const sourceFiles = [
  ...Array.from({ length: 31 }, (_, index) => `${index + 1}.png`),
  mainFile,
  mainFile,
  mainFile,
  mainFile,
  mainFile,
  ...Array.from({ length: 9 }, (_, index) => `${index + 33}.png`)
];
fs.mkdirSync(outputDirectory, { recursive: true });
async function run() {
  for (const [index, file] of sourceFiles.entries()) {
    await convert(path.join(inputDirectory, file), path.join(outputDirectory, `${String(index + 1).padStart(3, '0')}.webp`), index < 6, file === mainFile);
    process.stdout.write(`\rProcessed ${index + 1}/${sourceFiles.length}`);
  }
  process.stdout.write('\n');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
