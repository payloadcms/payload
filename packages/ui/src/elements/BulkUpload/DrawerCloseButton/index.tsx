'use client'
import React from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'drawer-close-button'

type Props = {
  readonly onClick: () => void
  readonly slug: string
}
export function DrawerCloseButton({ slug, onClick }: Props) {
  const { t } = useTranslation()

  return (
    <button
      aria-label={t('general:close')}
      className={baseClass}
      id={`close-drawer__${slug}`}
      onClick={onClick}
      type="button"
    >
      <XIcon />
    </button>
  )
}
