import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { parseImportYaml, type ImportData } from './parser'

const ELEMENT_WIDTH = 176
const ELEMENT_HEIGHT = 80
const ELEMENT_CORNER_RADIUS = 0
const TEXT_COLOR = { r: 1, g: 1, b: 1 }

const COMMAND_FILL = { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 }
const COMMAND_STROKE = { r: 0x00 / 255, g: 0x7a / 255, b: 0xd2 / 255 }

const EVENT_INTERNAL_FILL = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const EVENT_INTERNAL_STROKE = { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 }
const EVENT_EXTERNAL_FILL = { r: 0x9b / 255, g: 0x59 / 255, b: 0xb6 / 255 }
const EVENT_EXTERNAL_STROKE = { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 }

const QUERY_FILL = { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 }
const QUERY_STROKE = { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 }

const GWT_PARENT_WIDTH = 400
const GWT_PARENT_HEIGHT = 600
const GWT_CHILD_WIDTH = 350
const GWT_CHILD_HEIGHT = 180
const GWT_CHILD_GAP = 15
const GWT_CHILD_NAMES = ['Given', 'When', 'Then'] as const

const COLUMN_GAP = 40
const VERTICAL_GAP = 20
const SLICE_WIDTH = 400
const SLICE_HEIGHT = 120
const GWT_VERTICAL_OFFSET = 40

function isImportData(payload: unknown): payload is ImportData {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'slice' in payload &&
    typeof (payload as ImportData).slice === 'string'
  )
}

export async function handleImportFromYaml(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  let data: ImportData

  if (isImportData(payload)) {
    data = payload
  } else {
    const raw = payload as { yamlContent?: string }
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

    // Calculate column X positions: Commands (left) | Events (center) | Queries (right)
    const eventColumnX = center.x - ELEMENT_WIDTH / 2
    const commandColumnX = eventColumnX - ELEMENT_WIDTH - COLUMN_GAP
    const queryColumnX = eventColumnX + ELEMENT_WIDTH + COLUMN_GAP

    // Create slice section
    const slice = figma.createSection()
    slice.name = data.slice
    slice.setPluginData('type', 'slice')
    slice.setPluginData('label', data.slice)
    slice.x = center.x - SLICE_WIDTH / 2
    slice.y = center.y - SLICE_HEIGHT / 2
    slice.resizeWithoutConstraints(SLICE_WIDTH, SLICE_HEIGHT)
    figma.currentPage.appendChild(slice)

    const needsFont =
      (data.commands && data.commands.length > 0) ||
      (data.events && data.events.length > 0) ||
      (data.queries && data.queries.length > 0)

    if (needsFont) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
    }

    // Starting Y position for element columns (below the slice)
    const elementsStartY = center.y + SLICE_HEIGHT / 2 + COLUMN_GAP

    // Create commands
    if (data.commands) {
      data.commands.forEach((cmd, index) => {
        const shape = figma.createShapeWithText()
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
        shape.cornerRadius = ELEMENT_CORNER_RADIUS
        shape.fills = [{ type: 'SOLID', color: COMMAND_FILL }]
        shape.strokes = [{ type: 'SOLID', color: COMMAND_STROKE }]
        shape.strokeWeight = 2
        shape.text.characters = cmd.name
        shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
        shape.setPluginData('type', 'command')
        shape.setPluginData('label', cmd.name)
        if (cmd.fields) {
          shape.setPluginData('customFields', cmd.fields)
        }
        if (cmd.notes) {
          shape.setPluginData('notes', cmd.notes)
        }
        shape.x = commandColumnX
        shape.y = elementsStartY + index * (ELEMENT_HEIGHT + VERTICAL_GAP)
        figma.currentPage.appendChild(shape)
      })
    }

    // Create events
    if (data.events) {
      data.events.forEach((evt, index) => {
        const shape = figma.createShapeWithText()
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
        shape.cornerRadius = ELEMENT_CORNER_RADIUS
        const fillColor = evt.external ? EVENT_EXTERNAL_FILL : EVENT_INTERNAL_FILL
        const strokeColor = evt.external ? EVENT_EXTERNAL_STROKE : EVENT_INTERNAL_STROKE
        shape.fills = [{ type: 'SOLID', color: fillColor }]
        shape.strokes = [{ type: 'SOLID', color: strokeColor }]
        shape.strokeWeight = 2
        shape.text.characters = evt.name
        shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
        shape.setPluginData('type', 'event')
        shape.setPluginData('label', evt.name)
        shape.setPluginData('external', evt.external ? 'true' : 'false')
        if (evt.fields) {
          shape.setPluginData('customFields', evt.fields)
        }
        if (evt.notes) {
          shape.setPluginData('notes', evt.notes)
        }
        shape.x = eventColumnX
        shape.y = elementsStartY + index * (ELEMENT_HEIGHT + VERTICAL_GAP)
        figma.currentPage.appendChild(shape)
      })
    }

    // Create queries
    if (data.queries) {
      data.queries.forEach((qry, index) => {
        const shape = figma.createShapeWithText()
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
        shape.cornerRadius = ELEMENT_CORNER_RADIUS
        shape.fills = [{ type: 'SOLID', color: QUERY_FILL }]
        shape.strokes = [{ type: 'SOLID', color: QUERY_STROKE }]
        shape.strokeWeight = 2
        shape.text.characters = qry.name
        shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
        shape.setPluginData('type', 'query')
        shape.setPluginData('label', qry.name)
        if (qry.fields) {
          shape.setPluginData('customFields', qry.fields)
        }
        if (qry.notes) {
          shape.setPluginData('notes', qry.notes)
        }
        shape.x = queryColumnX
        shape.y = elementsStartY + index * (ELEMENT_HEIGHT + VERTICAL_GAP)
        figma.currentPage.appendChild(shape)
      })
    }

    // Create GWT sections
    if (data.gwt) {
      // Position GWT sections below element columns
      const maxElementRows = Math.max(
        data.commands?.length ?? 0,
        data.events?.length ?? 0,
        data.queries?.length ?? 0
      )
      const gwtStartY = maxElementRows > 0
        ? elementsStartY + maxElementRows * (ELEMENT_HEIGHT + VERTICAL_GAP) + GWT_VERTICAL_OFFSET
        : elementsStartY

      data.gwt.forEach((gwtEntry, gwtIndex) => {
        const parent = figma.createSection()
        parent.name = gwtEntry.name
        parent.setPluginData('type', 'gwt')
        parent.resizeWithoutConstraints(GWT_PARENT_WIDTH, GWT_PARENT_HEIGHT)
        parent.x = center.x - GWT_PARENT_WIDTH / 2 + gwtIndex * (GWT_PARENT_WIDTH + COLUMN_GAP)
        parent.y = gwtStartY

        const gwtItems = [gwtEntry.given, gwtEntry.when, gwtEntry.then]
        for (let i = 0; i < GWT_CHILD_NAMES.length; i++) {
          const child = figma.createSection()
          const items = gwtItems[i]
          if (items && items.length > 0) {
            child.name = `${GWT_CHILD_NAMES[i]}\n${items.join('\n')}`
          } else {
            child.name = GWT_CHILD_NAMES[i]
          }
          child.resizeWithoutConstraints(GWT_CHILD_WIDTH, GWT_CHILD_HEIGHT)
          child.x = (GWT_PARENT_WIDTH - GWT_CHILD_WIDTH) / 2
          child.y = GWT_CHILD_GAP + i * (GWT_CHILD_HEIGHT + GWT_CHILD_GAP)
          parent.appendChild(child)
        }

        figma.currentPage.appendChild(parent)
      })
    }

    // Select the slice after import
    figma.currentPage.selection = [slice]
  } catch (error) {
    figma.ui.postMessage({
      type: 'import-from-yaml-error',
      payload: {
        error: error instanceof Error ? error.message : 'An unexpected error occurred during import',
      },
    })
  }
}
