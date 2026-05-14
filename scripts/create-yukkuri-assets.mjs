import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('public/assets/characters')
const bgDir = path.resolve('public/assets/backgrounds')
const effectDir = path.resolve('public/assets/effects')

const expressions = {
  neutral: expressionNeutral,
  happy: expressionHappy,
  thinking: expressionThinking,
  surprised: expressionSurprised,
  serious: expressionSerious,
  smug: expressionSmug,
  confused: expressionConfused,
  angry: expressionAngry,
  flustered: expressionFlustered,
}

const characters = {
  reimu: {
    label: 'Reimu-style original yukkuri head',
    skin: '#ffe8d5',
    skinEdge: '#e8b68d',
    blush: '#ff98aa',
    hair: '#221a20',
    hairShade: '#4b3038',
    hairGlow: '#6b4350',
    accessory: 'reimu-ribbon',
    accessoryColor: '#d91f3f',
    accessoryShade: '#7a1025',
    accent: '#ffe3ea',
    eye: '#6b2a32',
  },
  marisa: {
    label: 'Marisa-style original yukkuri head',
    skin: '#ffe6cb',
    skinEdge: '#e7b283',
    blush: '#ffad8f',
    hair: '#f4c65f',
    hairShade: '#bd8432',
    hairGlow: '#ffeaa0',
    accessory: 'marisa-hat',
    accessoryColor: '#1c1a24',
    accessoryShade: '#09080f',
    accent: '#fff2b6',
    eye: '#5f3b19',
  },
  akari: {
    label: 'Original red-ribbon yukkuri head',
    skin: '#ffe8d5',
    skinEdge: '#e8b68d',
    blush: '#ff9fb0',
    hair: '#2b2024',
    hairShade: '#51343f',
    hairGlow: '#6f4554',
    accessory: 'reimu-ribbon',
    accessoryColor: '#cc294c',
    accessoryShade: '#741126',
    accent: '#ffdbe4',
    eye: '#6b2a32',
  },
  kohaku: {
    label: 'Original witch-hat yukkuri head',
    skin: '#ffe6cb',
    skinEdge: '#e7b283',
    blush: '#ffb28e',
    hair: '#f0bf55',
    hairShade: '#b97f2d',
    hairGlow: '#ffe39a',
    accessory: 'marisa-hat',
    accessoryColor: '#22202c',
    accessoryShade: '#09080f',
    accent: '#fff0ba',
    eye: '#5f3b19',
  },
  aoba: {
    label: 'Original headset yukkuri head',
    skin: '#f4dfca',
    skinEdge: '#d5a983',
    blush: '#f2a0bf',
    hair: '#31465f',
    hairShade: '#182536',
    hairGlow: '#557095',
    accessory: 'headset',
    accessoryColor: '#41d7ff',
    accessoryShade: '#102332',
    accent: '#d7f5ff',
    eye: '#18314b',
  },
}

function expressionNeutral(c) {
  return `
    <path d="M176 270c27 18 65 18 92 0" ${line(16)} />
    <path d="M372 270c27 18 65 18 92 0" ${line(16)} />
    <path d="M282 382c40 25 86 25 126 0" ${line(16)} />
    ${brows('soft')}`
}

function expressionHappy(c) {
  return `
    <path d="M170 284c28-42 72-42 100 0" ${line(17)} />
    <path d="M370 284c28-42 72-42 100 0" ${line(17)} />
    <path d="M278 370c50 58 98 58 148 0" fill="none" stroke="#15151a" stroke-width="17" stroke-linecap="round"/>
    ${brows('soft')}`
}

function expressionThinking(c) {
  return `
    <path d="M176 264c22 10 52 10 74 0" ${line(16)} />
    <circle cx="414" cy="266" r="15" fill="${c.eye}" stroke="#15151a" stroke-width="8"/>
    <path d="M296 390c30 15 70 8 102-12" ${line(15)} />
    <path d="M150 226l92-16" ${line(12)} />
    <path d="M366 214l92 28" ${line(12)} />
    <text x="462" y="190" fill="#3158a8" font-size="54" font-family="Segoe UI, sans-serif" font-weight="900">?</text>`
}

function expressionSurprised(c) {
  return `
    <circle cx="222" cy="268" r="27" fill="#fff7ee" stroke="#15151a" stroke-width="14"/>
    <circle cx="418" cy="268" r="27" fill="#fff7ee" stroke="#15151a" stroke-width="14"/>
    <ellipse cx="320" cy="388" rx="34" ry="45" fill="#51202a" stroke="#15151a" stroke-width="12"/>
    <path d="M164 214l86-34" ${line(12)} />
    <path d="M390 180l86 34" ${line(12)} />
    <path d="M126 146l-34-34M514 146l34-34M320 104V54" ${line(10)} />`
}

function expressionSerious(c) {
  return `
    <path d="M168 266c35-13 72-12 108 4" ${line(16)} />
    <path d="M364 270c35-16 73-17 108-4" ${line(16)} />
    <path d="M282 398c42-15 90-15 132 0" ${line(16)} />
    <path d="M152 220l96 30" ${line(13)} />
    <path d="M392 250l96-30" ${line(13)} />`
}

function expressionSmug(c) {
  return `
    <path d="M176 270c32 16 70 12 98-10" ${line(16)} />
    <path d="M368 262c36 14 72 20 106 4" ${line(16)} />
    <path d="M296 380c34 28 84 18 120-18" ${line(16)} />
    <path d="M160 226l92-8" ${line(12)} />
    <path d="M388 218l92 12" ${line(12)} />`
}

function expressionConfused(c) {
  return `
    <path d="M176 266c22 16 54 17 82 3" ${line(16)} />
    <path d="M382 270c22-16 54-17 82-3" ${line(16)} />
    <path d="M286 394c20-16 40 16 60 0s40 16 60 0" ${line(14)} />
    <path d="M154 212c34-18 64-12 92 14" ${line(12)} />
    <path d="M388 226c30-26 62-30 96-10" ${line(12)} />
    <path d="M474 164c28-28 66-14 54 22-7 20-34 24-34 50" fill="none" stroke="#3158a8" stroke-width="12" stroke-linecap="round"/>
    <circle cx="494" cy="264" r="8" fill="#3158a8"/>`
}

function expressionAngry(c) {
  return `
    <path d="M168 274c40-10 75-6 110 12" ${line(17)} />
    <path d="M362 286c38-18 74-22 110-12" ${line(17)} />
    <path d="M286 398l28-20 28 20 28-20 28 20" fill="none" stroke="#15151a" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M150 214l106 42" ${line(14)} />
    <path d="M384 256l106-42" ${line(14)} />
    <path d="M502 178c14-26 42-24 48-4 7 24-20 42-46 28" fill="#ff6b7a" opacity=".9"/>`
}

function expressionFlustered(c) {
  return `
    <path d="M176 270c26 18 62 18 88 0" ${line(16)} />
    <path d="M376 270c26 18 62 18 88 0" ${line(16)} />
    <ellipse cx="320" cy="392" rx="38" ry="24" fill="#51202a" stroke="#15151a" stroke-width="11"/>
    <path d="M160 216l92-20" ${line(12)} />
    <path d="M386 196l92 20" ${line(12)} />
    <path d="M470 210c28 40 20 80-24 112" fill="none" stroke="#35d0ff" stroke-width="11" stroke-linecap="round"/>
    <path d="M486 198c20 26 18 58-8 82" fill="none" stroke="#35d0ff" stroke-width="7" stroke-linecap="round" opacity=".65"/>`
}

function line(width) {
  return `fill="none" stroke="#15151a" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`
}

function brows(kind) {
  if (kind === 'soft') {
    return '<path d="M160 226c32-12 62-13 92-3M388 223c30-10 60-9 92 3" fill="none" stroke="#15151a" stroke-width="9" stroke-linecap="round" opacity=".42"/>'
  }
  return ''
}

function accessorySvg(character) {
  if (character.accessory === 'reimu-ribbon') {
    return `
      <g transform="translate(320 92)">
        <path d="M-34 30c-72-86-174-70-206 6 65 30 140 26 206-6z" fill="${character.accessoryColor}" stroke="${character.accessoryShade}" stroke-width="12" stroke-linejoin="round"/>
        <path d="M34 30c72-86 174-70 206 6-65 30-140 26-206-6z" fill="${character.accessoryColor}" stroke="${character.accessoryShade}" stroke-width="12" stroke-linejoin="round"/>
        <path d="M-200 30c36-16 70-20 102-12M102 18c32-8 66-4 102 12" fill="none" stroke="#fff3f4" stroke-width="12" stroke-linecap="round" opacity=".9"/>
        <g fill="#fff3f4" stroke="${character.accessoryShade}" stroke-width="3" opacity=".94">
          <circle cx="-174" cy="18" r="10"/><circle cx="-140" cy="8" r="9"/><circle cx="-106" cy="8" r="9"/><circle cx="-72" cy="18" r="10"/>
          <circle cx="72" cy="18" r="10"/><circle cx="106" cy="8" r="9"/><circle cx="140" cy="8" r="9"/><circle cx="174" cy="18" r="10"/>
        </g>
        <circle cx="0" cy="34" r="38" fill="#ff6984" stroke="${character.accessoryShade}" stroke-width="12"/>
        <path d="M-22 18c16 14 30 18 44 0" fill="none" stroke="#fff3f4" stroke-width="8" stroke-linecap="round"/>
      </g>`
  }

  if (character.accessory === 'marisa-hat') {
    return `
      <g transform="translate(320 98) rotate(-6)">
        <ellipse cx="0" cy="70" rx="238" ry="48" fill="${character.accessoryColor}" stroke="${character.accessoryShade}" stroke-width="13"/>
        <path d="M-130 58C-104-88 106-88 132 58Z" fill="#282436" stroke="${character.accessoryShade}" stroke-width="13" stroke-linejoin="round"/>
        <path d="M-106 30h212l26 40H-132Z" fill="#fff2b7" stroke="#8c6a24" stroke-width="8" stroke-linejoin="round"/>
        <g transform="translate(70 54) rotate(7)">
          <path d="M-22 10c-62-56-150-34-168 24 66 22 126 12 168-24z" fill="#fffaf0" stroke="#8c6a24" stroke-width="8"/>
          <path d="M22 10c62-56 150-34 168 24-66 22-126 12-168-24z" fill="#fffaf0" stroke="#8c6a24" stroke-width="8"/>
          <circle cx="0" cy="18" r="24" fill="#fff3c4" stroke="#8c6a24" stroke-width="8"/>
          <path d="M-146 18c34-13 68-14 102-2M44 16c34-12 68-11 102 2" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
        </g>
      </g>`
  }

  return `
    <g>
      <path d="M112 282c-48 14-74 52-68 100 7 54 48 84 98 80" fill="none" stroke="#1b2638" stroke-width="25" stroke-linecap="round"/>
      <path d="M528 282c48 14 74 52 68 100-7 54-48 84-98 80" fill="none" stroke="#1b2638" stroke-width="25" stroke-linecap="round"/>
      <rect x="78" y="318" width="68" height="104" rx="24" fill="${character.accessoryColor}" stroke="${character.accessoryShade}" stroke-width="10"/>
      <rect x="494" y="318" width="68" height="104" rx="24" fill="${character.accessoryColor}" stroke="${character.accessoryShade}" stroke-width="10"/>
      <path d="M494 408c-12 96-82 132-176 116" fill="none" stroke="${character.accessoryColor}" stroke-width="10" stroke-linecap="round"/>
    </g>`
}

function hairSvg(character) {
  if (character.accessory === 'marisa-hat') {
    return `
      <path d="M96 310C104 174 194 112 320 112s216 62 224 198c-40-54-92-86-158-98 11 44-2 84-40 122-18-60-54-102-108-126 7 52-18 100-74 142 1-52-22-86-68-104z"
        fill="${character.hair}" stroke="#15151a" stroke-width="12" stroke-linejoin="round"/>
      <path d="M156 224c92-62 198-66 318-8-68-12-136 2-204 44-48 30-82 64-106 102 4-56 0-98-8-138z"
        fill="${character.hairGlow}" opacity=".55"/>
      <path d="M112 368c-38 74-28 138 30 192M526 364c40 78 28 144-34 198" fill="none" stroke="${character.hairShade}" stroke-width="24" stroke-linecap="round" opacity=".95"/>
      <path d="M116 444h54M488 444h54M126 496h44M490 496h42" stroke="#fff0b4" stroke-width="10" stroke-linecap="round" opacity=".72"/>`
  }

  return `
    <path d="M86 300C76 164 176 82 320 82s244 82 234 218c-36-62-96-100-180-126 0 0 24 62 16 102-42-78-100-122-176-142 12 54-16 112-78 162 8-68-20-110-84-132z"
      fill="${character.hair}" stroke="#15151a" stroke-width="12" stroke-linejoin="round"/>
    <path d="M150 196c90-70 202-86 340-10-82-34-172-18-268 42-44 28-70 54-86 82 0-38 4-78 14-114z"
      fill="${character.hairGlow}" opacity=".42"/>
    <path d="M118 322c18 30 42 52 74 66M520 322c-18 30-42 52-74 66" fill="none" stroke="${character.hairShade}" stroke-width="18" stroke-linecap="round" opacity=".76"/>`
}

function faceSvg(character, emotionName, expressionFactory) {
  const cheekOpacity = emotionName === 'serious' ? '.25' : emotionName === 'angry' ? '.38' : '.62'
  const expression = expressionFactory(character)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="${character.label} ${emotionName}">
  <defs>
    <radialGradient id="skin" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#fff8ee"/>
      <stop offset=".74" stop-color="${character.skin}"/>
      <stop offset="1" stop-color="${character.skinEdge}"/>
    </radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".22"/>
    </filter>
  </defs>
  <g filter="url(#softShadow)">
    ${accessorySvg(character)}
    ${hairSvg(character)}
    <ellipse cx="320" cy="342" rx="246" ry="216" fill="url(#skin)" stroke="#15151a" stroke-width="13"/>
    <path d="M132 328c34 16 68 16 102 0M406 328c34 16 68 16 102 0" fill="none" stroke="#d49b80" stroke-width="8" stroke-linecap="round" opacity=".34"/>
    <ellipse cx="204" cy="352" rx="56" ry="25" fill="${character.blush}" opacity="${cheekOpacity}"/>
    <ellipse cx="436" cy="352" rx="56" ry="25" fill="${character.blush}" opacity="${cheekOpacity}"/>
    <g>${expression}</g>
    <path d="M112 454c58 86 140 126 248 116 74-7 132-36 170-88-44 82-114 130-210 134-106 4-180-52-208-162z" fill="${character.accent}" opacity=".27"/>
  </g>
</svg>`
}

function studioGridSvg() {
  return backgroundBase('#0f1726', '#1f2f4d', '#35d0ff', `
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0v80" fill="none" stroke="#7cc8ff" stroke-opacity=".1" stroke-width="2"/>
    </pattern>
    <rect width="1920" height="1080" fill="url(#grid)"/>
    <path d="M0 836c420-106 782-126 1120-58 318 63 536 49 800-48v350H0z" fill="#35d0ff" opacity=".1"/>
    <path d="M132 168h560M132 238h360M132 308h460" stroke="#dff7ff" stroke-width="12" stroke-linecap="round" opacity=".22"/>
  `)
}

function paperLightSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f8fbff"/>
  <path d="M140 180h1640M140 340h1640M140 500h1640M140 660h1640M140 820h1640" stroke="#b7c6d8" stroke-opacity=".32" stroke-width="3"/>
  <path d="M360 80v920M780 80v920M1200 80v920M1620 80v920" stroke="#ffc857" stroke-opacity=".18" stroke-width="4"/>
  <path d="M210 150c90-42 210-38 322 0M1260 780c122 58 246 58 372 0" stroke="#3158a8" stroke-opacity=".12" stroke-width="28" stroke-linecap="round"/>
</svg>`
}

function classroomBoardSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f2eadb"/><stop offset="1" stop-color="#dfd4bf"/></linearGradient>
    <linearGradient id="board" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#1f5b4c"/><stop offset="1" stop-color="#12362f"/></linearGradient>
    <pattern id="chalk" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M0 18h64M18 0v64" stroke="#ffffff" stroke-opacity=".04" stroke-width="2"/></pattern>
  </defs>
  <rect width="1920" height="1080" fill="url(#wall)"/>
  <rect x="120" y="92" width="1680" height="672" rx="18" fill="#6b4d2f"/>
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
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e9f1fb"/><stop offset=".56" stop-color="#cdddf1"/><stop offset="1" stop-color="#aebfd8"/></linearGradient>
    <linearGradient id="desk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e3ef"/></linearGradient>
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
  return backgroundBase('#111b35', '#e0b46a', '#5c83d6', `
    <path d="M0 720h140V520h180v200h170V430h210v290h130V560h190v160h170V390h230v330h150V500h190v220h160v360H0z" fill="#121a27"/>
    <g opacity=".55" fill="#ffe6a3">
      ${windowGrid(0, 470, 1760)}
    </g>
    <path d="M0 792c360-80 610-70 882 8 300 86 632 84 1038-22v302H0z" fill="#09101b" opacity=".68"/>
  `)
}

function historyArchiveSvg() {
  return backgroundBase('#2b231d', '#6f5740', '#d7a45b', `
    <rect x="98" y="92" width="1724" height="612" rx="18" fill="#3b2a1d" opacity=".72"/>
    ${shelves()}
    <rect x="650" y="170" width="620" height="420" rx="10" fill="#efe2c1" stroke="#6f5432" stroke-width="10" opacity=".9"/>
    <path d="M718 250h480M718 330h410M718 410h500" stroke="#8d6d42" stroke-width="14" stroke-linecap="round" opacity=".55"/>
    <path d="M0 704h1920v376H0z" fill="#211810" opacity=".82"/>
  `)
}

function scienceSpaceSvg() {
  return backgroundBase('#071327', '#172b56', '#79d8ff', `
    <circle cx="1460" cy="246" r="138" fill="#79d8ff" opacity=".18"/>
    <circle cx="1460" cy="246" r="88" fill="#ffffff" opacity=".1"/>
    <path d="M260 760C560 492 830 420 1120 544c230 98 388 86 620-42" fill="none" stroke="#79d8ff" stroke-width="8" stroke-opacity=".28"/>
    <g fill="#ffffff" opacity=".8">${stars()}</g>
    <rect x="148" y="122" width="760" height="360" rx="20" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)" stroke-width="4"/>
  `)
}

function techLabSvg() {
  return backgroundBase('#0b1820', '#14324a', '#35d0ff', `
    <pattern id="circuit" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M0 48h36m24 0h36M48 0v36m0 24v36" stroke="#35d0ff" stroke-opacity=".12" stroke-width="3"/><circle cx="48" cy="48" r="7" fill="#35d0ff" fill-opacity=".18"/></pattern>
    <rect width="1920" height="1080" fill="url(#circuit)"/>
    <rect x="130" y="118" width="780" height="430" rx="22" fill="rgba(255,255,255,.08)" stroke="rgba(53,208,255,.28)" stroke-width="4"/>
    <path d="M210 236h420M210 316h520M210 396h340" stroke="#dff7ff" stroke-opacity=".34" stroke-width="14" stroke-linecap="round"/>
    <path d="M1210 180h430v250h-430z" fill="rgba(53,208,255,.08)" stroke="rgba(53,208,255,.24)" stroke-width="5"/>
  `)
}

function mysteryRoomSvg() {
  return backgroundBase('#120f18', '#302344', '#ff6b7a', `
    <rect x="0" y="650" width="1920" height="430" fill="#161018"/>
    <path d="M200 170h520v360H200z" fill="#2f2434" stroke="#7b5a71" stroke-width="8"/>
    <path d="M1190 130h520v420h-520z" fill="#211b29" stroke="#6c526a" stroke-width="8"/>
    <path d="M248 284h410M248 358h320M1244 250h360M1244 332h290M1244 414h390" stroke="#eadce8" stroke-opacity=".26" stroke-width="13" stroke-linecap="round"/>
    <circle cx="960" cy="374" r="170" fill="#ff6b7a" opacity=".08"/>
    <path d="M910 298c70-78 194-38 160 62-22 64-106 66-106 144" fill="none" stroke="#ff6b7a" stroke-opacity=".42" stroke-width="28" stroke-linecap="round"/>
  `)
}

function economyBoardSvg() {
  return backgroundBase('#101a16', '#24382f', '#70e0a0', `
    <rect x="130" y="118" width="1660" height="520" rx="22" fill="#f6fbf4" opacity=".9"/>
    <path d="M240 516L498 372l218 70 300-206 254 142 330-230" fill="none" stroke="#2f8f70" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M246 236h520M246 316h360M1220 246h330M1220 324h420" stroke="#24382f" stroke-opacity=".34" stroke-width="16" stroke-linecap="round"/>
    <path d="M0 704h1920v376H0z" fill="#c8d8c0"/>
  `)
}

function courtroomSvg() {
  return backgroundBase('#1f1a18', '#5c4432', '#ffcc4d', `
    <rect x="110" y="92" width="1700" height="620" rx="20" fill="#5a3825" opacity=".65"/>
    <rect x="220" y="176" width="600" height="250" rx="14" fill="#f7efe2" opacity=".9"/>
    <rect x="1100" y="176" width="600" height="250" rx="14" fill="#f7efe2" opacity=".9"/>
    <path d="M322 280h360M322 350h280M1208 280h360M1208 350h280" stroke="#6a4a32" stroke-width="15" stroke-linecap="round" opacity=".55"/>
    <rect x="0" y="680" width="1920" height="400" fill="#6b4a32"/>
    <path d="M780 628h360v80H780zM720 708h480v100H720z" fill="#3e281c"/>
  `)
}

function effectSpeedLinesSvg() {
  return effectSvg(`
    <g stroke="#ffffff" stroke-linecap="round" opacity=".72">
      ${Array.from({ length: 20 }, (_, i) => {
        const y = 120 + i * 42
        const x = i % 2 === 0 ? 80 : 220
        return `<path d="M${x} ${y}H${900 + i * 30}" stroke-width="${10 + (i % 4) * 3}"/>`
      }).join('')}
    </g>`)
}

function effectImpactBurstSvg() {
  return effectSvg(`
    <g transform="translate(960 520)" fill="#ffcc4d" stroke="#15151a" stroke-width="10" stroke-linejoin="round" opacity=".9">
      <path d="M0-330l54 190 176-92-108 164 204 22-190 62 142 142-176-64-28 204-74-190-140 160 62-204-208 34 172-118-176-102 206 8z"/>
    </g>`)
}

function effectQuestionPopSvg() {
  return effectSvg(`
    <g fill="#35d0ff" stroke="#0d1722" stroke-width="10" opacity=".88">
      <path d="M910 234c96-100 262-44 218 84-28 82-132 86-132 184" fill="none" stroke-linecap="round"/>
      <circle cx="996" cy="592" r="24"/>
      <circle cx="760" cy="330" r="34" fill="#ffcc4d"/>
      <circle cx="1190" cy="520" r="28" fill="#ff6b7a"/>
    </g>`)
}

function effectChapterWipeSvg() {
  return effectSvg(`
    <path d="M0 0h1920v180H0z" fill="#10151b" opacity=".76"/>
    <path d="M0 180h760L640 300H0z" fill="#ffcc4d" opacity=".82"/>
    <path d="M1920 0h-720l120 180h600z" fill="#35d0ff" opacity=".58"/>`)
}

function effectHighlightRingSvg() {
  return effectSvg(`
    <g fill="none" stroke-linecap="round" opacity=".85">
      <ellipse cx="960" cy="520" rx="410" ry="220" stroke="#ffcc4d" stroke-width="24" stroke-dasharray="80 34"/>
      <ellipse cx="960" cy="520" rx="500" ry="280" stroke="#ffffff" stroke-width="10" stroke-opacity=".45"/>
    </g>`)
}

function effectSparkleTrailSvg() {
  return effectSvg(`
    <g fill="#fff6c8" stroke="#15151a" stroke-width="4" opacity=".86">
      ${Array.from({ length: 18 }, (_, i) => {
        const x = 170 + i * 92
        const y = 180 + Math.sin(i) * 150 + (i % 4) * 80
        const r = 18 + (i % 3) * 8
        return `<path d="M${x} ${y - r}l${r * 0.34} ${r * 0.66} ${r * 0.66} ${r * 0.34}-${r * 0.66} ${r * 0.34}-${r * 0.34} ${r * 0.66}-${r * 0.34}-${r * 0.66}-${r * 0.66}-${r * 0.34} ${r * 0.66}-${r * 0.34}z"/>`
      }).join('')}
    </g>`)
}

function effectDangerStripeSvg() {
  return effectSvg(`
    <defs><pattern id="stripe" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="60" height="120" fill="#ffcc4d"/><rect x="60" width="60" height="120" fill="#10151b"/></pattern></defs>
    <rect x="0" y="0" width="1920" height="90" fill="url(#stripe)" opacity=".72"/>
    <rect x="0" y="990" width="1920" height="90" fill="url(#stripe)" opacity=".72"/>`)
}

function effectSourceNoteSvg() {
  return effectSvg(`
    <rect x="138" y="104" width="680" height="170" rx="22" fill="#ffffff" stroke="#10151b" stroke-width="8" opacity=".88"/>
    <path d="M204 178h360M204 224h500" stroke="#3158a8" stroke-width="16" stroke-linecap="round" opacity=".72"/>
    <circle cx="730" cy="188" r="42" fill="#70e0a0" stroke="#10151b" stroke-width="8"/>
    <path d="M710 188l18 18 34-44" fill="none" stroke="#10151b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`)
}

function effectSvg(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="none"/>
  ${content}
</svg>`
}

function backgroundBase(from, to, accent, content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="1640" cy="170" r="220" fill="${accent}" opacity=".12"/>
  <circle cx="260" cy="820" r="280" fill="${accent}" opacity=".08"/>
  ${content}
</svg>`
}

function shelves() {
  return Array.from({ length: 4 }, (_, row) => {
    const y = 146 + row * 124
    return `<rect x="162" y="${y}" width="440" height="82" rx="8" fill="#8a623c" opacity=".72"/><path d="M190 ${y + 16}h40v50h-40zM248 ${y + 12}h54v54h-54zM320 ${y + 20}h38v46h-38zM382 ${y + 10}h62v56h-62zM466 ${y + 16}h70v50h-70z" fill="#d9b26c" opacity=".7"/>`
  }).join('')
}

function stars() {
  return Array.from({ length: 80 }, (_, i) => {
    const x = (i * 331) % 1840 + 40
    const y = (i * 197) % 700 + 40
    const r = (i % 3) + 2
    return `<circle cx="${x}" cy="${y}" r="${r}"/>`
  }).join('')
}

function windowGrid(xOffset, yBase, width) {
  return Array.from({ length: 60 }, (_, i) => {
    const x = xOffset + ((i * 57) % width)
    const y = yBase + ((i * 83) % 420)
    return `<rect x="${x}" y="${y}" width="13" height="20" rx="2"/>`
  }).join('')
}

function cleanSvg(svg) {
  return svg
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

await mkdir(outDir, { recursive: true })
await mkdir(bgDir, { recursive: true })
await mkdir(effectDir, { recursive: true })

for (const [characterName, character] of Object.entries(characters)) {
  for (const [emotionName, expressionFactory] of Object.entries(expressions)) {
    const filePath = path.join(outDir, `${characterName}-${emotionName}.svg`)
    await writeFile(filePath, cleanSvg(faceSvg(character, emotionName, expressionFactory)), 'utf8')
  }
}

const backgrounds = {
  'studio-grid': studioGridSvg,
  'paper-light': paperLightSvg,
  'classroom-board': classroomBoardSvg,
  'news-desk': newsDeskSvg,
  'tatami-room': tatamiRoomSvg,
  'night-city': nightCitySvg,
  'history-archive': historyArchiveSvg,
  'science-space': scienceSpaceSvg,
  'tech-lab': techLabSvg,
  'mystery-room': mysteryRoomSvg,
  'economy-board': economyBoardSvg,
  courtroom: courtroomSvg,
}

for (const [name, factory] of Object.entries(backgrounds)) {
  await writeFile(path.join(bgDir, `${name}.svg`), cleanSvg(factory()), 'utf8')
}

const effects = {
  'speed-lines': effectSpeedLinesSvg,
  'impact-burst': effectImpactBurstSvg,
  'question-pop': effectQuestionPopSvg,
  'chapter-wipe': effectChapterWipeSvg,
  'highlight-ring': effectHighlightRingSvg,
  'sparkle-trail': effectSparkleTrailSvg,
  'danger-stripe': effectDangerStripeSvg,
  'source-note': effectSourceNoteSvg,
}

for (const [name, factory] of Object.entries(effects)) {
  await writeFile(path.join(effectDir, `${name}.svg`), cleanSvg(factory()), 'utf8')
}

console.log(
  `Generated ${Object.keys(characters).length * Object.keys(expressions).length} character assets, ${Object.keys(backgrounds).length} backgrounds, ${Object.keys(effects).length} effects.`,
)
