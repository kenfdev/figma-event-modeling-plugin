// Shared types for Event Modeling plugin

export type ElementType = 'event' | 'command' | 'view' | 'user' | 'system'

export interface ElementData {
  type: ElementType
  label: string
}

export interface PluginMessage {
  type: string
  payload?: unknown
}
