import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const ELEMENT_TYPES = ['command', 'event', 'query'] as const
const SECTION_HEADINGS: Record<string, string> = {
  command: '## Commands',
  event: '## Events',
  query: '## Queries',
}

interface SliceNode {
  type: string
  name: string
  children?: SliceNode[]
  getPluginData(key: string): string
}

function formatElement(node: SliceNode): string {
  const label = node.getPluginData('label') || node.name
  let result = `- ${label}\n`

  const customFields = node.getPluginData('customFields')
  if (customFields) {
    for (const line of customFields.split('\n')) {
      if (line.trim()) {
        result += `  - ${line.trim()}\n`
      }
    }
  }

  const notes = node.getPluginData('notes')
  if (notes) {
    result += `  - Notes: ${notes}\n`
  }

  return result
}

function formatNodeTypeName(figmaType: string): string {
  return figmaType.charAt(0).toUpperCase() + figmaType.slice(1).toLowerCase()
}

function formatGwtSection(node: SliceNode): string {
  let result = `## GWT: ${node.name}\n`

  const sections = node.children ?? []
  for (const section of sections) {
    const sectionName = section.name
    if (['Given', 'When', 'Then'].includes(sectionName)) {
      result += `### ${sectionName}\n`
      for (const child of section.children ?? []) {
        result += formatElement(child)
      }
    }
  }

  return result
}

export async function handleExportSliceToMarkdown(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const selection = figma.currentPage.selection
  if (!selection.length) return

  const slice = selection[0] as unknown as SliceNode

  let markdown = `# ${slice.name}\n`

  const grouped: Record<string, SliceNode[]> = {
    command: [],
    event: [],
    query: [],
  }
  const gwtSections: SliceNode[] = []
  const otherNodes: SliceNode[] = []

  for (const child of (slice.children ?? []) as SliceNode[]) {
    const pluginType = child.getPluginData('type')
    if (ELEMENT_TYPES.includes(pluginType as (typeof ELEMENT_TYPES)[number])) {
      grouped[pluginType].push(child)
    } else if (pluginType === 'gwt') {
      gwtSections.push(child)
    } else {
      otherNodes.push(child)
    }
  }

  for (const type of ELEMENT_TYPES) {
    if (grouped[type].length > 0) {
      markdown += `\n${SECTION_HEADINGS[type]}\n`
      for (const node of grouped[type]) {
        markdown += formatElement(node)
      }
    }
  }

  for (const gwt of gwtSections) {
    markdown += `\n${formatGwtSection(gwt)}`
  }

  if (otherNodes.length > 0) {
    markdown += '\n## Other\n'
    for (const node of otherNodes) {
      markdown += `- ${formatNodeTypeName(node.type)}\n`
    }
  }

  figma.ui.postMessage({
    type: 'export-slice-to-markdown-result',
    payload: { markdown },
  })
}
