'use client'
import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useModal } from '../../Modal/index.js'
import { useDialogContext } from '../context.js'

export type DialogConfirmProps = {
  readonly label?: string
  readonly loadingLabel?: string
  readonly onClick: () => Promise<void> | void
}

export const DialogConfirm: React.FC<DialogConfirmProps> = ({ label, loadingLabel, onClick }) => {
  const { slug, isConfirming, setConfirming } = useDialogContext()
  const { closeModal } = useModal()
  const { t } = useTranslation()

  const handleClick = async () => {
    if (isConfirming) {
      return
    }
    setConfirming(true)
    await onClick()
    setConfirming(false)
    closeModal(slug)
  }

  const resolvedLabel = label ?? t('general:confirm')

  return (
    <Button
      data-dialog-action="confirm"
      disabled={isConfirming}
      id={`${slug}-confirm`}
      margin={false}
      onClick={handleClick}
      size="medium"
    >
      {isConfirming && loadingLabel ? loadingLabel : resolvedLabel}
    </Button>
  )
}
