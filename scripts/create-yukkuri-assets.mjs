import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('public/assets/characters')
const bgDir = path.resolve('public/assets/backgrounds')

const characters = {
  reimu: {
    skin: '#ffe8d5',
    blush: '#ff9fae',
    hair: '#292026',
    hairLight: '#51343f',
    accessory: 'ribbon',
    accessoryColor: '#d82242',
    accent: '#ffdbe4',
  },
  marisa: {
    skin: '#ffe6cb',
    blush: '#ffb28e',
    hair: '#f1c55e',
    hairLight: '#ffe59b',
    accessory: 'hat',
    accessoryColor: '#211f2c',
    accent: '#fff0ba',
  },
  akari: {
    skin: '#ffe8d5',
    blush: '#ff9fae',
    hair: '#2b2024',
    hairLight: '#4b323c',
    accessory: 'ribbon',
    accessoryColor: '#d9274f',
    accent: '#ffdbe4',
  },
  kohaku: {
    skin: '#ffe6cb',
    blush: '#ffb28e',
    hair: '#f3c35c',
    hairLight: '#ffe39a',
    accessory: 'hat',
    accessoryColor: '#23202d',
    accent: '#fff0ba',
  },
  aoba: {
    skin: '#f4dfca',
    blush: '#f2a0bf',
    hair: '#31465f',
    hairLight: '#557095',
    accessory: 'headset',
    accessoryColor: '#41d7ff',
    accent: '#d7f5ff',
  },
}

const expressions = {
  neutral: {
    eyes: '<path d="M170 248c22 16 55 16 78 0" /><path d="M352 248c22 16 55 16 78 0" />',
    mouth: '<path d="M268 360c38 24 88 24 126 0" />',
    brow: '',
  },
  happy: {
    eyes: '<path d="M165 258c25-36 62-36 88 0" /><path d="M347 258c25-36 62-36 88 0" />',
    mouth: '<path d="M266 348c44 54 88 54 132 0" />',
    brow: '',
  },
  thinking: {
    eyes: '<path d="M172 248c18 10 44 10 62 0" /><circle cx="392" cy="250" r="14" />',
    mouth: '<path d="M282 364c28 14 64 8 92-10" />',
    brow: '<path d="M156 210l80-12" /><path d="M360 199l80 22" />',
  },
  surprised: {
    eyes: '<circle cx="205" cy="250" r="25" /><circle cx="395" cy="250" r="25" />',
    mouth: '<ellipse cx="300" cy="360" rx="32" ry="42" />',
    brow: '<path d="M165 198l72-28" /><path d="M363 170l72 28" />',
  },
  serious: {
    eyes: '<path d="M164 242c30-10 60-9 91 3" /><path d="M345 245c30-12 61-13 91-3" />',
    mouth: '<path d="M268 370c38-15 84-15 122 0" />',
    brow: '<path d="M158 205l86 26" /><path d="M356 231l86-26" />',
  },
}

function accessorySvg(kind, color) {
  if (kind === 'ribbon') {
    return `
      <g transform="translate(300 66)">
        <path d="M-22 24c-70-70-160-40-168 30 62 10 118 3 168-30z" fill="${color}" stroke="#5f1022" stroke-width="10"/>
        <path d="M22 24c70-70 160-40 168 30-62 10-118 3-168-30z" fill="${color}" stroke="#5f1022" stroke-width="10"/>
        <circle cx="0" cy="28" r="34" fill="#ff6a86" stroke="#5f1022" stroke-width="10"/>
      </g>`
  }

  if (kind === 'hat') {
    return `
      <g transform="translate(300 84) rotate(-6)">
        <ellipse cx="0" cy="66" rx="220" ry="42" fill="${color}" stroke="#090810" stroke-width="12"/>
        <path d="M-120 58C-98-76 98-76 120 58Z" fill="#2e2a3a" stroke="#090810" stroke-width="12"/>
        <path d="M-96 30h192l22 36H-118Z" fill="#fff2a8" stroke="#846a28" stroke-width="8"/>
      </g>`
  }

  return `
    <g>
      <path d="M118 255c-45 12-70 48-64 92 7 49 44 78 92 74" fill="none" stroke="#1b2638" stroke-width="24" stroke-linecap="round"/>
      <path d="M482 255c45 12 70 48 64 92-7 49-44 78-92 74" fill="none" stroke="#1b2638" stroke-width="24" stroke-linecap="round"/>
      <rect x="82" y="292" width="64" height="96" rx="24" fill="${color}" stroke="#1b2638" stroke-width="10"/>
      <rect x="454" y="292" width="64" height="96" rx="24" fill="${color}" stroke="#1b2638" stroke-width="10"/>
      <path d="M454 378c-10 92-76 126-164 112" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
    </g>`
}

function hairSvg(character) {
  return `
    <path d="M82 272C75 143 166 68 300 68s225 75 218 204c-31-56-86-92-158-114 0 0 24 58 18 92-38-70-90-108-156-126 9 48-14 102-64 146 4-61-24-98-76-118z"
      fill="${character.hair}" stroke="#17151a" stroke-width="12" stroke-linejoin="round"/>
    <path d="M140 186c84-62 184-78 304-12-70-28-146-16-228 34-38 23-61 45-76 66 0-30 0-58 0-88z"
      fill="${character.hairLight}" opacity=".42"/>
  `
}

function faceSvg(character, emotionName, expression) {
  const blinkMarks = emotionName === 'surprised' ? '<path d="M126 138l-34-32M474 138l34-32M300 96V50" />' : ''
  const cheek = emotionName === 'serious' ? '.28' : '.6'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="Original yukkuri ${emotionName} character">
  <defs>
    <radialGradient id="skin" cx="50%" cy="42%" r="58%">
      <stop offset="0" stop-color="#fff7eb"/>
      <stop offset=".75" stop-color="${character.skin}"/>
      <stop offset="1" stop-color="#e9b991"/>
    </radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".24"/>
    </filter>
  </defs>
  <g filter="url(#softShadow)">
    ${accessorySvg(character.accessory, character.accessoryColor)}
    ${hairSvg(character)}
    <ellipse cx="300" cy="320" rx="236" ry="210" fill="url(#skin)" stroke="#17151a" stroke-width="12"/>
    <path d="M116 306c32 15 64 15 96 0M388 306c32 15 64 15 96 0" fill="none" stroke="#d49b80" stroke-width="8" stroke-linecap="round" opacity=".35"/>
    <ellipse cx="190" cy="326" rx="52" ry="24" fill="${character.blush}" opacity="${cheek}"/>
    <ellipse cx="410" cy="326" rx="52" ry="24" fill="${character.blush}" opacity="${cheek}"/>
    <g fill="none" stroke="#17151a" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
      ${expression.brow}
      ${expression.eyes}
      ${expression.mouth}
      ${blinkMarks}
    </g>
    <path d="M104 418c54 82 130 122 232 114 72-6 126-34 162-84-41 76-107 122-198 126-98 3-169-48-196-156z" fill="${character.accent}" opacity=".26"/>
  </g>
</svg>`
}

function cleanSvg(svg) {
  return svg
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

function studioGridSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#101827"/>
      <stop offset="1" stop-color="#1f2a44"/>
    </linearGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0v80" fill="none" stroke="#7cc8ff" stroke-opacity=".09" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <path d="M0 836c420-106 782-126 1120-58 318 63 536 49 800-48v350H0z" fill="#35d0ff" opacity=".08"/>
</svg>`
}

function paperLightSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f8fbff"/>
  <path d="M140 180h1640M140 340h1640M140 500h1640M140 660h1640M140 820h1640" stroke="#b7c6d8" stroke-opacity=".32" stroke-width="3"/>
  <path d="M360 80v920M780 80v920M1200 80v920M1620 80v920" stroke="#ffc857" stroke-opacity=".18" stroke-width="4"/>
</svg>`
}

function classroomBoardSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#f2eadb"/>
      <stop offset="1" stop-color="#dfd4bf"/>
    </linearGradient>
    <linearGradient id="board" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#1f5b4c"/>
      <stop offset="1" stop-color="#163c35"/>
    </linearGradient>
    <pattern id="chalk" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M0 18h64M18 0v64" stroke="#ffffff" stroke-opacity=".035" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="url(#wall)"/>
  <rect x="120" y="94" width="1680" height="670" rx="18" fill="#6b4d2f"/>
  <rect x="148" y="122" width="1624" height="614" rx="10" fill="url(#board)"/>
  <rect x="148" y="122" width="1624" height="614" rx="10" fill="url(#chalk)"/>
  <path d="M230 220h360M230 302h520M230 384h430" stroke="#d8efe4" stroke-opacity=".42" stroke-width="12" stroke-linecap="round"/>
  <path d="M1180 218h420M1180 304h330M1180 390h460" stroke="#f4e3a1" stroke-opacity=".38" stroke-width="10" stroke-linecap="round"/>
  <rect x="0" y="764" width="1920" height="316" fill="#c9b187"/>
  <path d="M0 842h1920M0 940h1920M280 764v316M620 764v316M960 764v316M1300 764v316M1640 764v316" stroke="#a98d62" stroke-opacity=".34" stroke-width="4"/>
</svg>`
}

function newsDeskSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#e9f1fb"/>
      <stop offset=".56" stop-color="#cdddf1"/>
      <stop offset="1" stop-color="#aebfd8"/>
    </linearGradient>
    <linearGradient id="desk" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#d9e3ef"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect x="112" y="86" width="1696" height="560" rx="24" fill="#20324c" opacity=".9"/>
  <rect x="154" y="126" width="770" height="220" rx="16" fill="#f9fbff" opacity=".92"/>
  <rect x="996" y="126" width="770" height="220" rx="16" fill="#f9fbff" opacity=".92"/>
  <path d="M210 246h460M1048 246h420M1048 306h320" stroke="#3158a8" stroke-width="16" stroke-linecap="round" opacity=".72"/>
  <path d="M210 306h560" stroke="#e1a12b" stroke-width="14" stroke-linecap="round" opacity=".72"/>
  <path d="M0 650h1920v430H0z" fill="#edf4fb"/>
  <path d="M290 736h1340c94 0 170 76 170 170v174H120V906c0-94 76-170 170-170z" fill="url(#desk)" stroke="#9eb0c4" stroke-width="5"/>
  <path d="M550 800h820" stroke="#3158a8" stroke-width="18" stroke-linecap="round" opacity=".38"/>
</svg>`
}

function tatamiRoomSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f4ead7"/>
  <rect x="0" y="0" width="1920" height="630" fill="#efe1c8"/>
  <rect x="126" y="92" width="560" height="470" fill="#f8f6ed" stroke="#9c7d55" stroke-width="12"/>
  <path d="M312 92v470M500 92v470M126 248h560M126 406h560" stroke="#c7b18e" stroke-width="7"/>
  <rect x="1234" y="96" width="560" height="462" fill="#f7f4e9" stroke="#866b48" stroke-width="12"/>
  <path d="M1420 96v462M1608 96v462M1234 250h560M1234 404h560" stroke="#c7b18e" stroke-width="7"/>
  <rect x="0" y="630" width="1920" height="450" fill="#b7c46d"/>
  <path d="M0 720h1920M0 900h1920M240 630v450M640 630v450M1040 630v450M1440 630v450" stroke="#83924a" stroke-opacity=".55" stroke-width="6"/>
  <ellipse cx="960" cy="728" rx="260" ry="44" fill="#6c4b30" opacity=".26"/>
</svg>`
}

function nightCitySvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#111b35"/>
      <stop offset=".58" stop-color="#243a66"/>
      <stop offset="1" stop-color="#e0b46a"/>
    </linearGradient>
    <pattern id="window" width="42" height="54" patternUnits="userSpaceOnUse">
      <rect x="10" y="12" width="12" height="18" rx="2" fill="#ffe6a3" opacity=".52"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <path d="M0 720h140V520h180v200h170V430h210v290h130V560h190v160h170V390h230v330h150V500h190v220h160v360H0z" fill="#121a27"/>
  <path d="M0 720h140V520h180v200h170V430h210v290h130V560h190v160h170V390h230v330h150V500h190v220h160v360H0z" fill="url(#window)" opacity=".52"/>
  <path d="M0 792c360-80 610-70 882 8 300 86 632 84 1038-22v302H0z" fill="#09101b" opacity=".68"/>
</svg>`
}

await mkdir(outDir, { recursive: true })
await mkdir(bgDir, { recursive: true })

for (const [characterName, character] of Object.entries(characters)) {
  for (const [emotionName, expression] of Object.entries(expressions)) {
    const filePath = path.join(outDir, `${characterName}-${emotionName}.svg`)
    await writeFile(filePath, cleanSvg(faceSvg(character, emotionName, expression)), 'utf8')
  }
}

await writeFile(path.join(bgDir, 'studio-grid.svg'), cleanSvg(studioGridSvg()), 'utf8')
await writeFile(path.join(bgDir, 'paper-light.svg'), cleanSvg(paperLightSvg()), 'utf8')
await writeFile(path.join(bgDir, 'classroom-board.svg'), cleanSvg(classroomBoardSvg()), 'utf8')
await writeFile(path.join(bgDir, 'news-desk.svg'), cleanSvg(newsDeskSvg()), 'utf8')
await writeFile(path.join(bgDir, 'tatami-room.svg'), cleanSvg(tatamiRoomSvg()), 'utf8')
await writeFile(path.join(bgDir, 'night-city.svg'), cleanSvg(nightCitySvg()), 'utf8')

console.log(`Generated ${Object.keys(characters).length * Object.keys(expressions).length} character assets in ${outDir}`)
