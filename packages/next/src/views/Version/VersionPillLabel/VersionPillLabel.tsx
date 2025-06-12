'use client'

import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import React from 'react'

import './index.scss'
import { getVersionLabel } from './getVersionLabel.js'

const baseClass = 'version-pill-label'

const renderPill = (label: string, pillStyle: Parameters<typeof Pill>[0]['pillStyle']) => {
  return (
    <Pill pillStyle={pillStyle} size="small">
      {label}
    </Pill>
  )
}

export const VersionPillLabel: React.FC<{
  disableDate?: boolean
  doc: {
    [key: string]: any
    id: number | string
    publishedLocale?: string
    updatedAt?: string
    version: {
      [key: string]: any
      _status: string
    }
  }
  /**
   * By default, the date is displayed first, followed by the version label.
   * @default false
   */
  labelFirst?: boolean
  labelOverride?: string
  /**
   * @default 'pill'
   */
  labelStyle?: 'pill' | 'text'
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  latestPublishedVersion?: {
    id: number | string
    updatedAt: string
  }
}> = ({
  disableDate = false,
  doc,
  labelFirst = false,
  labelOverride,
  labelStyle = 'pill',
  latestDraftVersion,
  latestPublishedVersion,
}) => {
  const {
    config: {
      admin: { dateFormat },
      localization,
    },
  } = useConfig()
  const { i18n, t } = useTranslation()

  const { label, pillStyle } = getVersionLabel({
    latestDraftVersion,
    latestPublishedVersion,
    t,
    version: doc,
  })
  const labelText = labelOverride || label

  const showDate = !disableDate && doc.updatedAt
  const formattedDate = showDate
    ? formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })
    : null

  const localeCode = Array.isArray(doc.publishedLocale)
    ? doc.publishedLocale[0]
    : doc.publishedLocale

  const locale =
    localization && localization?.locales
      ? localization.locales.find((loc) => loc.code === localeCode)
      : null
  const localeLabel = locale ? locale?.label?.[i18n?.language] || locale?.label : null

  return (
    <div className={baseClass}>
      {labelFirst ? (
        <React.Fragment>
          {labelStyle === 'pill' ? (
            renderPill(labelText, pillStyle)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
          {labelStyle === 'pill' ? (
            renderPill(labelText, pillStyle)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
        </React.Fragment>
      )}
      {localeLabel && <Pill>{localeLabel}</Pill>}
    </div>
  )
}
