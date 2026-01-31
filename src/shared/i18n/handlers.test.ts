import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFigmaMock, type FigmaMock } from '../test/mocks/figma'
import { handleGetLocale, handleSetLocale } from './handlers'

describe('handleGetLocale', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('reads locale from clientStorage', async () => {
    figmaMock.clientStorage.getAsync.mockResolvedValue('ja')

    await handleGetLocale(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.clientStorage.getAsync).toHaveBeenCalledWith('locale')
  })

  it('sends stored locale to UI when preference exists', async () => {
    figmaMock.clientStorage.getAsync.mockResolvedValue('ja')

    await handleGetLocale(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'locale-loaded',
      payload: { locale: 'ja' },
    })
  })

  it('sends null locale to UI when no preference is stored', async () => {
    figmaMock.clientStorage.getAsync.mockResolvedValue(undefined)

    await handleGetLocale(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'locale-loaded',
      payload: { locale: undefined },
    })
  })
})

describe('handleSetLocale', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('persists locale to clientStorage', async () => {
    figmaMock.clientStorage.setAsync.mockResolvedValue(undefined)

    await handleSetLocale({ locale: 'ja' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.clientStorage.setAsync).toHaveBeenCalledWith('locale', 'ja')
  })

  it('persists English locale to clientStorage', async () => {
    figmaMock.clientStorage.setAsync.mockResolvedValue(undefined)

    await handleSetLocale({ locale: 'en' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.clientStorage.setAsync).toHaveBeenCalledWith('locale', 'en')
  })
})
