'use client'
import type { TypeWithVersion } from 'payload'

import { Pill, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { VersionPillLabel } from '../../../Version/VersionPillLabel/VersionPillLabel.js'
import './index.scss'

const baseClass = 'autosave-cell'

type AutosaveCellProps = {
  currentlyPublishedVersion?: TypeWithVersion<any>
  latestDraftVersion?: TypeWithVersion<any>
  rowData: {
    autosave?: boolean
    id: number | string
    publishedLocale?: string
    updatedAt?: string
    version: {
      [key: string]: unknown
      _status: 'draft' | 'published'
      updatedAt: string
    }
  }
}

export const AutosaveCell: React.FC<AutosaveCellProps> = ({
  currentlyPublishedVersion,
  latestDraftVersion,
  rowData,
}) => {
  const { t } = useTranslation()

  return (
    <div className={`${baseClass}__items`}>
      {rowData?.autosave && <Pill size="small">{t('version:autosave')}</Pill>}
      <VersionPillLabel
        currentlyPublishedVersion={currentlyPublishedVersion}
        disableDate={true}
        doc={rowData}
        labelFirst={false}
        labelStyle="pill"
        latestDraftVersion={latestDraftVersion}
      />
    </div>
  )
}
