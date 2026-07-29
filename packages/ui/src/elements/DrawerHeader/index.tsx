'use client'

import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'bulk-upload--drawer-header'

type Props = {
  readonly BeforeDocumentMeta?: React.ReactNode
  readonly onClose: () => void
  readonly title: string
}
export function DrawerHeader({ BeforeDocumentMeta, onClose, title }: Props) {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <Button
        aria-label={t('general:close')}
        buttonStyle="ghost"
        icon={<ChevronIcon direction="left" size={24} />}
        onClick={onClose}
      />
      <h2 title={title}>{title}</h2>
      {BeforeDocumentMeta ? <div className={`${baseClass}__meta`}>{BeforeDocumentMeta}</div> : null}
    </div>
  )
}
