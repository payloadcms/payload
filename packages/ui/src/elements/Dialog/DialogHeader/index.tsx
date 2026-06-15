'use client'
import React from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { Button } from '../../Button/index.js'
import { useModal } from '../../Modal/index.js'
import { useDialogContext } from '../context.js'

const baseClass = 'dialog'

export type DialogHeaderProps = {
  readonly children?: React.ReactNode
  readonly showClose?: boolean
  readonly title?: React.ReactNode
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, showClose, title }) => {
  const { slug, isConfirming } = useDialogContext()
  const { closeModal } = useModal()

  if (!title && !children && !showClose) {
    return null
  }

  return (
    <div
      className={[`${baseClass}__header`, showClose && `${baseClass}__header--has-close`]
        .filter(Boolean)
        .join(' ')}
    >
      {title ? <h4 className={`${baseClass}__title`}>{title}</h4> : null}
      {children ? <div className={`${baseClass}__header-extras`}>{children}</div> : null}
      {showClose ? (
        <Button
          aria-label="Close"
          buttonStyle="ghost"
          disabled={isConfirming}
          icon={<XIcon />}
          margin={false}
          onClick={() => closeModal(slug)}
        />
      ) : null}
    </div>
  )
}
