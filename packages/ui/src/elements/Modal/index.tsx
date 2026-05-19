'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'

import './index.css'

export { Modal, useModal }

const baseClass = 'alert-modal'

export type AlertModalProps = {
  readonly actions?: React.ReactNode
  readonly children: React.ReactNode
  readonly className?: string
  readonly closeOnBlur?: boolean
  readonly compact?: boolean
  readonly headerActions?: React.ReactNode
  readonly onClose?: () => void
  readonly slug: string
  readonly title?: React.ReactNode
  readonly zIndex?: number
}

export const AlertModal: React.FC<AlertModalProps> = ({
  slug,
  actions,
  children,
  className,
  closeOnBlur = false,
  compact,
  headerActions,
  onClose,
  title,
  zIndex,
}) => {
  return (
    <Modal
      className={`${baseClass}${compact ? ` ${baseClass}--compact` : ''}${className ? ` ${className}` : ''}`}
      closeOnBlur={closeOnBlur}
      onClose={onClose}
      slug={slug}
      style={zIndex != null ? { zIndex } : undefined}
    >
      <div className={`${baseClass}__wrapper`}>
        {title || headerActions ? (
          <div
            className={`${baseClass}__header${headerActions ? ` ${baseClass}__header--with-actions` : ''}`}
          >
            {title ? <h4 className={`${baseClass}__title`}>{title}</h4> : null}
            {headerActions}
          </div>
        ) : null}
        <div className={`${baseClass}__content`}>{children}</div>
        {actions ? <div className={`${baseClass}__controls`}>{actions}</div> : null}
      </div>
    </Modal>
  )
}
