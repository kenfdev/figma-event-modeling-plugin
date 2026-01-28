// Feature: open-plugin-panel
// Sandbox exports (message handlers) - import in src/main.ts only

export { createMessageRouter, registerHandler } from './handlers'
export type { MessageHandler, MessageHandlerContext } from './handlers'
export { initializePlugin } from './init'
export type { InitializePluginContext } from './init'
