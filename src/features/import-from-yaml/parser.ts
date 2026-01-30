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

export interface ImportGwt {
  name: string
  given: string[]
  when: string[]
  then: string[]
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
    data.gwt = (doc.gwt as Record<string, unknown>[]).map((g) => ({
      name: g.name as string,
      given: (g.given as string[]) || [],
      when: (g.when as string[]) || [],
      then: (g.then as string[]) || [],
    }))
  }

  return { success: true, data }
}
