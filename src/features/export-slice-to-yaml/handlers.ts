import yaml from 'js-yaml'
import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { deserializeFields } from '../update-custom-fields/field-utils'

interface SliceNode {
  type: string
  name: string
  children?: SliceNode[]
  text?: { characters: string }
  getPluginData(key: string): string
}

function formatFieldsAsBlockString(customFields: string): string {
  const fields = deserializeFields(customFields)
  if (fields.length === 0) {
    return ''
  }
  return fields.map(f => `${f.name}: ${f.type}`).join('\n') + '\n'
}

function getNodeText(node: SliceNode): string {
  return node.text?.characters || node.name
}

interface ExportElement {
  name: string
  fields?: string
  notes?: string
}

interface ExportEvent extends ExportElement {
  external?: boolean
}

interface ExportGwtItem {
  name: string
  type: 'command' | 'event' | 'query' | 'error'
  fields?: string
}

interface ExportGwt {
  name: string
  description?: string
  given: ExportGwtItem[]
  when: ExportGwtItem[]
  then: ExportGwtItem[]
}

interface ExportData {
  slice: string
  commands?: ExportElement[]
  events?: ExportEvent[]
  queries?: ExportElement[]
  gwt?: ExportGwt[]
}

function formatGwtSection(node: SliceNode): ExportGwt {
  const sections = node.children ?? []
  const given: ExportGwtItem[] = []
  const when: ExportGwtItem[] = []
  const then: ExportGwtItem[] = []
  let description: string | undefined

  for (const section of sections) {
    const sectionName = section.name
    if (sectionName === 'Given') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as ExportGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          given.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
          })
        }
      }
    } else if (sectionName === 'When') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as ExportGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          when.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
          })
        }
      }
    } else if (sectionName === 'Then') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as ExportGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          then.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
          })
        }
      }
    } else {
      const text = getNodeText(section)
      if (text && !description) {
        description = text
      }
    }
  }

  return {
    name: node.name,
    description,
    given,
    when,
    then,
  }
}

export async function handleExportSliceToYaml(
  payload: { id?: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  let slice: SliceNode | null = null

  if (payload?.id) {
    slice = (await figma.getNodeByIdAsync(payload.id)) as unknown as SliceNode | null
  }

  if (!slice) {
    const selection = figma.currentPage.selection
    if (!selection.length) return
    slice = selection[0] as unknown as SliceNode
  }

  const data: ExportData = {
    slice: slice.name,
  }

  const commands: ExportElement[] = []
  const events: ExportEvent[] = []
  const queries: ExportElement[] = []
  const gwtSections: ExportGwt[] = []

  for (const child of (slice.children ?? []) as SliceNode[]) {
    const pluginType = child.getPluginData('type')
    if (pluginType === 'command') {
      const customFields = child.getPluginData('customFields')
      const notes = child.getPluginData('notes')
      commands.push({
        name: child.getPluginData('label') || child.name,
        fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
        notes: notes || undefined,
      })
    } else if (pluginType === 'event') {
      const customFields = child.getPluginData('customFields')
      const notes = child.getPluginData('notes')
      const external = child.getPluginData('external') === 'true'
      events.push({
        name: child.getPluginData('label') || child.name,
        ...(external ? { external: true } : {}),
        fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
        notes: notes || undefined,
      })
    } else if (pluginType === 'query') {
      const customFields = child.getPluginData('customFields')
      const notes = child.getPluginData('notes')
      queries.push({
        name: child.getPluginData('label') || child.name,
        fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
        notes: notes || undefined,
      })
    } else if (pluginType === 'gwt') {
      gwtSections.push(formatGwtSection(child))
    }
  }

  if (commands.length > 0) {
    data.commands = commands
  }
  if (events.length > 0) {
    data.events = events
  }
  if (queries.length > 0) {
    data.queries = queries
  }
  if (gwtSections.length > 0) {
    data.gwt = gwtSections
  }

  const yamlStr = yaml.dump(data, { skipInvalid: true, lineWidth: -1 })

  figma.ui.postMessage({
    type: 'export-slice-to-yaml-result',
    payload: { yaml: yamlStr },
  })
}
