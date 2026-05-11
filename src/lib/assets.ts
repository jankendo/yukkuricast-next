import type { CharacterProfile, Emotion } from '../types/script'

export function characterAssetUrl(asset: string, emotion: Emotion = 'neutral') {
  return `/assets/characters/${asset}-${emotion}.svg`
}

export function characterImageSource(character: CharacterProfile, emotion: Emotion = 'neutral') {
  if (character.asset === 'custom' && character.customAsset) {
    return character.customAsset.previewUrl ?? `yukkuri-asset://custom/${character.customAsset.id}`
  }

  return characterAssetUrl(character.asset, emotion)
}

export function backgroundAssetUrl(name: 'studio-grid' | 'paper-light') {
  return `/assets/backgrounds/${name}.svg`
}
