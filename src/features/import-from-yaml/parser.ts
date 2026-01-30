import yaml from 'js-yaml'

export interface ImportCommand {
  name: string
  fields?: string
  notes?: string
}

export interface ImportEvent {
  name: string
  external: boolean
  fields?: string
  notes?: string
}

export interface ImportQuery {
  name: string
  fields?: string
  notes?: string
}

export interface ImportGwtItem {
  name: string
  type: 'command' | 'event' | 'query' | 'error'
  fields?: string
}

export interface ImportGwt {
  name: string
  description?: string
  given: ImportGwtItem[]
  when: ImportGwtItem[]
  then: ImportGwtItem[]
}

export interface ImportData {
  slice: string
  commands?: ImportCommand[]
  events?: ImportEvent[]
  queries?: ImportQuery[]
  gwt?: ImportGwt[]
}

export type ParseResult =
  | { success: true; data: ImportData }
  | { success: false; error: string }

function validateNamedEntries(
  entries: unknown[],
  label: string,
): string | null {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as Record<string, unknown>
    if (!entry.name || typeof entry.name !== 'string') {
      return `${label}[${i}] is missing a required "name" field`
    }
  }
  return null
}

export function parseImportYaml(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { success: false, error: 'Input is empty' }
  }

  let parsed: unknown
  try {
    parsed = yaml.load(input)
  } catch {
    return { success: false, error: 'Invalid YAML syntax' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: 'YAML must be an object' }
  }

  const doc = parsed as Record<string, unknown>

  if (!doc.slice || typeof doc.slice !== 'string' || !doc.slice.trim()) {
    return {
      success: false,
      error: 'Missing required "slice" field',
    }
  }

  const data: ImportData = { slice: doc.slice }

  const arrayFields = ['commands', 'events', 'queries', 'gwt'] as const
  for (const field of arrayFields) {
    if (doc[field] !== undefined) {
      if (!Array.isArray(doc[field])) {
        return {
          success: false,
          error: `"${field}" must be an array`,
        }
      }
    }
  }

  if (doc.commands) {
    const err = validateNamedEntries(doc.commands as unknown[], 'commands')
    if (err) return { success: false, error: err }
    data.commands = (doc.commands as Record<string, unknown>[]).map((c) => ({
      name: c.name as string,
      fields: c.fields as string | undefined,
      notes: c.notes as string | undefined,
    }))
  }

  if (doc.events) {
    const err = validateNamedEntries(doc.events as unknown[], 'events')
    if (err) return { success: false, error: err }
    data.events = (doc.events as Record<string, unknown>[]).map((e) => ({
      name: e.name as string,
      external: e.external === true ? true : false,
      fields: e.fields as string | undefined,
      notes: e.notes as string | undefined,
    }))
  }

  if (doc.queries) {
    const err = validateNamedEntries(doc.queries as unknown[], 'queries')
    if (err) return { success: false, error: err }
    data.queries = (doc.queries as Record<string, unknown>[]).map((q) => ({
      name: q.name as string,
      fields: q.fields as string | undefined,
      notes: q.notes as string | undefined,
    }))
  }

  if (doc.gwt) {
    const err = validateNamedEntries(doc.gwt as unknown[], 'gwt')
    if (err) return { success: false, error: err }

    const validGwtItemTypes = ['command', 'event', 'query', 'error']

    const parseGwtItems = (
      items: unknown[] | undefined,
      gwtIndex: number,
      section: string,
    ): ImportGwtItem[] | string => {
      if (!items) return []
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Record<string, unknown>
        if (!item.name || typeof item.name !== 'string') {
          return `gwt[${gwtIndex}].${section}[${i}] is missing a required "name" field`
        }
        if (!item.type || typeof item.type !== 'string') {
          return `gwt[${gwtIndex}].${section}[${i}] is missing a required "type" field`
        }
        if (!validGwtItemTypes.includes(item.type as string)) {
          return `gwt[${gwtIndex}].${section}[${i}] has invalid "type": "${item.type}". Must be one of: ${validGwtItemTypes.join(', ')}`
        }
      }
      return items.map((item) => {
        const i = item as Record<string, unknown>
        return {
          name: i.name as string,
          type: i.type as ImportGwtItem['type'],
          ...(i.fields !== undefined && { fields: i.fields as string }),
        }
      })
    }

    const gwtEntries = doc.gwt as Record<string, unknown>[]
    const parsedGwt: ImportGwt[] = []

    for (let i = 0; i < gwtEntries.length; i++) {
      const g = gwtEntries[i]
      const given = parseGwtItems(g.given as unknown[] | undefined, i, 'given')
      if (typeof given === 'string') return { success: false, error: given }
      const when = parseGwtItems(g.when as unknown[] | undefined, i, 'when')
      if (typeof when === 'string') return { success: false, error: when }
      const then = parseGwtItems(g.then as unknown[] | undefined, i, 'then')
      if (typeof then === 'string') return { success: false, error: then }

      parsedGwt.push({
        name: g.name as string,
        ...(g.description !== undefined && { description: g.description as string }),
        given,
        when,
        then,
      })
    }

    data.gwt = parsedGwt
  }

  return { success: true, data }
}
