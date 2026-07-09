'use client'
import React from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { Button } from '../../Button/index.js'
import { useModal } from '../../Modal/index.js'
import { useDialogContext } from '../context.js'
import { DialogTitle } from '../DialogTitle/index.js'

const baseClass = 'dialog'

export type DialogHeaderProps = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly onClose?: ({ modalSlug }: { modalSlug: string }) => void
  readonly showClose?: boolean
  readonly title?: React.ReactNode
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className,
  onClose,
  showClose,
  title,
}) => {
  const { slug, isConfirming } = useDialogContext()
  const { closeModal } = useModal()

  if (!title && !children && !showClose) {
    return null
  }

  return (
    <div
      className={[`${baseClass}__header`, showClose && `${baseClass}__header--has-close`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {title ? typeof title === 'string' ? <DialogTitle title={title} /> : title : null}
      <div className={`${baseClass}__header-end`}>
        {children ? <div className={`${baseClass}__header-extras`}>{children}</div> : null}
        {showClose ? (
          <Button
            aria-label="Close"
            buttonStyle="ghost"
            disabled={isConfirming}
            icon={<XIcon />}
            margin={false}
            onClick={() => {
              if (onClose) {
                onClose({ modalSlug: slug })
              } else {
                closeModal(slug)
              }
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
