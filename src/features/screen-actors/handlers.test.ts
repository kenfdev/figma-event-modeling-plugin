import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleUpdateScreenActors,
  serializeActors,
  deserializeActors,
  SCREEN_ACTORS_PLUGIN_DATA_KEY,
  UPDATE_SCREEN_ACTORS_SUCCESS,
  UPDATE_SCREEN_ACTORS_ERROR,
} from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('serializeActors / deserializeActors', () => {
  it('round-trips a non-empty list', () => {
    expect(deserializeActors(serializeActors(['Alice', 'Bob']))).toEqual([
      'Alice',
      'Bob',
    ])
  })

  it('returns an empty array for empty input', () => {
    expect(deserializeActors('')).toEqual([])
  })

  it('returns an empty array for malformed JSON', () => {
    expect(deserializeActors('not-json')).toEqual([])
  })

  it('returns an empty array when parsed value is not an array', () => {
    expect(deserializeActors(JSON.stringify({ foo: 'bar' }))).toEqual([])
  })

  it('filters out non-string entries', () => {
    expect(deserializeActors(JSON.stringify(['Alice', 42, null, 'Bob']))).toEqual(
      ['Alice', 'Bob']
    )
  })
})

describe('handleUpdateScreenActors', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('stores serialized actors and posts success when list is non-empty on a user-screen', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['Alice', 'Bob'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      SCREEN_ACTORS_PLUGIN_DATA_KEY,
      JSON.stringify(['Alice', 'Bob'])
    )
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_SUCCESS,
      payload: { actors: ['Alice', 'Bob'] },
    })
  })

  it('clears the actors key and posts success when list becomes empty', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: [] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      SCREEN_ACTORS_PLUGIN_DATA_KEY,
      ''
    )
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_SUCCESS,
      payload: { actors: [] },
    })
  })

  it('trims and filters empty strings before persisting', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['', '  Alice  ', '', 'Bob'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      SCREEN_ACTORS_PLUGIN_DATA_KEY,
      JSON.stringify(['Alice', 'Bob'])
    )
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_SUCCESS,
      payload: { actors: ['Alice', 'Bob'] },
    })
  })

  it('clears the actors key when payload is only empty/whitespace strings', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['', '   '] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      SCREEN_ACTORS_PLUGIN_DATA_KEY,
      ''
    )
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_SUCCESS,
      payload: { actors: [] },
    })
  })

  it('posts an error when the node is not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleUpdateScreenActors(
      { id: 'missing', actors: ['Alice'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_ERROR,
      payload: { message: 'Node not found' },
    })
  })

  it('does not store actors on a processor (system-screen) and posts an error', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'processor' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['Alice'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).not.toHaveBeenCalled()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_ERROR,
      payload: { message: 'Not a user-screen' },
    })
  })

  it('does not store actors on non-screen elements and posts an error', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'command' : '')),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['Alice'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).not.toHaveBeenCalled()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_ERROR,
      payload: { message: 'Not a user-screen' },
    })
  })

  it('posts an error when an exception is thrown', async () => {
    figmaMock.getNodeByIdAsync.mockRejectedValue(new Error('boom'))

    await handleUpdateScreenActors(
      { id: 'node-1', actors: ['Alice'] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: UPDATE_SCREEN_ACTORS_ERROR,
      payload: { message: 'Error: boom' },
    })
  })
})
