import yaml from 'js-yaml'
import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { deserializeFields } from '../update-custom-fields/field-utils'

interface ElementNode {
  type: string
  name: string
  children?: ElementNode[]
  text?: { characters: string }
  getPluginData(key: string): string
}

interface CopyElementData {
  name: string
  type: string
  external?: boolean
  fields?: Array<{ [key: string]: string }>
  notes?: string
}

interface CopyGwtItem {
  name: string
  type: 'command' | 'event' | 'query' | 'error'
  fields?: Array<{ [key: string]: string }>
}

interface CopyGwt {
  name: string
  description?: string
  given: CopyGwtItem[]
  when: CopyGwtItem[]
  then: CopyGwtItem[]
}

function getNodeText(node: ElementNode): string {
  return node.text?.characters || node.name
}

function formatGwtSectionForCopy(node: ElementNode): CopyGwt {
  const sections = node.children ?? []
  const given: CopyGwtItem[] = []
  const when: CopyGwtItem[] = []
  const then: CopyGwtItem[] = []
  let description: string | undefined

  for (const section of sections) {
    const sectionName = section.name
    if (sectionName === 'Given') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as CopyGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          const fields = customFields ? deserializeFields(customFields) : []
          given.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: fields.length > 0 ? fields.map(f => ({ [f.name]: f.type })) : undefined,
          })
        }
      }
    } else if (sectionName === 'When') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as CopyGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          const fields = customFields ? deserializeFields(customFields) : []
          when.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: fields.length > 0 ? fields.map(f => ({ [f.name]: f.type })) : undefined,
          })
        }
      }
    } else if (sectionName === 'Then') {
      for (const child of section.children ?? []) {
        const itemType = child.getPluginData('type') as CopyGwtItem['type']
        if (['command', 'event', 'query', 'error'].includes(itemType)) {
          const customFields = child.getPluginData('customFields')
          const fields = customFields ? deserializeFields(customFields) : []
          then.push({
            name: child.getPluginData('label') || child.name,
            type: itemType,
            fields: fields.length > 0 ? fields.map(f => ({ [f.name]: f.type })) : undefined,
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

export async function handleCopyElementToYaml(
  payload: { id: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  const node = await figma.getNodeByIdAsync(payload.id) as ElementNode | null

  if (!node) {
    figma.ui.postMessage({
      type: 'copy-element-to-yaml-error',
      payload: { message: 'Element not found' },
    })
    return
  }

  const elementType = node.getPluginData('type')

  if (elementType === 'gwt') {
    const gwtData = formatGwtSectionForCopy(node)
    const yamlStr = yaml.dump(gwtData, { skipInvalid: true, lineWidth: -1 })
    figma.ui.postMessage({
      type: 'copy-element-to-yaml-result',
      payload: { yaml: yamlStr },
    })
    return
  }

  if (['command', 'event', 'query', 'actor'].includes(elementType)) {
    const customFields = node.getPluginData('customFields')
    const notes = node.getPluginData('notes')
    const external = node.getPluginData('external') === 'true'
    const fields = customFields ? deserializeFields(customFields) : []

    const data: CopyElementData = {
      name: node.getPluginData('label') || node.name,
      type: elementType,
    }

    if (external) {
      data.external = true
    }

    if (fields.length > 0) {
      data.fields = fields.map(f => ({ [f.name]: f.type }))
    }

    if (notes) {
      data.notes = notes
    }

    const yamlStr = yaml.dump(data, { skipInvalid: true, lineWidth: -1 })
    figma.ui.postMessage({
      type: 'copy-element-to-yaml-result',
      payload: { yaml: yamlStr },
    })
    return
  }

  figma.ui.postMessage({
    type: 'copy-element-to-yaml-error',
    payload: { message: `Unsupported element type: ${elementType}` },
  })
}