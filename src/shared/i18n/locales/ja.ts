const ja = {
  panel: {
    title: 'イベントモデリング',
    description: 'FigJamでイベントモデリング図を作成します。',
  },
  sections: {
    coreShapes: '基本シェイプ',
    structural: '構造',
    sections: 'セクション',
    image: '画像',
    other: 'その他',
    import: 'インポート',
  },
  buttons: {
    importYaml: 'YAML インポート',
    import: 'インポート',
    cancel: 'キャンセル',
    duplicate: '複製',
    exportToMarkdown: 'Markdownにエクスポート',
    exportToYaml: 'YAMLにエクスポート',
    copyToYaml: 'YAMLにコピー',
    connect: '接続',
    markAsScreen: 'スクリーンとしてマーク',
    revertScreen: '画像に戻す',
    addActor: '+ アクターを追加',
    deleteActor: 'アクターを削除',
  },
  editor: {
    selectedElement: '選択中の要素',
    name: '名前',
    customFields: 'カスタムフィールド',
    notes: 'メモ',
    external: '外部',
    issueUrl: 'Issue URL',
    openInBrowser: 'ブラウザで開く',
    elementType: '要素タイプ',
    actors: 'アクター',
    actorName: 'アクター名',
    actorNamePlaceholder: 'アクター名',
  },
  messages: {
    multipleSelected: '複数の要素が選択されています',
    copiedToClipboard: 'クリップボードにコピーしました！',
    failedToCopy: 'クリップボードへのコピーに失敗しました',
    figjamOnly: 'このプラグインはFigJamでのみ動作します。FigJamファイルを開いてご利用ください。',
    markedAsScreen: 'スクリーンとしてマークしました',
    revertedScreen: '画像に戻しました',
  },
  placeholders: {
    pasteYaml: 'YAMLをここに貼り付け...',
  },
  links: {
    learnAboutEventModeling: 'イベントモデリングについて学ぶ',
  },
  settings: {
    title: '設定',
    language: '言語',
    back: '戻る',
  },
} as const

export default ja
