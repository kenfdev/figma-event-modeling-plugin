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
}

export function createMessageRouter(context: MessageHandlerContext) {
  return (msg: PluginMessage) => {
    const handler = handlers[msg.type]
    if (handler) {
      handler(msg.payload, context)
    } else {
      console.log('Unknown message type:', msg.type)
    }
  }
}

export function registerHandler(type: string, handler: MessageHandler) {
  handlers[type] = handler
}
