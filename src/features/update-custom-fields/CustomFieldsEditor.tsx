import { useState, useEffect } from 'react'
import { deserializeFields, serializeFields, type CustomField } from './field-utils'

interface CustomFieldsEditorProps {
  fields: string
  onFieldsChange: (yaml: string) => void
}

export function CustomFieldsEditor({ fields, onFieldsChange }: CustomFieldsEditorProps) {
  const [rows, setRows] = useState<CustomField[]>(() => deserializeFields(fields))

  useEffect(() => {
    setRows(deserializeFields(fields))
  }, [fields])

  const handleAddRow = () => {
    const newRows = [...rows, { name: '', type: '' }]
    setRows(newRows)
    onFieldsChange(serializeFields(newRows))
  }

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)
    onFieldsChange(serializeFields(newRows))
  }

  const handleMoveRowUp = (index: number) => {
    if (index === 0) return
    const newRows = [...rows]
    ;[newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]]
    setRows(newRows)
    onFieldsChange(serializeFields(newRows))
  }

  const handleMoveRowDown = (index: number) => {
    if (index === rows.length - 1) return
    const newRows = [...rows]
    ;[newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]]
    setRows(newRows)
    onFieldsChange(serializeFields(newRows))
  }

  const handleNameChange = (index: number, name: string) => {
    const newRows = rows.map((row, i) => (i === index ? { ...row, name } : row))
    setRows(newRows)
  }

  const handleTypeChange = (index: number, type: string) => {
    const newRows = rows.map((row, i) => (i === index ? { ...row, type } : row))
    setRows(newRows)
  }

  const handleBlur = () => {
    onFieldsChange(serializeFields(rows))
  }

  return (
    <div className="custom-fields-editor">
      {rows.map((row, index) => (
        <div key={index} className="custom-field-row">
          <input
            type="text"
            className="custom-field-input"
            value={row.name}
            onChange={(e) => handleNameChange(index, e.target.value)}
            onBlur={handleBlur}
            placeholder="Field name"
            aria-label="Field name"
          />
          <input
            type="text"
            className="custom-field-input"
            value={row.type}
            onChange={(e) => handleTypeChange(index, e.target.value)}
            onBlur={handleBlur}
            placeholder="Type"
            aria-label="Field type"
          />
          <button
            type="button"
            className="custom-field-btn"
            onClick={() => handleMoveRowUp(index)}
            disabled={index === 0}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="custom-field-btn"
            onClick={() => handleMoveRowDown(index)}
            disabled={index === rows.length - 1}
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="custom-field-btn custom-field-btn--delete"
            onClick={() => handleDeleteRow(index)}
            aria-label="Delete"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="custom-fields-add-btn"
        onClick={handleAddRow}
      >
        + Add Field
      </button>
    </div>
  )
}
