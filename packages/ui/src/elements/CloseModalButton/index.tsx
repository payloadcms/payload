import { useModal } from '@faceless-ui/modal'

import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'close-modal-button'

export function CloseModalButton({ slug, className }: { className?: string; slug: string }) {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  return (
    <Button
      aria-label={t('general:close')}
      buttonStyle="ghost"
      className={[baseClass, className].filter(Boolean).join(' ')}
      icon={<XIcon size={24} />}
      key="close-button"
      onClick={() => {
        closeModal(slug)
      }}
    />
  )
}
