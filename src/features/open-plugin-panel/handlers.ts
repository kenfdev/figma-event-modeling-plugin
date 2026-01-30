import type { PluginMessage } from '../../shared/types/plugin'

export interface MessageHandlerContext {
  figma: typeof figma
}

export type MessageHandler = (
  payload: unknown,
  context: MessageHandlerContext
) => void | Promise<void>

const handlers: Record<string, MessageHandler> = {
  close: (_payload, { figma }) => {
    figma.closePlugin()
  },
  'resize-panel': (payload, { figma }) => {
    const { width, height } = payload as { width: number; height: number }
    figma.ui.resize(Math.round(width), Math.round(height))
  },
}

export function createMessageRouter(context: MessageHandlerContext) {
  return async (msg: PluginMessage) => {
    const handler = handlers[msg.type]
    if (handler) {
      await handler(msg.payload, context)
    } else {
      console.log('Unknown message type:', msg.type)
    }
  }
}

export function registerHandler(type: string, handler: MessageHandler) {
  handlers[type] = handler
}
