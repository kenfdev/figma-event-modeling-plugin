import { useEffect, useState } from 'react'
import { useTranslation } from '../../shared/i18n'

interface ScreenActorsEditorProps {
  actors: string[]
  onActorsChange: (actors: string[]) => void
}

function normalize(rows: string[]): string[] {
  return rows.map((r) => r.trim()).filter((r) => r !== '')
}

export function ScreenActorsEditor({ actors, onActorsChange }: ScreenActorsEditorProps) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<string[]>(actors)

  useEffect(() => {
    setRows(actors)
  }, [actors])

  const handleAdd = () => {
    setRows([...rows, ''])
  }

  const handleDelete = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)
    onActorsChange(normalize(newRows))
  }

  const handleNameChange = (index: number, value: string) => {
    setRows(rows.map((row, i) => (i === index ? value : row)))
  }

  const handleBlur = () => {
    onActorsChange(normalize(rows))
  }

  return (
    <div className="screen-actors-editor">
      {rows.map((row, index) => (
        <div key={index} className="screen-actors-row">
          <input
            type="text"
            className="screen-actors-input"
            value={row}
            onChange={(e) => handleNameChange(index, e.target.value)}
            onBlur={handleBlur}
            placeholder={t('editor.actorNamePlaceholder')}
            aria-label={t('editor.actorName')}
          />
          <button
            type="button"
            className="screen-actors-btn screen-actors-btn--delete"
            onClick={() => handleDelete(index)}
            aria-label={t('buttons.deleteActor')}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="screen-actors-add-btn"
        onClick={handleAdd}
      >
        {t('buttons.addActor')}
      </button>
    </div>
  )
}
