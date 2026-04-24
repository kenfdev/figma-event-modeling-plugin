import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { parseImportYaml, type ImportData } from './parser'
import { serializeFields, type CustomField } from '../update-custom-fields/field-utils'
import { normalizeName } from './name-match'
import { createConnector } from '../../shared/figma/connectors'

function convertBlockStringToYaml(blockString: string): string {
  if (!blockString || !blockString.trim()) {
    return ''
  }
  const fields: CustomField[] = []
  const lines = blockString.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    const name = trimmed.slice(0, colonIndex).trim()
    const type = trimmed.slice(colonIndex + 1).trim()
    if (name && type) {
      fields.push({ name, type })
    }
  }
  return serializeFields(fields)
}

const ELEMENT_WIDTH = 176
const ELEMENT_HEIGHT = 80
const TEXT_COLOR = { r: 1, g: 1, b: 1 }

const COMMAND_FILL = { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 }
const COMMAND_STROKE = { r: 0, g: 0x7a / 255, b: 0xd2 / 255 }

const EVENT_INTERNAL_FILL = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const EVENT_INTERNAL_STROKE = { r: 0xeb / 255, g: 0x75 / 255, b: 0 }

const QUERY_FILL = { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 }
const QUERY_STROKE = { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 }

const ERROR_FILL = { r: 0xff / 255, g: 0x44 / 255, b: 0x44 / 255 }
const ERROR_STROKE = { r: 0xcc / 255, g: 0, b: 0 }

const SCREEN_FILL = { r: 0.9, g: 0.9, b: 0.9 }
const SCREEN_TEXT_COLOR = { r: 0.4, g: 0.4, b: 0.4 }
const SCREEN_WIDTH = 200
const SCREEN_HEIGHT = 160

const GWT_PARENT_WIDTH = 400
const GWT_PARENT_HEIGHT = 600
const GWT_CHILD_WIDTH = 350
const GWT_CHILD_HEIGHT = 180
const GWT_CHILD_GAP = 15
const GWT_CHILD_NAMES = ['Given', 'When', 'Then'] as const

const ELEMENT_GAP = 20
const GROUP_GAP = 60
const ROW_GAP = 240
const RESERVED_TOP_SPACE = 400
const SLICE_WIDTH = 400
const SLICE_HEIGHT = 120
const COLUMN_GAP = 40
const GWT_VERTICAL_OFFSET = 80
const GWT_CHILD_SHAPE_PADDING = 40
const GWT_DESCRIPTION_WIDTH = 200
const GWT_DESCRIPTION_GAP = 20
const SLICE_PADDING = 20

export interface CandidateEvent {
  nodeId: string
  label: string
  parentSliceName: string | null
}

export interface PendingResolution {
  queryName: string
  eventName: string
  kind: 'cross-slice' | 'no-match'
  candidates: CandidateEvent[]
}

interface PendingImportState {
  sliceNode: { id: string }
  queryNodeMap: Map<string, string>
  commandNodeMap: Map<string, string>
  producedEventNodeMap: Map<string, string>
  pending: PendingResolution[]
}

let pendingImport: PendingImportState | null = null

function isImportData(payload: unknown): payload is ImportData {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'slice' in payload &&
    typeof (payload as ImportData).slice === 'string' &&
    'screen' in payload &&
    typeof (payload as ImportData).screen === 'object'
  )
}

function getParentSliceName(node: { parent?: { getPluginData: (key: string) => string } }): string | null {
  let current: unknown = node
  while (current && typeof current === 'object') {
    const n = current as { parent?: unknown; getPluginData?: (key: string) => string }
    if (n.getPluginData && n.getPluginData('type') === 'slice') {
      return (n as { name?: string }).name ?? null
    }
    current = (n as { parent?: unknown }).parent
  }
  return null
}

export async function handleImportFromYaml(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  pendingImport = null

  let data: ImportData

  if (isImportData(payload)) {
    data = payload
  } else {
    const raw = (payload ?? {}) as { yamlContent?: string }
    const result = parseImportYaml(raw.yamlContent ?? '')
    if (!result.success) {
      figma.ui.postMessage({
        type: 'import-from-yaml-error',
        payload: { error: result.error },
      })
      return
    }
    data = result.data
  }

  try {
    const center = figma.viewport.center

    const slice = figma.createSection()
    slice.name = data.slice
    slice.setPluginData('type', 'slice')
    slice.setPluginData('label', data.slice)
    slice.x = center.x - SLICE_WIDTH / 2
    slice.y = center.y - SLICE_HEIGHT / 2
    slice.resizeWithoutConstraints(SLICE_WIDTH, SLICE_HEIGHT)
    figma.currentPage.appendChild(slice)

    const sliceChildren: Array<{ node: any; x: number; y: number; width: number; height: number }> = []

    const commandCount = data.commands?.length ?? 0
    const queryCount = data.queries?.length ?? 0

    const topRowItemCount = commandCount + queryCount
    const topRowWidth = topRowItemCount > 0
      ? commandCount * ELEMENT_WIDTH + (commandCount > 1 ? (commandCount - 1) * ELEMENT_GAP : 0)
        + (commandCount > 0 && queryCount > 0 ? GROUP_GAP : 0)
        + queryCount * ELEMENT_WIDTH + (queryCount > 1 ? (queryCount - 1) * ELEMENT_GAP : 0)
      : 0

    const topRowY = center.y + SLICE_HEIGHT / 2 + COLUMN_GAP + RESERVED_TOP_SPACE
    const topRowStartX = center.x - topRowWidth / 2

    const needsFont = !!data.screen || commandCount > 0 || queryCount > 0 || (data.gwt?.some(g => g.given.length > 0 || g.when.length > 0 || g.then.length > 0))

    if (needsFont) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
    }

    const queryNodeMap = new Map<string, string>()
    const commandNodeMap = new Map<string, string>()
    const producedEventNodeMap = new Map<string, string>()

    if (data.screen) {
      const screenShape = figma.createShapeWithText()
      screenShape.shapeType = 'SQUARE'
      screenShape.resize(SCREEN_WIDTH, SCREEN_HEIGHT)
      screenShape.fills = [{ type: 'SOLID', color: SCREEN_FILL }]
      const screenLabel = data.screen.name ?? (data.screen.type === 'user' ? 'Screen' : 'Processor')
      screenShape.text.characters = screenLabel
      screenShape.text.fills = [{ type: 'SOLID', color: SCREEN_TEXT_COLOR }]
      screenShape.setPluginData('type', data.screen.type === 'user' ? 'screen' : 'processor')
      screenShape.setPluginData('label', screenLabel)

      const cmdColumnCenterX = topRowWidth > 0 ? topRowStartX + topRowWidth / 2 : center.x
      screenShape.x = cmdColumnCenterX - SCREEN_WIDTH / 2
      screenShape.y = topRowY - SCREEN_HEIGHT - COLUMN_GAP

      slice.appendChild(screenShape)
      sliceChildren.push({ node: screenShape, x: screenShape.x, y: screenShape.y, width: SCREEN_WIDTH, height: SCREEN_HEIGHT })
    }

    if (data.commands) {
      data.commands.forEach((cmd, index) => {
        const shape = figma.createShapeWithText()
        shape.shapeType = 'SQUARE'
        shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
        shape.fills = [{ type: 'SOLID', color: COMMAND_FILL }]
        shape.strokes = [{ type: 'SOLID', color: COMMAND_STROKE }]
        shape.strokeWeight = 2
        shape.text.characters = cmd.name
        shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
        shape.setPluginData('type', 'command')
        shape.setPluginData('label', cmd.name)
        if (cmd.fields) {
          shape.setPluginData('customFields', convertBlockStringToYaml(cmd.fields))
        }
        if (cmd.notes) {
          shape.setPluginData('notes', cmd.notes)
        }
        shape.x = topRowStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
        shape.y = topRowY
        slice.appendChild(shape)
        sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
        commandNodeMap.set(normalizeName(cmd.name), shape.id)
      })
    }

    const allProduces: Array<{ eventName: string; commandName: string }> = []
    if (data.commands) {
      for (const cmd of data.commands) {
        if (cmd.produces) {
          for (const eventName of cmd.produces) {
            allProduces.push({ eventName, commandName: cmd.name })
          }
        }
      }
    }

    const eventCount = allProduces.length
    const bottomRowWidth = eventCount > 0
      ? eventCount * ELEMENT_WIDTH + (eventCount > 1 ? (eventCount - 1) * ELEMENT_GAP : 0)
      : 0
    const bottomRowStartX = center.x - bottomRowWidth / 2
    const bottomRowY = topRowY + ELEMENT_HEIGHT + ROW_GAP

    allProduces.forEach((prod, index) => {
      const shape = figma.createShapeWithText()
      shape.shapeType = 'SQUARE'
      shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
      shape.fills = [{ type: 'SOLID', color: EVENT_INTERNAL_FILL }]
      shape.strokes = [{ type: 'SOLID', color: EVENT_INTERNAL_STROKE }]
      shape.strokeWeight = 2
      shape.text.characters = prod.eventName
      shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
      shape.setPluginData('type', 'event')
      shape.setPluginData('label', prod.eventName)
      shape.setPluginData('external', 'false')
      shape.x = bottomRowStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
      shape.y = topRowItemCount > 0 ? bottomRowY : topRowY
      slice.appendChild(shape)
      sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
      producedEventNodeMap.set(normalizeName(prod.eventName), shape.id)
    })

    if (data.queries) {
      const queryStartX = topRowStartX
        + commandCount * ELEMENT_WIDTH
        + (commandCount > 1 ? (commandCount - 1) * ELEMENT_GAP : 0)
        + (commandCount > 0 ? GROUP_GAP : 0)

      data.queries.forEach((qry, index) => {
        const shape = figma.createShapeWithText()
        shape.shapeType = 'SQUARE'
        shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
        shape.fills = [{ type: 'SOLID', color: QUERY_FILL }]
        shape.strokes = [{ type: 'SOLID', color: QUERY_STROKE }]
        shape.strokeWeight = 2
        shape.text.characters = qry.name
        shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
        shape.setPluginData('type', 'query')
        shape.setPluginData('label', qry.name)
        if (qry.fields) {
          shape.setPluginData('customFields', convertBlockStringToYaml(qry.fields))
        }
        if (qry.notes) {
          shape.setPluginData('notes', qry.notes)
        }
        shape.x = queryStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
        shape.y = topRowY
        slice.appendChild(shape)
        sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
        queryNodeMap.set(normalizeName(qry.name), shape.id)
      })
    }

    if (data.gwt) {
      const hasTopRow = topRowItemCount > 0
      const hasBottomRow = eventCount > 0
      const rowCount = (hasTopRow ? 1 : 0) + (hasBottomRow ? 1 : 0)
      const gwtStartY = rowCount > 0
        ? topRowY + (rowCount > 1 ? 2 : 1) * ELEMENT_HEIGHT + (rowCount > 1 ? ROW_GAP : 0) + GWT_VERTICAL_OFFSET
        : topRowY

      const contentLeftXCandidates: number[] = []
      if (topRowItemCount > 0) contentLeftXCandidates.push(topRowStartX)
      if (eventCount > 0) contentLeftXCandidates.push(bottomRowStartX)
      const gwtLeftX = contentLeftXCandidates.length > 0
        ? Math.min(...contentLeftXCandidates)
        : center.x - GWT_PARENT_WIDTH / 2

      data.gwt.forEach((gwtEntry, gwtIndex) => {
        const parent = figma.createSection()
        parent.name = gwtEntry.name
        parent.setPluginData('type', 'gwt')

        const gwtItems = [gwtEntry.given, gwtEntry.when, gwtEntry.then]
        for (let i = 0; i < GWT_CHILD_NAMES.length; i++) {
          const child = figma.createSection()
          child.name = GWT_CHILD_NAMES[i]
          child.resizeWithoutConstraints(GWT_CHILD_WIDTH, GWT_CHILD_HEIGHT)
          child.x = (GWT_PARENT_WIDTH - GWT_CHILD_WIDTH) / 2
          child.y = GWT_CHILD_GAP + i * (GWT_CHILD_HEIGHT + GWT_CHILD_GAP)

          const items = gwtItems[i]
          if (items) {
            items.forEach((item, itemIndex) => {
              const shape = figma.createShapeWithText()
              shape.shapeType = 'SQUARE'
              shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)

              let fillColor, strokeColor
              switch (item.type) {
                case 'command':
                  fillColor = COMMAND_FILL
                  strokeColor = COMMAND_STROKE
                  break
                case 'event':
                  fillColor = EVENT_INTERNAL_FILL
                  strokeColor = EVENT_INTERNAL_STROKE
                  break
                case 'query':
                  fillColor = QUERY_FILL
                  strokeColor = QUERY_STROKE
                  break
                case 'error':
                  fillColor = ERROR_FILL
                  strokeColor = ERROR_STROKE
                  break
              }

              shape.fills = [{ type: 'SOLID', color: fillColor }]
              shape.strokes = [{ type: 'SOLID', color: strokeColor }]
              shape.strokeWeight = 2
              shape.text.characters = item.name
              shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
              shape.setPluginData('type', item.type)
              shape.setPluginData('label', item.name)
              if (item.fields) {
                shape.setPluginData('customFields', convertBlockStringToYaml(item.fields))
              }
              shape.x = GWT_CHILD_SHAPE_PADDING + itemIndex * (ELEMENT_WIDTH + ELEMENT_GAP)
              shape.y = GWT_CHILD_SHAPE_PADDING
              child.appendChild(shape)
            })
          }

          parent.appendChild(child)
        }

        const hasDescription = !!gwtEntry.description
        const parentWidth = hasDescription
          ? GWT_PARENT_WIDTH + GWT_DESCRIPTION_GAP + GWT_DESCRIPTION_WIDTH
          : GWT_PARENT_WIDTH

        if (hasDescription) {
          const sticky = figma.createSticky()
          sticky.text.characters = gwtEntry.description!
          sticky.x = GWT_PARENT_WIDTH + GWT_DESCRIPTION_GAP
          sticky.y = GWT_CHILD_GAP
          parent.appendChild(sticky)
        }

        parent.resizeWithoutConstraints(parentWidth, GWT_PARENT_HEIGHT)
        parent.x = gwtLeftX
        parent.y = gwtStartY + gwtIndex * (GWT_PARENT_HEIGHT + GWT_VERTICAL_OFFSET)

        slice.appendChild(parent)
        sliceChildren.push({ node: parent, x: parent.x, y: parent.y, width: parentWidth, height: GWT_PARENT_HEIGHT })
      })
    }

    if (sliceChildren.length > 0) {
      let minX = Infinity
      let minY = Infinity
      let maxRight = -Infinity
      let maxBottom = -Infinity

      for (const child of sliceChildren) {
        minX = Math.min(minX, child.x)
        minY = Math.min(minY, child.y)
        maxRight = Math.max(maxRight, child.x + child.width)
        maxBottom = Math.max(maxBottom, child.y + child.height)
      }

      minY -= RESERVED_TOP_SPACE

      const contentWidth = maxRight - minX
      const contentHeight = maxBottom - minY
      const finalWidth = contentWidth + SLICE_PADDING * 2
      const finalHeight = contentHeight + SLICE_PADDING * 2

      slice.x = minX - SLICE_PADDING
      slice.y = minY - SLICE_PADDING
      slice.resizeWithoutConstraints(finalWidth, finalHeight)

      for (const child of sliceChildren) {
        child.node.x = child.x - slice.x
        child.node.y = child.y - slice.y
      }
    }

    if (data.screen?.reads) {
      for (const queryName of data.screen.reads) {
        const queryNodeId = queryNodeMap.get(normalizeName(queryName))
        if (queryNodeId) {
          const screenShape = sliceChildren.find(c => c.node.getPluginData('type') === 'screen' || c.node.getPluginData('type') === 'processor')?.node
          if (screenShape) {
            createConnector(figma as any, { id: queryNodeId } as any, { id: screenShape.id } as any)
          }
        }
      }
    }

    if (data.screen?.executes) {
      for (const cmdName of data.screen.executes) {
        const cmdNodeId = commandNodeMap.get(normalizeName(cmdName))
        if (cmdNodeId) {
          const screenShape = sliceChildren.find(c => c.node.getPluginData('type') === 'screen' || c.node.getPluginData('type') === 'processor')?.node
          if (screenShape) {
            createConnector(figma as any, { id: screenShape.id } as any, { id: cmdNodeId } as any)
          }
        }
      }
    }

    for (const prod of allProduces) {
      const cmdNodeId = commandNodeMap.get(normalizeName(prod.commandName))
      const eventNodeId = producedEventNodeMap.get(normalizeName(prod.eventName))
      if (cmdNodeId && eventNodeId) {
        createConnector(figma as any, { id: cmdNodeId } as any, { id: eventNodeId } as any)
      }
    }

    if (data.queries) {
      for (const qry of data.queries) {
        if (qry.from_events) {
          for (const eventName of qry.from_events) {
            const eventNodeId = producedEventNodeMap.get(normalizeName(eventName))
            const queryNodeId = queryNodeMap.get(normalizeName(qry.name))
            if (eventNodeId && queryNodeId) {
              createConnector(figma as any, { id: eventNodeId } as any, { id: queryNodeId } as any)
            }
          }
        }
      }
    }

    const pending: PendingResolution[] = []
    if (data.queries) {
      for (const qry of data.queries) {
        if (qry.from_events) {
          for (const eventName of qry.from_events) {
            if (producedEventNodeMap.has(normalizeName(eventName))) {
              continue
            }

            const canvasEvents = figma.currentPage.findAll(
              (n: any) => n.getPluginData && n.getPluginData('type') === 'event'
            ) as Array<{ id: string; getPluginData: (key: string) => string }>

            const normalizedEventName = normalizeName(eventName)
            const matchingEvents = canvasEvents.filter(e =>
              normalizeName(e.getPluginData('label')) === normalizedEventName
            )

            if (matchingEvents.length > 0) {
              const candidates: CandidateEvent[] = matchingEvents.map(e => ({
                nodeId: e.id,
                label: e.getPluginData('label'),
                parentSliceName: getParentSliceName(e as any),
              }))
              pending.push({
                queryName: qry.name,
                eventName,
                kind: 'cross-slice',
                candidates,
              })
            } else {
              pending.push({
                queryName: qry.name,
                eventName,
                kind: 'no-match',
                candidates: [],
              })
            }
          }
        }
      }

      pending.sort((a, b) => {
        if (a.kind === 'cross-slice' && b.kind === 'no-match') return -1
        if (a.kind === 'no-match' && b.kind === 'cross-slice') return 1
        return 0
      })
    }

    pendingImport = {
      sliceNode: { id: slice.id },
      queryNodeMap,
      commandNodeMap,
      producedEventNodeMap,
      pending,
    }

    if (pending.length > 0) {
      figma.ui.postMessage({
        type: 'import-resolution-needed',
        payload: { pending },
      })
      return
    }

    figma.currentPage.selection = [slice]
    figma.ui.postMessage({ type: 'import-from-yaml-success' })
  } catch (error) {
    figma.ui.postMessage({
      type: 'import-from-yaml-error',
      payload: {
        error: error instanceof Error ? error.message : 'An unexpected error occurred during import',
      },
    })
  }
}

export async function handleImportResolutionAnswered(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { answers } = payload as { answers: Array<{ queryName: string; resolution: 'connect' | 'create' | 'skip'; candidateNodeId?: string }> }

  if (!pendingImport) {
    figma.ui.postMessage({
      type: 'import-from-yaml-error',
      payload: { error: 'No pending import to resolve' },
    })
    return
  }

  try {
    const createdEventsMap = new Map<string, string>()

    for (const answer of answers) {
      if (answer.resolution === 'skip') {
        continue
      }

      const queryNodeId = pendingImport.queryNodeMap.get(normalizeName(answer.queryName))
      if (!queryNodeId) continue

      if (answer.resolution === 'connect' && answer.candidateNodeId) {
        const pendingEntry = pendingImport.pending.find(
          p => normalizeName(p.queryName) === normalizeName(answer.queryName)
        )
        if (!pendingEntry) continue
        const isValidCandidate = pendingEntry.candidates.some(
          c => c.nodeId === answer.candidateNodeId
        )
        if (!isValidCandidate) continue

        const candidateNode = figma.getNodeById(answer.candidateNodeId) as any
        if (candidateNode && candidateNode.getPluginData && candidateNode.getPluginData('type') === 'event') {
          createConnector(figma as any, candidateNode, { id: queryNodeId } as any)
        }
      } else if (answer.resolution === 'create') {
        const pendingEntry = pendingImport.pending.find(
          p => normalizeName(p.queryName) === normalizeName(answer.queryName)
        )
        if (!pendingEntry) continue
        const eventName = pendingEntry.eventName
        const normalizedEventName = normalizeName(eventName)

        let eventNodeId = createdEventsMap.get(normalizedEventName)
        if (!eventNodeId) {
          const newEvent = figma.createShapeWithText()
          newEvent.shapeType = 'SQUARE'
          newEvent.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
          newEvent.fills = [{ type: 'SOLID', color: EVENT_INTERNAL_FILL }]
          newEvent.strokes = [{ type: 'SOLID', color: EVENT_INTERNAL_STROKE }]
          newEvent.strokeWeight = 2
          newEvent.text.characters = eventName
          newEvent.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
          newEvent.setPluginData('type', 'event')
          newEvent.setPluginData('label', eventName)
          newEvent.setPluginData('external', 'false')

          const sliceNode = figma.getNodeById(pendingImport.sliceNode.id) as any
          if (sliceNode) {
            sliceNode.appendChild(newEvent)
          }
          createdEventsMap.set(normalizedEventName, newEvent.id)
          eventNodeId = newEvent.id
        }

        createConnector(figma as any, { id: eventNodeId } as any, { id: queryNodeId } as any)
      }
    }

    const sliceNode = figma.getNodeById(pendingImport.sliceNode.id) as any
    if (sliceNode) {
      figma.currentPage.selection = [sliceNode]
    }

    figma.ui.postMessage({ type: 'import-from-yaml-success' })
  } catch (error) {
    figma.ui.postMessage({
      type: 'import-from-yaml-error',
      payload: {
        error: error instanceof Error ? error.message : 'An unexpected error occurred during import resolution',
      },
    })
  } finally {
    pendingImport = null
  }
}

export async function handleFocusNode(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { nodeId } = payload as { nodeId: string }

  const node = figma.getNodeById(nodeId)
  if (node) {
    figma.viewport.scrollAndZoomIntoView([node])
  } else {
    console.warn(`[handleFocusNode] Node not found: ${nodeId}`)
  }
}
