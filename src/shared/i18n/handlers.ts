import type { MessageHandlerContext } from '../../features/open-plugin-panel/handlers'

export async function handleGetLocale(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const locale = await figma.clientStorage.getAsync('locale')
  figma.ui.postMessage({
    type: 'locale-loaded',
    payload: { locale },
  })
}

export async function handleSetLocale(
  payload: { locale: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  await figma.clientStorage.setAsync('locale', payload.locale)
}
