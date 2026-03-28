const ja = {
  panel: {
    title: 'イベントモデリング',
    description: 'FigJamでイベントモデリング図を作成します。',
  },
  sections: {
    coreShapes: '基本シェイプ',
    structural: '構造',
    sections: 'セクション',
    import: 'インポート',
  },
  buttons: {
    importYaml: 'YAML インポート',
    import: 'インポート',
    cancel: 'キャンセル',
    duplicate: '複製',
    exportToMarkdown: 'Markdownにエクスポート',
    exportToYaml: 'YAMLにエクスポート',
    connect: '接続',
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
  },
  messages: {
    multipleSelected: '複数の要素が選択されています',
    copiedToClipboard: 'クリップボードにコピーしました！',
    failedToCopy: 'クリップボードへのコピーに失敗しました',
    figjamOnly: 'このプラグインはFigJamでのみ動作します。FigJamファイルを開いてご利用ください。',
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
