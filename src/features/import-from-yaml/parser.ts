import yaml from 'js-yaml'
import { normalizeName } from './name-match'

export interface ImportCommand {
  name: string
  fields?: string
  notes?: string
  produces?: string[]
}

export interface ImportQuery {
  name: string
  fields?: string
  notes?: string
  from_events?: string[]
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

export interface ImportScreen {
  type: 'user' | 'system'
  name?: string
  reads?: string[]
  executes?: string[]
}

export interface ImportData {
  slice: string
  screen: ImportScreen
  commands?: ImportCommand[]
  queries?: ImportQuery[]
  gwt?: ImportGwt[]
}

export type ParseResult =
  | { success: true; data: ImportData; warnings: string[] }
  | { success: false; error: string }

function findDuplicate(items: string[]): string | null {
  const seen = new Map<string, string>()
  for (const item of items) {
    const normalized = normalizeName(item)
    if (seen.has(normalized)) {
      return seen.get(normalized)!
    }
    seen.set(normalized, item)
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

  const warnings: string[] = []
  const knownKeys = new Set(['slice', 'screen', 'commands', 'queries', 'gwt'])

  for (const key of Object.keys(doc)) {
    if (!knownKeys.has(key)) {
      if (key === 'events') {
        return {
          success: false,
          error: "Top-level 'events' is no longer supported; use commands[].produces instead",
        }
      }
      warnings.push(`Unknown top-level key: '${key}'`)
    }
  }

  if (doc.commands !== undefined && !Array.isArray(doc.commands)) {
    return { success: false, error: '"commands" must be an array' }
  }

  if (doc.queries !== undefined && !Array.isArray(doc.queries)) {
    return { success: false, error: '"queries" must be an array' }
  }

  if (doc.gwt !== undefined && !Array.isArray(doc.gwt)) {
    return { success: false, error: '"gwt" must be an array' }
  }

  if (doc.screen === undefined) {
    return { success: false, error: "Missing required 'screen' block" }
  }

  if (Array.isArray(doc.screen)) {
    return { success: false, error: "'screen' must be an object, not an array" }
  }

  const screenObj = doc.screen as Record<string, unknown>

  if (typeof screenObj !== 'object' || screenObj === null) {
    return { success: false, error: "'screen' must be an object" }
  }

  const screenType = screenObj.type
  if (!screenType || typeof screenType !== 'string' || !['user', 'system'].includes(screenType)) {
    return {
      success: false,
      error: screenType
        ? `Invalid screen.type '${screenType}' — expected 'user' or 'system'`
        : "Missing required 'screen.type' field",
    }
  }

  const screen: ImportScreen = {
    type: screenType as 'user' | 'system',
  }

  if (screenObj.name !== undefined && typeof screenObj.name === 'string') {
    screen.name = screenObj.name
  }

  if (screenObj.reads !== undefined) {
    if (!Array.isArray(screenObj.reads)) {
      return { success: false, error: "'screen.reads' must be an array" }
    }
    for (let i = 0; i < screenObj.reads.length; i++) {
      if (typeof screenObj.reads[i] !== 'string') {
        return { success: false, error: `screen.reads[${i}] must be a string` }
      }
    }
    screen.reads = screenObj.reads as string[]
  }

  if (screenObj.executes !== undefined) {
    if (!Array.isArray(screenObj.executes)) {
      return { success: false, error: "'screen.executes' must be an array" }
    }
    for (let i = 0; i < screenObj.executes.length; i++) {
      if (typeof screenObj.executes[i] !== 'string') {
        return { success: false, error: `screen.executes[${i}] must be a string` }
      }
    }
    screen.executes = screenObj.executes as string[]
  }

  const commands: ImportCommand[] = []
  if (doc.commands) {
    const cmdEntries = doc.commands as Record<string, unknown>[]
    for (let i = 0; i < cmdEntries.length; i++) {
      const c = cmdEntries[i]
      if (typeof c !== 'object' || c === null || Array.isArray(c)) {
        return { success: false, error: `commands[${i}] is missing a required "name" field` }
      }
      if (!c.name || typeof c.name !== 'string') {
        return { success: false, error: `commands[${i}] is missing a required "name" field` }
      }
      if (c.external !== undefined) {
        return { success: false, error: `commands[${i}] must not have an 'external' key` }
      }
      const produces: string[] = []
      if (Array.isArray(c.produces)) {
        for (let j = 0; j < c.produces.length; j++) {
          const p = c.produces[j]
          if (typeof p !== 'string') {
            return { success: false, error: `commands[${i}].produces[${j}] must be a string` }
          }
          produces.push(p)
        }
      }
      commands.push({
        name: c.name as string,
        fields: typeof c.fields === 'string' ? c.fields : undefined,
        notes: typeof c.notes === 'string' ? c.notes : undefined,
        produces: produces.length > 0 ? produces : undefined,
      })
    }
  }

  const queries: ImportQuery[] = []
  if (doc.queries) {
    const qryEntries = doc.queries as Record<string, unknown>[]
    for (let i = 0; i < qryEntries.length; i++) {
      const q = qryEntries[i]
      if (typeof q !== 'object' || q === null || Array.isArray(q)) {
        return { success: false, error: `queries[${i}] is missing a required "name" field` }
      }
      if (!q.name || typeof q.name !== 'string') {
        return { success: false, error: `queries[${i}] is missing a required "name" field` }
      }
      if (q.external !== undefined) {
        return { success: false, error: `queries[${i}] must not have an 'external' key` }
      }
      const from_events: string[] = []
      if (Array.isArray(q.from_events)) {
        for (let j = 0; j < q.from_events.length; j++) {
          const fe = q.from_events[j]
          if (typeof fe !== 'string') {
            return { success: false, error: `queries[${i}].from_events[${j}] must be a string` }
          }
          from_events.push(fe)
        }
      }
      queries.push({
        name: q.name as string,
        fields: typeof q.fields === 'string' ? q.fields : undefined,
        notes: typeof q.notes === 'string' ? q.notes : undefined,
        from_events: from_events.length > 0 ? from_events : undefined,
      })
    }
  }

  const commandNames = commands.map((c) => c.name)
  const dupCmd = findDuplicate(commandNames)
  if (dupCmd) {
    return { success: false, error: `Duplicate command name '${dupCmd}' in commands[]` }
  }

  const queryNames = queries.map((q) => q.name)
  const dupQry = findDuplicate(queryNames)
  if (dupQry) {
    return { success: false, error: `Duplicate query name '${dupQry}' in queries[]` }
  }

  for (const cmd of commands) {
    if (cmd.produces) {
      const dup = findDuplicate(cmd.produces)
      if (dup) {
        return {
          success: false,
          error: `Duplicate event name '${dup}' in produces of command '${cmd.name}'`,
        }
      }
    }
  }

  for (const qry of queries) {
    if (qry.from_events) {
      const dup = findDuplicate(qry.from_events)
      if (dup) {
        return {
          success: false,
          error: `Duplicate event name '${dup}' in from_events of query '${qry.name}'`,
        }
      }
    }
  }

  if (screen.reads) {
    const dup = findDuplicate(screen.reads)
    if (dup) {
      return { success: false, error: `Duplicate query name '${dup}' in screen.reads` }
    }
    const queryNameSet = new Set(queryNames.map(normalizeName))
    for (const readsName of screen.reads) {
      if (!queryNameSet.has(normalizeName(readsName))) {
        return {
          success: false,
          error: `Unknown query name in screen.reads: '${readsName}'`,
        }
      }
    }
  }

  if (screen.executes) {
    const dup = findDuplicate(screen.executes)
    if (dup) {
      return { success: false, error: `Duplicate command name '${dup}' in screen.executes` }
    }
    const commandNameSet = new Set(commandNames.map(normalizeName))
    for (const execName of screen.executes) {
      if (!commandNameSet.has(normalizeName(execName))) {
        return {
          success: false,
          error: `Unknown command name in screen.executes: '${execName}'`,
        }
      }
    }
  }

  const gwt: ImportGwt[] = []
  if (doc.gwt) {
    const gwtEntries = doc.gwt as Record<string, unknown>[]
    for (let i = 0; i < gwtEntries.length; i++) {
      const g = gwtEntries[i]
      if (typeof g !== 'object' || g === null || Array.isArray(g)) {
        return { success: false, error: `gwt[${i}] is missing a required "name" field` }
      }
      if (!g.name || typeof g.name !== 'string') {
        return { success: false, error: `gwt[${i}] is missing a required "name" field` }
      }

      const validGwtItemTypes = ['command', 'event', 'query', 'error']

      const parseGwtItems = (
        items: unknown[] | undefined,
        section: string,
      ): ImportGwtItem[] | string => {
        if (!items) return []
        for (let j = 0; j < items.length; j++) {
          const item = items[j] as Record<string, unknown>
          if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            return `gwt[${i}].${section}[${j}] is missing a required "name" field`
          }
          if (!item.name || typeof item.name !== 'string') {
            return `gwt[${i}].${section}[${j}] is missing a required "name" field`
          }
          if (!item.type || typeof item.type !== 'string') {
            return `gwt[${i}].${section}[${j}] is missing a required "type" field`
          }
          if (!validGwtItemTypes.includes(item.type as string)) {
            return `gwt[${i}].${section}[${j}] has invalid "type": "${item.type}". Must be one of: ${validGwtItemTypes.join(', ')}`
          }
        }
        return items.map((item) => {
          const it = item as Record<string, unknown>
          return {
            name: it.name as string,
            type: it.type as ImportGwtItem['type'],
            ...(it.fields !== undefined && { fields: it.fields as string }),
          }
        })
      }

      const given = parseGwtItems(g.given as unknown[] | undefined, 'given')
      if (typeof given === 'string') return { success: false, error: given }
      const when = parseGwtItems(g.when as unknown[] | undefined, 'when')
      if (typeof when === 'string') return { success: false, error: when }
      const then = parseGwtItems(g.then as unknown[] | undefined, 'then')
      if (typeof then === 'string') return { success: false, error: then }

      gwt.push({
        name: g.name as string,
        ...(g.description !== undefined && { description: g.description as string }),
        given,
        when,
        then,
      })
    }
  }

  const data: ImportData = {
    slice: doc.slice as string,
    screen,
    ...(commands.length > 0 && { commands }),
    ...(queries.length > 0 && { queries }),
    ...(gwt.length > 0 && { gwt }),
  }

  return { success: true, data, warnings }
}
