import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenActorsEditor } from './ScreenActorsEditor'
import { TranslationProvider } from '../../shared/i18n'

function renderEditor(ui: React.ReactElement) {
  return render(<TranslationProvider initialLocale="en">{ui}</TranslationProvider>)
}

describe('ScreenActorsEditor', () => {
  const onActorsChangeSpy = vi.fn()

  beforeEach(() => {
    onActorsChangeSpy.mockClear()
  })

  it('renders no rows when actors list is empty', () => {
    renderEditor(<ScreenActorsEditor actors={[]} onActorsChange={onActorsChangeSpy} />)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('renders one input per actor', () => {
    renderEditor(
      <ScreenActorsEditor actors={['Alice', 'Bob']} onActorsChange={onActorsChangeSpy} />
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue('Alice')
    expect(inputs[1]).toHaveValue('Bob')
  })

  it('appends an empty row when the add button is clicked without firing onActorsChange', async () => {
    const user = userEvent.setup()
    renderEditor(<ScreenActorsEditor actors={[]} onActorsChange={onActorsChangeSpy} />)
    await user.click(screen.getByRole('button', { name: /add actor/i }))
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(onActorsChangeSpy).not.toHaveBeenCalled()
  })

  it('does not persist an empty actor when add is followed by blur with no input', async () => {
    const user = userEvent.setup()
    renderEditor(<ScreenActorsEditor actors={[]} onActorsChange={onActorsChangeSpy} />)
    await user.click(screen.getByRole('button', { name: /add actor/i }))
    const input = screen.getByRole('textbox', { name: /actor name/i })
    input.focus()
    await user.tab()
    expect(onActorsChangeSpy).toHaveBeenCalledWith([])
  })

  it('trims whitespace and filters empties on blur', async () => {
    const user = userEvent.setup()
    renderEditor(
      <ScreenActorsEditor actors={['Alice']} onActorsChange={onActorsChangeSpy} />
    )
    const input = screen.getByRole('textbox', { name: /actor name/i })
    await user.clear(input)
    await user.type(input, '  Carol  ')
    await user.tab()
    expect(onActorsChangeSpy).toHaveBeenCalledWith(['Carol'])
  })

  it('removes the targeted row when delete is clicked', async () => {
    const user = userEvent.setup()
    renderEditor(
      <ScreenActorsEditor actors={['Alice', 'Bob']} onActorsChange={onActorsChangeSpy} />
    )
    const deleteButtons = screen.getAllByRole('button', { name: /delete actor/i })
    await user.click(deleteButtons[0])
    expect(onActorsChangeSpy).toHaveBeenCalledWith(['Bob'])
  })

  it('emits an empty list when the last actor is removed', async () => {
    const user = userEvent.setup()
    renderEditor(
      <ScreenActorsEditor actors={['Alice']} onActorsChange={onActorsChangeSpy} />
    )
    await user.click(screen.getByRole('button', { name: /delete actor/i }))
    expect(onActorsChangeSpy).toHaveBeenCalledWith([])
  })

  it('does not fire onActorsChange on every keystroke', async () => {
    const user = userEvent.setup()
    renderEditor(
      <ScreenActorsEditor actors={['Alice']} onActorsChange={onActorsChangeSpy} />
    )
    const input = screen.getByRole('textbox', { name: /actor name/i })
    await user.type(input, 'extra')
    expect(onActorsChangeSpy).not.toHaveBeenCalled()
  })

  it('fires onActorsChange with the edited value on blur', async () => {
    const user = userEvent.setup()
    renderEditor(
      <ScreenActorsEditor actors={['Alice']} onActorsChange={onActorsChangeSpy} />
    )
    const input = screen.getByRole('textbox', { name: /actor name/i })
    await user.clear(input)
    await user.type(input, 'Carol')
    await user.tab()
    expect(onActorsChangeSpy).toHaveBeenCalledWith(['Carol'])
  })

  it('replaces local state when the actors prop changes', () => {
    const { rerender } = renderEditor(
      <ScreenActorsEditor actors={['Alice']} onActorsChange={onActorsChangeSpy} />
    )
    rerender(
      <TranslationProvider initialLocale="en">
        <ScreenActorsEditor actors={['Bob', 'Carol']} onActorsChange={onActorsChangeSpy} />
      </TranslationProvider>
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue('Bob')
    expect(inputs[1]).toHaveValue('Carol')
  })
})
