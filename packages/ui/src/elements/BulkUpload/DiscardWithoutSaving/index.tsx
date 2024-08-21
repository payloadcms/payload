'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { FullscreenModal } from '../../FullscreenModal/index.js'
import { drawerSlug } from '../index.js'

export const discardBulkUploadModalSlug = 'bulk-upload--discard-without-saving'
const baseClass = 'leave-without-saving'

export function DiscardWithoutSaving() {
  const { t } = useTranslation()
  const editDepth = useEditDepth()
  const { closeModal } = useModal()

  const onCancel = React.useCallback(() => {
    closeModal(discardBulkUploadModalSlug)
  }, [closeModal])

  const onConfirm = React.useCallback(() => {
    closeModal(drawerSlug)
    closeModal(discardBulkUploadModalSlug)
  }, [closeModal])

  return (
    <FullscreenModal
      className={baseClass}
      slug={discardBulkUploadModalSlug}
      style={{
        zIndex: `calc(100 + ${editDepth || 0} + 1)`,
      }}
    >
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:leaveWithoutSaving')}</h1>
          <p>{t('general:changesNotSaved')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={onCancel} size="large">
            {t('general:stayOnThisPage')}
          </Button>
          <Button onClick={onConfirm} size="large">
            {t('general:leaveAnyway')}
          </Button>
        </div>
      </div>
    </FullscreenModal>
  )
}
