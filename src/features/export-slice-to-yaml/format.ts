import yaml from 'js-yaml'
import { deserializeFields } from '../update-custom-fields/field-utils'

export interface SliceNode {
  id?: string
  type: string
  name: string
  children?: SliceNode[]
  text?: { characters: string }
  getPluginData(key: string): string
}

interface ConnectorEndpoint {
  endpointNodeId?: string
}

interface ConnectorNode {
  type: string
  connectorStart?: ConnectorEndpoint
  connectorEnd?: ConnectorEndpoint
}

export interface FormatYamlContext {
  currentPage: {
    findAll: (predicate: (node: { type: string }) => boolean) => unknown[]
  }
}

export interface FormatYamlResult {
  yaml: string
  orphanEvents: string[]
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

interface ExportCommand extends ExportElement {
  produces?: string[]
}

interface ExportQuery extends ExportElement {
  from_events?: string[]
}

interface ExportScreen {
  type: 'user' | 'system'
  name?: string
  reads?: string[]
  executes?: string[]
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
  screen: ExportScreen
  commands?: ExportCommand[]
  queries?: ExportQuery[]
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
    then, // eslint-disable-line eslint-plugin-unicorn/no-thenable
  }
}

interface ElementInfo {
  id: string
  name: string
  pluginType: 'command' | 'event' | 'query' | 'screen' | 'processor'
}

export function formatSliceAsYaml(
  slice: SliceNode,
  figma: FormatYamlContext
): FormatYamlResult {
  const commands: ExportCommand[] = []
  const queries: ExportQuery[] = []
  const gwtSections: ExportGwt[] = []

  const elementsById = new Map<string, ElementInfo>()
  const eventNamesById = new Map<string, string>()
  const commandIndexById = new Map<string, number>()
  const queryIndexById = new Map<string, number>()
  let screenInfo:
    | { id: string; name: string; type: 'user' | 'system' }
    | undefined

  for (const child of (slice.children ?? []) as SliceNode[]) {
    const pluginType = child.getPluginData('type')
    const id = child.id ?? ''

    if (pluginType === 'command') {
      const label = child.getPluginData('label') || child.name
      const customFields = child.getPluginData('customFields')
      const notes = child.getPluginData('notes')
      commandIndexById.set(id, commands.length)
      commands.push({
        name: label,
        fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
        notes: notes || undefined,
      })
      elementsById.set(id, { id, name: label, pluginType: 'command' })
    } else if (pluginType === 'event') {
      const label = child.getPluginData('label') || child.name
      eventNamesById.set(id, label)
      elementsById.set(id, { id, name: label, pluginType: 'event' })
    } else if (pluginType === 'query') {
      const label = child.getPluginData('label') || child.name
      const customFields = child.getPluginData('customFields')
      const notes = child.getPluginData('notes')
      queryIndexById.set(id, queries.length)
      queries.push({
        name: label,
        fields: customFields ? formatFieldsAsBlockString(customFields) : undefined,
        notes: notes || undefined,
      })
      elementsById.set(id, { id, name: label, pluginType: 'query' })
    } else if (pluginType === 'screen' || pluginType === 'processor') {
      const label = child.getPluginData('label') || child.name
      if (!screenInfo) {
        screenInfo = {
          id,
          name: label,
          type: pluginType === 'processor' ? 'system' : 'user',
        }
      }
      elementsById.set(id, { id, name: label, pluginType })
    } else if (pluginType === 'gwt') {
      gwtSections.push(formatGwtSection(child))
    }
  }

  const commandProducesById = new Map<string, string[]>()
  const queryFromEventsById = new Map<string, string[]>()
  const screenReads: string[] = []
  const screenExecutes: string[] = []

  const allConnectors = figma.currentPage.findAll(
    (n) => n.type === 'CONNECTOR'
  ) as ConnectorNode[]

  for (const conn of allConnectors) {
    const startId = conn.connectorStart?.endpointNodeId
    const endId = conn.connectorEnd?.endpointNodeId
    if (!startId || !endId) continue
    const start = elementsById.get(startId)
    const end = elementsById.get(endId)
    if (!start || !end) continue

    if (start.pluginType === 'command' && end.pluginType === 'event') {
      const arr = commandProducesById.get(start.id) ?? []
      arr.push(end.name)
      commandProducesById.set(start.id, arr)
    } else if (start.pluginType === 'event' && end.pluginType === 'query') {
      const arr = queryFromEventsById.get(end.id) ?? []
      arr.push(start.name)
      queryFromEventsById.set(end.id, arr)
    } else if (
      (start.pluginType === 'screen' || start.pluginType === 'processor') &&
      end.pluginType === 'command' &&
      screenInfo &&
      start.id === screenInfo.id
    ) {
      screenExecutes.push(end.name)
    } else if (
      start.pluginType === 'query' &&
      (end.pluginType === 'screen' || end.pluginType === 'processor') &&
      screenInfo &&
      end.id === screenInfo.id
    ) {
      screenReads.push(start.name)
    }
  }

  for (const [cmdId, eventNames] of commandProducesById) {
    const idx = commandIndexById.get(cmdId)
    if (idx === undefined) continue
    const sorted = [...eventNames].sort((a, b) => a.localeCompare(b))
    commands[idx].produces = sorted
  }

  for (const [qryId, eventNames] of queryFromEventsById) {
    const idx = queryIndexById.get(qryId)
    if (idx === undefined) continue
    const sorted = [...eventNames].sort((a, b) => a.localeCompare(b))
    queries[idx].from_events = sorted
  }

  const producedEventIds = new Set<string>()
  for (const conn of allConnectors) {
    const startId = conn.connectorStart?.endpointNodeId
    const endId = conn.connectorEnd?.endpointNodeId
    if (!startId || !endId) continue
    const start = elementsById.get(startId)
    const end = elementsById.get(endId)
    if (start?.pluginType === 'command' && end?.pluginType === 'event') {
      producedEventIds.add(endId)
    }
  }
  const orphanEvents: string[] = []
  for (const [id, name] of eventNamesById) {
    if (!producedEventIds.has(id)) {
      orphanEvents.push(name)
    }
  }

  const screen: ExportScreen = screenInfo
    ? {
        type: screenInfo.type,
        ...(screenInfo.name ? { name: screenInfo.name } : {}),
        ...(screenReads.length > 0
          ? { reads: [...screenReads].sort((a, b) => a.localeCompare(b)) }
          : {}),
        ...(screenExecutes.length > 0
          ? { executes: [...screenExecutes].sort((a, b) => a.localeCompare(b)) }
          : {}),
      }
    : { type: 'user' }

  const data: ExportData = {
    slice: slice.name,
    screen,
  }

  if (commands.length > 0) {
    data.commands = commands
  }
  if (queries.length > 0) {
    data.queries = queries
  }
  if (gwtSections.length > 0) {
    data.gwt = gwtSections
  }

  const yamlStr = yaml.dump(data, { skipInvalid: true, lineWidth: -1 })
  return { yaml: yamlStr, orphanEvents }
}
