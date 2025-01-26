'use client'
import { Button, Modal, useModal, useTranslation } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'reset-preferences-modal'

export const ConfirmResetModal: React.FC<{
  readonly onConfirm: () => void
  readonly slug: string
}> = ({ slug, onConfirm }) => {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  const handleClose = () => closeModal(slug)

  const handleConfirm = () => {
    handleClose()
    if (typeof onConfirm === 'function') {
      onConfirm()
    }
  }

  return (
    <Modal className={baseClass} slug={slug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:resetPreferences')}?</h1>
          <p>{t('general:resetPreferencesDescription')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={handleClose} size="large">
            {t('general:cancel')}
          </Button>
          <Button onClick={handleConfirm} size="large">
            {t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
