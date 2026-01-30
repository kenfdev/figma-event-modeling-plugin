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

const ERROR_FILL = { r: 0xff / 255, g: 0x44 / 255, b: 0x44 / 255 }
const ERROR_STROKE = { r: 0xcc / 255, g: 0x00 / 255, b: 0x00 / 255 }

const GWT_PARENT_WIDTH = 400
const GWT_PARENT_HEIGHT = 600
const GWT_CHILD_WIDTH = 350
const GWT_CHILD_HEIGHT = 180
const GWT_CHILD_GAP = 15
const GWT_CHILD_NAMES = ['Given', 'When', 'Then'] as const

const ELEMENT_GAP = 20
const GROUP_GAP = 60
const ROW_GAP = 40
const SLICE_WIDTH = 400
const SLICE_HEIGHT = 120
const COLUMN_GAP = 40
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

    // Create slice section
    const slice = figma.createSection()
    slice.name = data.slice
    slice.setPluginData('type', 'slice')
    slice.setPluginData('label', data.slice)
    slice.x = center.x - SLICE_WIDTH / 2
    slice.y = center.y - SLICE_HEIGHT / 2
    slice.resizeWithoutConstraints(SLICE_WIDTH, SLICE_HEIGHT)
    figma.currentPage.appendChild(slice)

    const sliceChildren: Array<{ node: { x: number; y: number }; x: number; y: number; width: number; height: number }> = []

    const gwtHasItems = data.gwt?.some(g =>
      g.given.length > 0 || g.when.length > 0 || g.then.length > 0
    )
    const needsFont =
      (data.commands && data.commands.length > 0) ||
      (data.events && data.events.length > 0) ||
      (data.queries && data.queries.length > 0) ||
      gwtHasItems

    if (needsFont) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
    }

    // Two-row layout:
    // Row 1 (top): Commands on the left, Queries on the right (with larger gap between groups)
    // Row 2 (bottom): Events in a horizontal row

    const commandCount = data.commands?.length ?? 0
    const queryCount = data.queries?.length ?? 0
    const eventCount = data.events?.length ?? 0

    // Calculate top row width: commands + group gap + queries
    const topRowItemCount = commandCount + queryCount
    const topRowWidth = topRowItemCount > 0
      ? commandCount * ELEMENT_WIDTH + (commandCount > 1 ? (commandCount - 1) * ELEMENT_GAP : 0)
        + (commandCount > 0 && queryCount > 0 ? GROUP_GAP : 0)
        + queryCount * ELEMENT_WIDTH + (queryCount > 1 ? (queryCount - 1) * ELEMENT_GAP : 0)
      : 0

    // Calculate bottom row width: events
    const bottomRowWidth = eventCount > 0
      ? eventCount * ELEMENT_WIDTH + (eventCount - 1) * ELEMENT_GAP
      : 0

    // Starting Y position for rows (below the slice)
    const topRowY = center.y + SLICE_HEIGHT / 2 + COLUMN_GAP
    const bottomRowY = topRowY + ELEMENT_HEIGHT + ROW_GAP

    // Top row starting X (centered on viewport)
    const topRowStartX = center.x - topRowWidth / 2

    // Bottom row starting X (centered on viewport)
    const bottomRowStartX = center.x - bottomRowWidth / 2

    // Create commands (left side of top row)
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
        shape.x = topRowStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
        shape.y = topRowY
        slice.appendChild(shape)
        sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
      })
    }

    // Create events (bottom row)
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
        shape.x = bottomRowStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
        shape.y = topRowItemCount > 0 ? bottomRowY : topRowY
        slice.appendChild(shape)
        sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
      })
    }

    // Create queries (right side of top row)
    if (data.queries) {
      const queryStartX = topRowStartX
        + commandCount * ELEMENT_WIDTH
        + (commandCount > 1 ? (commandCount - 1) * ELEMENT_GAP : 0)
        + (commandCount > 0 ? GROUP_GAP : 0)

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
        shape.x = queryStartX + index * (ELEMENT_WIDTH + ELEMENT_GAP)
        shape.y = topRowY
        slice.appendChild(shape)
        sliceChildren.push({ node: shape, x: shape.x, y: shape.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })
      })
    }

    // Create GWT sections
    if (data.gwt) {
      // Position GWT sections below element rows
      const hasTopRow = topRowItemCount > 0
      const hasBottomRow = eventCount > 0
      const rowCount = (hasTopRow ? 1 : 0) + (hasBottomRow ? 1 : 0)
      const gwtStartY = rowCount > 0
        ? topRowY + (rowCount > 1 ? 2 : 1) * ELEMENT_HEIGHT + (rowCount > 1 ? ROW_GAP : 0) + GWT_VERTICAL_OFFSET
        : topRowY

      // Align GWT to left edge of content area
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

        // Create sticky note for description if provided
        if (gwtEntry.description) {
          const sticky = figma.createSticky()
          sticky.text.characters = gwtEntry.description
          parent.appendChild(sticky)
        }

        const gwtItems = [gwtEntry.given, gwtEntry.when, gwtEntry.then]
        for (let i = 0; i < GWT_CHILD_NAMES.length; i++) {
          const child = figma.createSection()
          child.name = GWT_CHILD_NAMES[i]
          child.resizeWithoutConstraints(GWT_CHILD_WIDTH, GWT_CHILD_HEIGHT)
          child.x = (GWT_PARENT_WIDTH - GWT_CHILD_WIDTH) / 2
          child.y = GWT_CHILD_GAP + i * (GWT_CHILD_HEIGHT + GWT_CHILD_GAP)

          // Create colored element shapes inside child section
          const items = gwtItems[i]
          if (items) {
            items.forEach((item) => {
              const shape = figma.createShapeWithText()
              shape.shapeType = 'ROUNDED_RECTANGLE'
              shape.resize(ELEMENT_WIDTH, ELEMENT_HEIGHT)
              shape.cornerRadius = ELEMENT_CORNER_RADIUS

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
                shape.setPluginData('customFields', item.fields)
              }
              child.appendChild(shape)
            })
          }

          parent.appendChild(child)
        }

        parent.resizeWithoutConstraints(GWT_PARENT_WIDTH, GWT_PARENT_HEIGHT)
        parent.x = gwtLeftX
        parent.y = gwtStartY + gwtIndex * (GWT_PARENT_HEIGHT + GWT_VERTICAL_OFFSET)

        slice.appendChild(parent)
        sliceChildren.push({ node: parent, x: parent.x, y: parent.y, width: GWT_PARENT_WIDTH, height: GWT_PARENT_HEIGHT })
      })
    }

    // Auto-size slice to fit all children with padding
    const SLICE_PADDING = 20
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

      const contentWidth = maxRight - minX
      const contentHeight = maxBottom - minY
      const finalWidth = contentWidth + SLICE_PADDING * 2
      const finalHeight = contentHeight + SLICE_PADDING * 2

      // Adjust slice position so children are inside with padding
      slice.x = minX - SLICE_PADDING
      slice.y = minY - SLICE_PADDING
      slice.resizeWithoutConstraints(finalWidth, finalHeight)

      // Convert children from absolute to section-relative coordinates
      for (const child of sliceChildren) {
        child.node.x = child.x - slice.x
        child.node.y = child.y - slice.y
      }
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
