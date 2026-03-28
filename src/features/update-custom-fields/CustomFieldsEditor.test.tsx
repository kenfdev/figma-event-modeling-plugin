import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomFieldsEditor } from './CustomFieldsEditor'
import { TranslationProvider } from '../../shared/i18n'
import { serializeFields } from './field-utils'

function renderCustomFieldsEditor(ui: React.ReactElement) {
  return render(
    <TranslationProvider initialLocale="en">
      {ui}
    </TranslationProvider>
  )
}

describe('CustomFieldsEditor', () => {
  const onFieldsChangeSpy = vi.fn()

  beforeEach(() => {
    onFieldsChangeSpy.mockClear()
  })

  describe('renders field rows from YAML string prop', () => {
    it('renders no rows for empty YAML string', () => {
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields="" onFieldsChange={onFieldsChangeSpy} />
      )
      const inputs = screen.queryAllByRole('textbox')
      expect(inputs).toHaveLength(0)
    })

    it('renders field rows from parsed YAML', () => {
      const yaml = serializeFields([
        { name: 'userId', type: 'string' },
        { name: 'amount', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(4)
      expect(inputs[0]).toHaveValue('userId')
      expect(inputs[1]).toHaveValue('string')
      expect(inputs[2]).toHaveValue('amount')
      expect(inputs[3]).toHaveValue('number')
    })
  })

  describe('add button appends empty row', () => {
    it('adds a new empty row when add button is clicked', async () => {
      const user = userEvent.setup()
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields="" onFieldsChange={onFieldsChangeSpy} />
      )
      const addButton = screen.getByRole('button', { name: /add field/i })
      await user.click(addButton)
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(2)
      expect(inputs[0]).toHaveValue('')
      expect(inputs[1]).toHaveValue('')
    })

    it('calls onFieldsChange immediately when add button is clicked', async () => {
      const user = userEvent.setup()
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields="" onFieldsChange={onFieldsChangeSpy} />
      )
      const addButton = screen.getByRole('button', { name: /add field/i })
      await user.click(addButton)
      expect(onFieldsChangeSpy).toHaveBeenCalledTimes(1)
      expect(onFieldsChangeSpy).toHaveBeenCalledWith(expect.stringContaining(": ''"))
    })
  })

  describe('delete removes target row', () => {
    it('removes the row when delete button is clicked', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(2)
      expect(inputs[0]).toHaveValue('field2')
      expect(inputs[1]).toHaveValue('number')
    })

    it('calls onFieldsChange immediately when delete button is clicked', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      expect(onFieldsChangeSpy).toHaveBeenCalledTimes(1)
      expect(onFieldsChangeSpy).toHaveBeenCalledWith('')
    })
  })

  describe('up/down arrows reorder rows', () => {
    it('moves row up when up button is clicked', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      await user.click(downButtons[0])
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveValue('field2')
      expect(inputs[1]).toHaveValue('number')
      expect(inputs[2]).toHaveValue('field1')
      expect(inputs[3]).toHaveValue('string')
    })

    it('moves row down when down button is clicked', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      await user.click(upButtons[1])
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveValue('field2')
      expect(inputs[1]).toHaveValue('number')
      expect(inputs[2]).toHaveValue('field1')
      expect(inputs[3]).toHaveValue('string')
    })

    it('calls onFieldsChange immediately when reorder button is clicked', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      await user.click(downButtons[0])
      expect(onFieldsChangeSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('up disabled on first row, down disabled on last row', () => {
    it('disables up button on first row', async () => {
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      expect(upButtons[0]).toBeDisabled()
      expect(upButtons[1]).not.toBeDisabled()
    })

    it('disables down button on last row', async () => {
      const yaml = serializeFields([
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      expect(downButtons[0]).not.toBeDisabled()
      expect(downButtons[1]).toBeDisabled()
    })

    it('disables both buttons when only one row exists', async () => {
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      expect(screen.getByRole('button', { name: /move up/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /move down/i })).toBeDisabled()
    })
  })

  describe('name/type inputs update row state', () => {
    it('updates row name when name input changes', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const nameInput = screen.getByRole('textbox', { name: /field name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'newFieldName')
      expect(nameInput).toHaveValue('newFieldName')
    })

    it('updates row type when type input changes', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const typeInput = screen.getByRole('textbox', { name: /field type/i })
      await user.clear(typeInput)
      await user.type(typeInput, 'number')
      expect(typeInput).toHaveValue('number')
    })
  })

  describe('onFieldsChange fires on blur with YAML string', () => {
    it('calls onFieldsChange with YAML when name input loses focus', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const nameInput = screen.getByRole('textbox', { name: /field name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'newName')
      await user.tab()
      expect(onFieldsChangeSpy).toHaveBeenCalledWith(expect.stringContaining('newName'))
    })

    it('calls onFieldsChange with YAML when type input loses focus', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const typeInput = screen.getByRole('textbox', { name: /field type/i })
      await user.clear(typeInput)
      await user.type(typeInput, 'boolean')
      await user.tab()
      expect(onFieldsChangeSpy).toHaveBeenCalledWith(expect.stringContaining('boolean'))
    })
  })

  describe('onFieldsChange fires immediately on add/delete/reorder', () => {
    it('does not fire on every keystroke', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const nameInput = screen.getByRole('textbox', { name: /field name/i })
      await user.type(nameInput, 'abc')
      expect(onFieldsChangeSpy).not.toHaveBeenCalled()
    })

    it('fires on blur but not during typing', async () => {
      const user = userEvent.setup()
      const yaml = serializeFields([{ name: 'field1', type: 'string' }])
      renderCustomFieldsEditor(
        <CustomFieldsEditor fields={yaml} onFieldsChange={onFieldsChangeSpy} />
      )
      const nameInput = screen.getByRole('textbox', { name: /field name/i })
      await user.type(nameInput, 'typedText')
      expect(onFieldsChangeSpy).not.toHaveBeenCalled()
      await user.tab()
      expect(onFieldsChangeSpy).toHaveBeenCalledTimes(1)
    })
  })
})
