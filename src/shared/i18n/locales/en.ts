const en = {
  panel: {
    title: 'Event Modeling',
    description: 'Create Event Modeling diagrams in FigJam.',
  },
  sections: {
    coreShapes: 'Core Shapes',
    structural: 'Structural',
    sections: 'Sections',
    import: 'Import',
  },
  buttons: {
    importYaml: 'Import YAML',
    import: 'Import',
    cancel: 'Cancel',
    duplicate: 'Duplicate',
    exportToMarkdown: 'Export to Markdown',
    syncDrift: 'Sync',
  },
  editor: {
    selectedElement: 'Selected Element',
    name: 'Name',
    customFields: 'Custom Fields',
    notes: 'Notes',
    external: 'External',
    showFields: 'Show Fields',
    issueUrl: 'Issue URL',
    openInBrowser: 'Open in browser',
    elementType: 'Element type',
  },
  messages: {
    multipleSelected: 'Multiple elements selected',
    copiedToClipboard: 'Copied to clipboard!',
    failedToCopy: 'Failed to copy to clipboard',
    figjamOnly: 'This plugin only works in FigJam. Please open a FigJam file to use this plugin.',
  },
  placeholders: {
    pasteYaml: 'Paste YAML here...',
  },
  links: {
    learnAboutEventModeling: 'Learn about Event Modeling',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    back: 'Back',
  },
} as const

export default en
