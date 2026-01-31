import { describe, it, expect, beforeEach } from 'vitest'
import { handleOpenSliceIssueUrl } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleOpenSliceIssueUrl', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('calls openExternal with the provided URL', async () => {
    await handleOpenSliceIssueUrl(
      { url: 'https://github.com/issues/123' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.openExternal).toHaveBeenCalledWith(
      'https://github.com/issues/123'
    )
  })

  it('works with any URL format without validation', async () => {
    await handleOpenSliceIssueUrl(
      { url: 'not-a-valid-url' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.openExternal).toHaveBeenCalledWith('not-a-valid-url')
  })

  it('does not call openExternal when URL is empty', async () => {
    await handleOpenSliceIssueUrl(
      { url: '' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.openExternal).not.toHaveBeenCalled()
  })
})
