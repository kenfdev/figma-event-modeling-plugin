import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpdateCustomFields } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleUpdateCustomFields', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('stores custom fields text in plugin data', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateCustomFields(
      { id: 'node-1', customFields: 'field1: value1\nfield2: value2' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      'customFields',
      'field1: value1\nfield2: value2'
    )
  })

  it('allows empty custom fields', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleUpdateCustomFields(
      { id: 'node-1', customFields: '' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('customFields', '')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleUpdateCustomFields(
      { id: 'nonexistent', customFields: 'some text' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })
})
