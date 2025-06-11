'use client'
import { Pill, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { VersionPillLabel } from '../../../Version/VersionPillLabel/VersionPillLabel.js'

const baseClass = 'autosave-cell'

type AutosaveCellProps = {
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  latestPublishedVersion?: {
    id: number | string
    updatedAt: string
  }
  rowData?: {
    autosave?: boolean
    publishedLocale?: string
    version: {
      _status: string
      id: number | string
    }
  }
}

export const AutosaveCell: React.FC<AutosaveCellProps> = ({
  latestDraftVersion,
  latestPublishedVersion,
  rowData = { autosave: undefined, publishedLocale: undefined, version: undefined },
}) => {
  const { t } = useTranslation()

  return (
    <div className={`${baseClass}__items`}>
      {rowData?.autosave && <Pill>{t('version:autosave')}</Pill>}
      <VersionPillLabel
        disableDate={true}
        doc={rowData}
        labelFirst={false}
        labelStyle="pill"
        latestDraftVersion={latestDraftVersion}
        latestPublishedVersion={latestPublishedVersion}
      />
    </div>
  )
}
