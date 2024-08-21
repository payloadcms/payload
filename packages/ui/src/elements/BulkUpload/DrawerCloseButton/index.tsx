'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { discardBulkUploadModalSlug } from '../DiscardWithoutSaving/index.js'
import './index.scss'

const baseClass = 'drawer-close-button'

type Props = {
  readonly slug: string
}
export function DrawerCloseButton({ slug }: Props) {
  const { t } = useTranslation()
  const { openModal } = useModal()

  return (
    <button
      aria-label={t('general:close')}
      className={baseClass}
      id={`close-drawer__${slug}`}
      onClick={() => openModal(discardBulkUploadModalSlug)}
      type="button"
    >
      <XIcon />
    </button>
  )
}
