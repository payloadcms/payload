'use client'
import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useModal } from '../../Modal/index.js'
import { useDialogContext } from '../context.js'

export type DialogCancelProps = {
  readonly label?: string
  readonly onClick?: () => void
}

export const DialogCancel: React.FC<DialogCancelProps> = ({ label, onClick }) => {
  const { slug, isConfirming } = useDialogContext()
  const { closeModal } = useModal()
  const { t } = useTranslation()

  const handleClick = () => {
    if (isConfirming) {
      return
    }
    closeModal(slug)
    onClick?.()
  }

  return (
    <Button
      buttonStyle="secondary"
      data-dialog-action="cancel"
      disabled={isConfirming}
      id={`${slug}-cancel`}
      margin={false}
      onClick={handleClick}
      size="medium"
    >
      {label ?? t('general:cancel')}
    </Button>
  )
}
