import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { parseImportYaml, type ImportData } from './parser'

const ELEMENT_WIDTH = 176
const ELEMENT_HEIGHT = 80
const ELEMENT_CORNER_RADIUS = 0
const TEXT_COLOR = { r: 1, g: 1, b: 1 }

const COMMAND_FILL = { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 }
const COMMAND_STROKE = { r: 0x00 / 255, g: 0x7a / 255, b: 0xd2 / 255 }

const EVENT_FILL = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const EVENT_STROKE = { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 }

const QUERY_FILL = { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 }
const QUERY_STROKE = { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 }

const GWT_PARENT_WIDTH = 400
const GWT_PARENT_HEIGHT = 600
const GWT_CHILD_WIDTH = 350
const GWT_CHILD_HEIGHT = 180
const GWT_CHILD_GAP = 15
const GWT_CHILD_NAMES = ['Given', 'When', 'Then'] as const

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

  // Create slice section
  const slice = figma.createSection()
  slice.name = data.slice
  slice.setPluginData('type', 'slice')
  slice.setPluginData('label', data.slice)
  figma.currentPage.appendChild(slice)

  const needsFont =
    (data.commands && data.commands.length > 0) ||
    (data.events && data.events.length > 0) ||
    (data.queries && data.queries.length > 0)

  if (needsFont) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  }

  // Create commands
  if (data.commands) {
    for (const cmd of data.commands) {
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
      figma.currentPage.appendChild(shape)
    }
  }

  // Create events
  if (data.events) {
    for (const evt of data.events) {
      const shape = figma.createShapeWithText()
      shape.shapeType = 'ROUNDED_RECTANGLE'
      shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
      shape.cornerRadius = ELEMENT_CORNER_RADIUS
      shape.fills = [{ type: 'SOLID', color: EVENT_FILL }]
      shape.strokes = [{ type: 'SOLID', color: EVENT_STROKE }]
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
      figma.currentPage.appendChild(shape)
    }
  }

  // Create queries
  if (data.queries) {
    for (const qry of data.queries) {
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
      figma.currentPage.appendChild(shape)
    }
  }

  // Create GWT sections
  if (data.gwt) {
    for (const gwtEntry of data.gwt) {
      const parent = figma.createSection()
      parent.name = gwtEntry.name
      parent.setPluginData('type', 'gwt')
      parent.resizeWithoutConstraints(GWT_PARENT_WIDTH, GWT_PARENT_HEIGHT)

      for (let i = 0; i < GWT_CHILD_NAMES.length; i++) {
        const child = figma.createSection()
        child.name = GWT_CHILD_NAMES[i]
        child.resizeWithoutConstraints(GWT_CHILD_WIDTH, GWT_CHILD_HEIGHT)
        child.x = (GWT_PARENT_WIDTH - GWT_CHILD_WIDTH) / 2
        child.y = GWT_CHILD_GAP + i * (GWT_CHILD_HEIGHT + GWT_CHILD_GAP)
        parent.appendChild(child)
      }

      figma.currentPage.appendChild(parent)
    }
  }
}
