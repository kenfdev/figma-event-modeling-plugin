import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

export const SCREEN_ACTORS_PLUGIN_DATA_KEY = 'actors'

export const UPDATE_SCREEN_ACTORS_SUCCESS = 'update-screen-actors-success'
export const UPDATE_SCREEN_ACTORS_ERROR = 'update-screen-actors-error'

interface UpdateScreenActorsPayload {
  id: string
  actors: string[]
}

export function serializeActors(actors: string[]): string {
  return JSON.stringify(actors)
}

export function deserializeActors(raw: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export async function handleUpdateScreenActors(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  try {
    const { id, actors } = payload as UpdateScreenActorsPayload

    const node = await figma.getNodeByIdAsync(id)
    if (!node) {
      figma.ui.postMessage({
        type: UPDATE_SCREEN_ACTORS_ERROR,
        payload: { message: 'Node not found' },
      })
      return
    }

    if (node.getPluginData('type') !== 'screen') {
      figma.ui.postMessage({
        type: UPDATE_SCREEN_ACTORS_ERROR,
        payload: { message: 'Not a user-screen' },
      })
      return
    }

    const normalized = actors.map((a) => a.trim()).filter((a) => a !== '')

    if (normalized.length === 0) {
      node.setPluginData(SCREEN_ACTORS_PLUGIN_DATA_KEY, '')
    } else {
      node.setPluginData(SCREEN_ACTORS_PLUGIN_DATA_KEY, serializeActors(normalized))
    }

    figma.ui.postMessage({
      type: UPDATE_SCREEN_ACTORS_SUCCESS,
      payload: { actors: normalized },
    })
  } catch (error) {
    figma.ui.postMessage({
      type: UPDATE_SCREEN_ACTORS_ERROR,
      payload: { message: String(error) },
    })
  }
}
