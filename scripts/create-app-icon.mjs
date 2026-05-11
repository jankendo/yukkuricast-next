import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const buildDir = path.resolve('build')
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#122131"/>
      <stop offset="1" stop-color="#0a1119"/>
    </linearGradient>
    <linearGradient id="spark" x1="0" x2="1">
      <stop offset="0" stop-color="#35d0ff"/>
      <stop offset="1" stop-color="#ffbe45"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="232" height="232" rx="50" fill="url(#bg)" stroke="#385169" stroke-width="8"/>
  <circle cx="98" cy="126" r="42" fill="#ffe8d5" stroke="#16151a" stroke-width="10"/>
  <circle cx="160" cy="126" r="42" fill="#ffe6cb" stroke="#16151a" stroke-width="10"/>
  <path d="M62 102c12-36 56-45 86-18" fill="none" stroke="#d9274f" stroke-width="14" stroke-linecap="round"/>
  <path d="M127 88c38-26 78-15 96 22" fill="none" stroke="#ffcf5d" stroke-width="14" stroke-linecap="round"/>
  <path d="M76 126c13-15 28-15 42 0M142 126c13-15 28-15 42 0" fill="none" stroke="#141319" stroke-width="8" stroke-linecap="round"/>
  <path d="M99 152c21 22 45 22 66 0" fill="none" stroke="#141319" stroke-width="9" stroke-linecap="round"/>
  <path d="M66 202l124-124" stroke="url(#spark)" stroke-width="16" stroke-linecap="round"/>
  <path d="M174 50l10 28 28 10-28 10-10 28-10-28-28-10 28-10z" fill="#35d0ff"/>
</svg>`

function makeIco(png) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(0, 6)
  header.writeUInt8(0, 7)
  header.writeUInt8(0, 8)
  header.writeUInt8(0, 9)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, png])
}

await mkdir(buildDir, { recursive: true })
await writeFile(path.join(buildDir, 'icon.svg'), iconSvg, 'utf8')
const png = await sharp(Buffer.from(iconSvg)).resize(256, 256).png().toBuffer()
await writeFile(path.join(buildDir, 'icon.png'), png)
await writeFile(path.join(buildDir, 'icon.ico'), makeIco(png))
console.log(`Created ${path.join(buildDir, 'icon.ico')}`)
