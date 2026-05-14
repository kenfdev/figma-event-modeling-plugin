import { useTranslation } from '../../shared/i18n'
import {
  MARK_AS_SCREEN_MESSAGE,
  REVERT_SCREEN_MESSAGE,
} from './handlers'

export interface MarkImageAsScreenProps {
  hasPlainImages: boolean
  hasScreenImages: boolean
}

export function MarkImageAsScreen({
  hasPlainImages,
  hasScreenImages,
}: MarkImageAsScreenProps) {
  const { t } = useTranslation()

  const handleMark = () => {
    parent.postMessage(
      { pluginMessage: { type: MARK_AS_SCREEN_MESSAGE } },
      '*'
    )
  }

  const handleRevert = () => {
    parent.postMessage(
      { pluginMessage: { type: REVERT_SCREEN_MESSAGE } },
      '*'
    )
  }

  return (
    <div className="mark-image-as-screen">
      <button
        type="button"
        className="mark-image-as-screen-button"
        onClick={handleMark}
        disabled={!hasPlainImages}
      >
        {t('buttons.markAsScreen')}
      </button>
      <button
        type="button"
        className="mark-image-as-screen-button"
        onClick={handleRevert}
        disabled={!hasScreenImages}
      >
        {t('buttons.revertScreen')}
      </button>
    </div>
  )
}
