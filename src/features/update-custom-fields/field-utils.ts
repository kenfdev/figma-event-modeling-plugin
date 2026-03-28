import yaml from 'js-yaml'

export interface CustomField {
  name: string
  type: string
}

export function serializeFields(fields: CustomField[]): string {
  if (fields.length === 0) {
    return ''
  }
  const obj = {
    fields: fields.map((f) => ({ [f.name]: f.type })),
  }
  return yaml.dump(obj)
}

export function deserializeFields(yamlStr: string): CustomField[] {
  if (!yamlStr || !yamlStr.trim()) {
    return []
  }
  try {
    const parsed = yaml.load(yamlStr)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return []
    }
    const doc = parsed as Record<string, unknown>
    if (!Array.isArray(doc.fields)) {
      return []
    }
    const results: CustomField[] = []
    for (const item of doc.fields) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return []
      }
      const obj = item as Record<string, unknown>
      const keys = Object.keys(obj)
      if (keys.length !== 1) {
        return []
      }
      const name = keys[0]
      const val = obj[name]
      if (typeof val !== 'string') {
        return []
      }
      results.push({ name, type: val })
    }
    return results
  } catch {
    return []
  }
}
