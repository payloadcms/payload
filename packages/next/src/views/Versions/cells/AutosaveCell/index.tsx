'use client'
import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'autosave-cell'

type AutosaveCellProps = {
  latestDraftVersion?: string
  latestPublishedVersion?: string
  rowData?: {
    autosave?: boolean
    publishedLocale?: string
    version: {
      _status?: string
    }
  }
}

export const renderPill = (data, latestVersion, currentLabel, previousLabel, pillStyle) => {
  return (
    <React.Fragment>
      {data?.id === latestVersion ? (
        <Pill pillStyle={pillStyle} size="small">
          {currentLabel}
        </Pill>
      ) : (
        <Pill size="small">{previousLabel}</Pill>
      )}
    </React.Fragment>
  )
}

export const AutosaveCell: React.FC<AutosaveCellProps> = ({
  latestDraftVersion,
  latestPublishedVersion,
  rowData = { autosave: undefined, publishedLocale: undefined, version: undefined },
}) => {
  const { i18n, t } = useTranslation()

  const {
    config: { localization },
  } = useConfig()

  const publishedLocale = rowData?.publishedLocale || undefined
  const status = rowData?.version._status
  let publishedLocalePill = null

  const versionInfo = {
    draft: {
      currentLabel: t('version:currentDraft'),
      latestVersion: latestDraftVersion,
      pillStyle: undefined,
      previousLabel: t('version:draft'),
    },
    published: {
      currentLabel: t('version:currentPublishedVersion'),
      latestVersion: latestPublishedVersion,
      pillStyle: 'success',
      previousLabel: t('version:previouslyPublished'),
    },
  }

  const { currentLabel, latestVersion, pillStyle, previousLabel } = versionInfo[status] || {}

  if (localization && localization?.locales && publishedLocale) {
    const localeCode = Array.isArray(publishedLocale) ? publishedLocale[0] : publishedLocale

    const locale = localization.locales.find((loc) => loc.code === localeCode)
    const formattedLabel = locale?.label?.[i18n?.language] || locale?.label

    if (formattedLabel) {
      publishedLocalePill = <Pill>{formattedLabel}</Pill>
    }
  }

  return (
    <div className={`${baseClass}__items`}>
      {rowData?.autosave && <Pill>{t('version:autosave')}</Pill>}
      {status && renderPill(rowData, latestVersion, currentLabel, previousLabel, pillStyle)}
      {publishedLocalePill}
    </div>
  )
}
