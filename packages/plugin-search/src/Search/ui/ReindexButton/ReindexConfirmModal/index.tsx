import { Button, Modal, useTranslation } from '@payloadcms/ui'

import './index.scss'

type Props = {
  description: string
  onCancel: () => void
  onConfirm: () => void
  slug: string
  title: string
}

const baseClass = 'reindex-confirm-modal'

export const ReindexConfirmModal = ({ slug, description, onCancel, onConfirm, title }: Props) => {
  const {
    i18n: { t },
  } = useTranslation()
  return (
    <Modal className={baseClass} slug={slug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{title}</h1>
          <p>{description}</p>
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
