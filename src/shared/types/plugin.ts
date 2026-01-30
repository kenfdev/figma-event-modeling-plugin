// Shared types for Event Modeling plugin

export type ElementType = 'command' | 'event' | 'query' | 'actor' | 'error'

export type StructuralType = 'lane' | 'chapter' | 'processor' | 'screen'

export type SectionType = 'slice' | 'gwt'

export interface ElementData {
  type: ElementType | StructuralType | SectionType
  label: string
}

export interface PluginMessage {
  type: string
  payload?: unknown
}

// Message types for UI-to-Sandbox communication
export type MessageType =
  | 'close'
  | 'create-element'

export interface CreateElementPayload {
  elementType: ElementType | StructuralType | SectionType
}
