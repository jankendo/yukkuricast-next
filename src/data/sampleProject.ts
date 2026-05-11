import type { YukkuriProject } from '../types/script'

export const sampleProject: YukkuriProject = {
  format: 'yukkuricast-script',
  version: '1.0',
  project: {
    title: '生成AIは動画制作をどう変えるか',
    description: 'LLM が出した JSON 台本をそのまま読み込み、解説動画へ変換するデモ。',
    fps: 30,
    resolution: {
      width: 1920,
      height: 1080,
    },
    theme: {
      palette: 'studio-dark',
      subtitleStyle: 'pop',
      bgm: 'none',
    },
  },
  characters: [
    {
      id: 'akari',
      name: 'あかり',
      asset: 'akari',
      defaultEmotion: 'happy',
      side: 'left',
      voice: {
        engine: 'windows-sapi',
        rate: 1,
        volume: 95,
      },
    },
    {
      id: 'kohaku',
      name: 'こはく',
      asset: 'kohaku',
      defaultEmotion: 'thinking',
      side: 'right',
      voice: {
        engine: 'windows-sapi',
        rate: 0,
        volume: 92,
      },
    },
  ],
  scenes: [
    {
      id: 'scene-01',
      title: '導入',
      summary: 'JSON 台本から動画を作れることを提示する。',
      background: {
        type: 'grid',
        from: '#101827',
        to: '#1f2a44',
        accent: '#35d0ff',
      },
      shots: [
        {
          id: 'shot-01',
          speakerId: 'akari',
          text: '今回は、LLM が作った JSON 台本をそのまま読み込んで、ゆっくり解説動画にする流れを見ていくよ。',
          duration: 5.2,
          emotion: 'happy',
          layout: 'duo',
          caption: {
            emphasis: ['JSON 台本', 'ゆっくり解説動画'],
          },
          visuals: [
            {
              type: 'keyword',
              title: 'LLM JSON',
              body: '台詞・表情・尺・背景・補足ビジュアルを構造化',
            },
          ],
        },
        {
          id: 'shot-02',
          speakerId: 'kohaku',
          text: 'ポイントは、動画編集の判断を JSON に閉じ込めること。あとから人間が直しやすいのも大事だね。',
          duration: 5.8,
          emotion: 'thinking',
          layout: 'right-focus',
          caption: {
            emphasis: ['人間が直しやすい'],
          },
          visuals: [
            {
              type: 'bullet',
              title: 'JSON に入れる情報',
              items: ['話者', '台詞', '表情', '秒数', '画面メモ'],
            },
          ],
        },
      ],
    },
    {
      id: 'scene-02',
      title: '生成フロー',
      summary: '読み込みから書き出しまでの処理を説明する。',
      background: {
        type: 'gradient',
        from: '#15202b',
        to: '#293247',
        accent: '#ffbe45',
      },
      shots: [
        {
          id: 'shot-03',
          speakerId: 'akari',
          text: 'アプリは JSON を検証して、タイムライン、字幕、音声、画像フレームを一気につなげるよ。',
          duration: 5.4,
          emotion: 'surprised',
          layout: 'left-focus',
          caption: {
            emphasis: ['検証', 'タイムライン', '字幕', '音声'],
          },
          visuals: [
            {
              type: 'chart',
              title: '変換パイプライン',
              items: ['JSON', 'Preview', 'Voice', 'Frames', 'MP4'],
            },
          ],
        },
        {
          id: 'shot-04',
          speakerId: 'kohaku',
          text: 'Windows では標準の音声合成を使って、最後に FFmpeg で MP4 として書き出す構成にしているよ。',
          duration: 5.6,
          emotion: 'happy',
          layout: 'duo',
          caption: {
            emphasis: ['Windows', 'FFmpeg', 'MP4'],
          },
          visuals: [
            {
              type: 'code',
              title: 'Export',
              body: 'script.json -> audio.wav + frame.png -> output.mp4',
            },
          ],
        },
      ],
    },
  ],
}

export const sampleProjectJson = JSON.stringify(sampleProject, null, 2)
