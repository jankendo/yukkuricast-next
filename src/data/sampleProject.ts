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
      palette: 'paper-light',
      subtitleStyle: 'pop',
      bgm: 'none',
    },
    export: {
      gpuAcceleration: 'auto',
      videoBitrate: '8M',
      audioBitrate: '192k',
      audioSampleRate: 48000,
    },
    readingDictionary: [
      { surface: '台本', reading: 'だいほん', source: 'project' },
      { surface: '書き出し', reading: 'かきだし', source: 'project' },
    ],
  },
  characters: [
    {
      id: 'reimu',
      name: '霊夢',
      asset: 'reimu',
      defaultEmotion: 'happy',
      side: 'left',
      voice: {
        engine: 'aquestalk-player',
        aquestalkPreset: 'れいむ',
        rate: 0,
        volume: 100,
      },
    },
    {
      id: 'marisa',
      name: '魔理沙',
      asset: 'marisa',
      defaultEmotion: 'thinking',
      side: 'right',
      voice: {
        engine: 'aquestalk-player',
        aquestalkPreset: 'まりさ',
        rate: 0,
        volume: 100,
      },
    },
  ],
  scenes: [
    {
      id: 'scene-01',
      title: '導入',
      summary: 'JSON 台本から動画を作れることを提示する。',
      background: {
        type: 'asset',
        asset: 'classroom-board',
        label: '黒板教室',
        accent: '#2f8f70',
      },
      shots: [
        {
          id: 'shot-01',
          speakerId: 'reimu',
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
          assets: [
            {
              id: 'img-json-structure',
              type: 'placeholder',
              track: 'video',
              label: '差し替え画像: JSON 台本の構造図',
              start: 0.4,
              duration: 4.2,
              placeholder: true,
              position: 'main-left',
              notes: 'あとで図解PNGに差し替える',
            },
          ],
        },
        {
          id: 'shot-02',
          speakerId: 'marisa',
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
          assets: [
            {
              id: 'img-editor-notes',
              type: 'placeholder',
              track: 'video',
              label: '差し替え画像: 編集メモ',
              start: 0.6,
              duration: 4,
              placeholder: true,
              position: 'top-left',
              notes: '人間が直す前提の資料',
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
        type: 'asset',
        asset: 'news-desk',
        label: 'ニュース机',
        accent: '#3158a8',
      },
      shots: [
        {
          id: 'shot-03',
          speakerId: 'reimu',
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
          assets: [
            {
              id: 'img-pipeline',
              type: 'placeholder',
              track: 'video',
              label: '差し替え画像: 生成パイプライン',
              start: 0.4,
              duration: 4.4,
              placeholder: true,
              position: 'main-left',
              notes: '処理フロー図を配置',
            },
          ],
        },
        {
          id: 'shot-04',
          speakerId: 'marisa',
          text: 'Windows では AquesTalkPlayer を標準にして、最後に FFmpeg で音声付き MP4 として書き出す構成にしているぜ。',
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
          assets: [
            {
              id: 'effect-gpu-export',
              type: 'effect',
              track: 'effect',
              label: 'GPU encoder auto',
              start: 0.8,
              duration: 3.6,
              notes: 'NVENC/QSV/AMF を自動検出',
            },
          ],
        },
      ],
    },
  ],
}

export const sampleProjectJson = JSON.stringify(sampleProject, null, 2)
