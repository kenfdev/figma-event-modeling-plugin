import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleCreateGWT } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

function createMockSection(id: string) {
  return {
    id,
    name: '',
    x: 0,
    y: 0,
    width: 280,
    height: 40,
    resizeWithoutConstraints: vi.fn(),
    fills: [],
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ''),
    appendChild: vi.fn(),
  }
}

describe('handleCreateGWT', () => {
  let figmaMock: FigmaMock
  let sections: ReturnType<typeof createMockSection>[]

  beforeEach(() => {
    sections = []
    figmaMock = createFigmaMock()
    figmaMock.createSection.mockImplementation(() => {
      const section = createMockSection(`section-${sections.length}`)
      sections.push(section)
      return section
    })
  })

  it('creates a parent section and three child sections', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    // 1 parent + 3 children = 4 sections
    expect(figmaMock.createSection).toHaveBeenCalledTimes(4)
  })

  it('sets the parent section name to "GWT"', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(parent.name).toBe('GWT')
  })

  it('stores type "gwt" in parent plugin data', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(parent.setPluginData).toHaveBeenCalledWith('type', 'gwt')
  })

  it('resizes parent section to 400×600px', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(parent.resizeWithoutConstraints).toHaveBeenCalledWith(400, 600)
  })

  it('positions parent section centered at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }

    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(parent.x).toBe(500 - 400 / 2)
    expect(parent.y).toBe(300 - 600 / 2)
  })

  it('appends the parent section to the current page', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(parent)
  })

  it('creates three child sections named Given, When, Then', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(sections[1].name).toBe('Given')
    expect(sections[2].name).toBe('When')
    expect(sections[3].name).toBe('Then')
  })

  it('resizes each child section to 350×180px', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    for (let i = 1; i <= 3; i++) {
      expect(sections[i].resizeWithoutConstraints).toHaveBeenCalledWith(350, 180)
    }
  })

  it('centers child sections horizontally and distributes vertically', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const childX = (400 - 350) / 2 // 25
    const gap = 15

    expect(sections[1].x).toBe(childX)
    expect(sections[1].y).toBe(gap)

    expect(sections[2].x).toBe(childX)
    expect(sections[2].y).toBe(gap + 180 + gap)

    expect(sections[3].x).toBe(childX)
    expect(sections[3].y).toBe(gap + 2 * (180 + gap))
  })

  it('appends all child sections to the parent section', async () => {
    await handleCreateGWT(undefined, { figma: figmaMock as unknown as typeof figma })

    const parent = sections[0]
    expect(parent.appendChild).toHaveBeenCalledTimes(3)
    expect(parent.appendChild).toHaveBeenCalledWith(sections[1])
    expect(parent.appendChild).toHaveBeenCalledWith(sections[2])
    expect(parent.appendChild).toHaveBeenCalledWith(sections[3])
  })
})
