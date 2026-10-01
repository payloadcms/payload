'use client'
import type { TypeWithVersion } from 'payload'

import React from 'react'

import { Pill } from '../../../../elements/Pill/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { VersionPillLabel } from '../../VersionPillLabel/VersionPillLabel.js'
import './index.css'

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
