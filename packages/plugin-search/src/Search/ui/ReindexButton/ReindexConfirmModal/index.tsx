import { Button, Modal, useTranslation } from '@payloadcms/ui'

import './index.scss'

type Props = {
  onCancel: () => void
  onConfirm: () => void
  slug: string
}

const baseClass = 'reindex-confirm-modal'

export const ReindexConfirmModal = ({ slug, onCancel, onConfirm }: Props) => {
  const {
    i18n: { t },
  } = useTranslation()
  return (
    <Modal className={baseClass} slug={slug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:confirmReindex')}?</h1>
          <p>{t('general:confirmReindexDescription')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={onCancel} size="large">
            {t('general:cancel')}
          </Button>
          <Button onClick={onConfirm} size="large">
            {t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
