// ============================================================================
// gen-icons.mjs — generator ikon PNG (maskable + regular) dla PWA / Android.
// Tworzy minimalistyczną, jednolitą ikonę w kolorze akcentu (zapełniony safe-zone).
// Uruchom: node scripts/gen-icons.mjs
// Icony produkcyjne można podmienić/poprawić w /public/icons.
// ============================================================================

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'icons');

// Kolor akcentu Mayo-lime z systemu designowego.
const BG_R = 0x84;
const BG_G = 0xcc;
const BG_B = 0x16;

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Generuje PNG pod danym rozmiarem (kwadrat, kolor akcentu). */
function makePng(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter "None"
    for (let x = 0; x < size; x += 1) {
      const o = rowStart + 1 + x * 4;
      raw[o] = BG_R;
      raw[o + 1] = BG_G;
      raw[o + 2] = BG_B;
      raw[o + 3] = 255; // fully opaque
    }
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const icons = [
  { size: 192, names: ['icon-192.png', 'icon-192-maskable.png'] },
  { size: 512, names: ['icon-512.png', 'icon-512-maskable.png'] },
];

mkdirSync(OUT, { recursive: true });

for (const icon of icons) {
  const png = makePng(icon.size);
  for (const name of icon.names) {
    const target = join(OUT, name);
    writeFileSync(target, png);
    console.log(`✓ ${name} (${icon.size}x${icon.size})`);
  }
}

console.log('Ikony wygenerowane.');