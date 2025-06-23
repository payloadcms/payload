'use client'
import { Pill, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { VersionPillLabel } from '../../../Version/VersionPillLabel/VersionPillLabel.js'

const baseClass = 'autosave-cell'

type AutosaveCellProps = {
  currentlyPublishedVersion?: {
    id: number | string
    updatedAt: string
  }
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  rowData: {
    autosave?: boolean
    id: number | string
    publishedLocale?: string
    version: {
      _status: string
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
