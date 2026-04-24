import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { createConnector } from '../../shared/figma/connectors'

export async function handleConnectElements(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const selection = figma.currentPage.selection

  if (selection.length !== 2) {
    figma.notify('Select exactly 2 elements to connect')
    return
  }

  createConnector(figma, selection[0], selection[1])
}