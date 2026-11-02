import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "logo.png");
const appDir = path.join(root, "src", "app");

async function squarePng(size) {
  return sharp(source)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** ICO container: header + one directory entry per PNG payload. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;

  entries.forEach(({ size, data }, index) => {
    const at = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at);
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.data)]);
}

function assertIcoHasSize(ico, expected) {
  const count = ico.readUInt16LE(4);
  const sizes = [];
  for (let index = 0; index < count; index += 1) {
    const at = 6 + index * 16;
    sizes.push(ico.readUInt8(at) || 256);
  }
  if (!sizes.includes(expected)) {
    throw new Error(`ICO missing ${expected}x${expected} entry (found ${sizes.join(", ")})`);
  }
  return sizes;
}

async function buildFavicon() {
  const entries = [];
  for (const size of [16, 32, 48]) {
    entries.push({ size, data: await squarePng(size) });
  }
  const ico = buildIco(entries);
  assertIcoHasSize(ico, 48);
  await writeFile(path.join(appDir, "favicon.ico"), ico);
  return ico.length;
}

async function buildIcons() {
  await sharp(await squarePng(512)).toFile(path.join(appDir, "icon.png"));
  await sharp(await squarePng(180)).toFile(path.join(appDir, "apple-icon.png"));
}

async function buildOpengraphImage() {
  const logo = (await readFile(source)).toString("base64");
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <image href="data:image/png;base64,${logo}" x="470" y="70" width="260" height="260" preserveAspectRatio="xMidYMid meet"/>
  <text x="600" y="440" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" text-anchor="middle">Dhaka College IT Club</text>
  <text x="600" y="505" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="8" text-anchor="middle">DCITC</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(appDir, "opengraph-image.png"));
  await writeFile(
    path.join(appDir, "opengraph-image.alt.txt"),
    "Dhaka College IT Club (DCITC) logo\n",
  );
}

await mkdir(appDir, { recursive: true });
const faviconBytes = await buildFavicon();
await buildIcons();
await buildOpengraphImage();
console.log(`favicon.ico: ${faviconBytes} bytes (16, 32, 48)`);
console.log("icon.png: 512x512, apple-icon.png: 180x180, opengraph-image.png: 1200x630");
