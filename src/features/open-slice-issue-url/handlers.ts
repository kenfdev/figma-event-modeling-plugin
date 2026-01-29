import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface OpenSliceIssueUrlPayload {
  url: string
}

export async function handleOpenSliceIssueUrl(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { url } = payload as OpenSliceIssueUrlPayload

  if (!url) {
    return
  }

  await figma.openExternal(url)
}
