import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface UpdateSliceIssueUrlPayload {
  id: string
  issueUrl: string
}

export async function handleUpdateSliceIssueUrl(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, issueUrl } = payload as UpdateSliceIssueUrlPayload

  const node = figma.getNodeById(id)
  if (!node) {
    return
  }

  node.setPluginData('issueUrl', issueUrl)
}
