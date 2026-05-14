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
    growth: {
      targetViewer: 'AI動画制作に興味はあるが、従来の編集作業で止まっている個人クリエイター',
      viewerPromise: 'LLMのJSON台本を、音声・テロップ・図解・MP4出力までつながる編集素材に変える流れがわかる',
      coreQuestion: 'なぜAI時代の動画制作は、ただ文章を書く作業ではなくJSONで設計する作業になるのか？',
      titleCandidates: [
        'なぜAI動画制作はJSON設計で一気に変わるのか？',
        'ゆっくり解説動画をAIで作る本当の近道',
        '生成AIで動画編集はどこまで自動化できるのか？',
      ],
      thumbnailTexts: ['編集が変わる', 'JSONで動画化', 'AI制作の核心'],
      openingHook: 'AI動画は、もう一部のクリエイターだけの道具じゃないのを知ってる？',
      retentionGoal: '冒頭30秒で価値を提示し、各ショットで画面変化と問いを維持する',
      shortsHook: 'AIが書いたJSONだけで、ゆっくり解説動画はどこまで作れるのか？',
      nextVideoIdea: '次回は、伸びるゆっくり解説の台本構成をテンプレ化する',
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
          text: 'AI動画は、もう一部のクリエイターだけの道具じゃないのを知ってる？',
          duration: 5.2,
          emotion: 'happy',
          layout: 'duo',
          caption: {
            text: 'AI動画は、もう一部のクリエイターだけの道具じゃないのを知ってる？',
            emphasis: ['AI動画', '道具'],
          },
          retention: {
            beat: 'hook',
            chapterLabel: '0:00 Hook',
            viewerQuestion: 'AIだけで本当に動画になるの？',
            visualChange: '黒板にJSON構造図のプレースホルダーを出す',
            nextCuriosity: 'ただ文章を書くだけでは足りない理由を次で見せる',
          },
          visuals: [
            {
              type: 'question',
              title: 'AI動画の核心',
              body: '台詞だけでなく、画面と尺まで設計する',
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
            text: 'ポイントは、動画編集の判断を JSON に閉じ込めること。あとから人間が直しやすいのも大事だね。',
            emphasis: ['人間が直しやすい'],
          },
          retention: {
            beat: 'viewer-benefit',
            chapterLabel: '見るメリット',
            viewerQuestion: 'どこをAIに任せて、どこを人間が直すの？',
            visualChange: '編集メモの差し替え枠を出し、判断を素材化する',
            nextCuriosity: 'JSONに入れる情報を分けると一気に扱いやすくなる',
          },
          visuals: [
            {
              type: 'comparison',
              title: 'JSON に入れる情報',
              items: ['読み上げ: 台詞', '画面: 図解と配置', '編集: 秒数と効果'],
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
            text: 'アプリは JSON を検証して、タイムライン、字幕、音声、画像フレームを一気につなげるよ。',
            emphasis: ['検証', 'タイムライン', '字幕', '音声'],
          },
          retention: {
            beat: 'early-payoff',
            chapterLabel: '最初の答え',
            viewerQuestion: 'JSONを読み込んだ後、実際には何が起きるの？',
            visualChange: '生成パイプライン図に切り替える',
            sourceNote: '仕様メモ: YukkuriCast Script JSON 1.0',
            nextCuriosity: '音声つきMP4まで出せるかが次のポイント',
          },
          visuals: [
            {
              type: 'timeline',
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
            text: 'Windows では AquesTalkPlayer を標準にして、最後に FFmpeg で音声付き MP4 として書き出す構成にしているぜ。',
            emphasis: ['Windows', 'FFmpeg', 'MP4'],
          },
          retention: {
            beat: 'next-video',
            chapterLabel: '次への導線',
            viewerQuestion: '次はどんな台本なら再生維持が伸びる？',
            visualChange: 'GPU書き出しの効果レーンを表示する',
            sourceNote: '出力メモ: 1920x1080 / H.264 / AAC / 48kHz',
            nextCuriosity: '次回は伸びる台本テンプレートをそのままJSON化する',
          },
          visuals: [
            {
              type: 'source',
              title: 'Export Spec',
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
