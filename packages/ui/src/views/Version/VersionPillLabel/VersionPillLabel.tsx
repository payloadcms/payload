'use client'

import type { TypeWithVersion } from 'payload'

import React from 'react'

import { Pill } from '../../../elements/Pill/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { getVersionLabel } from './getVersionLabel.js'
import './index.css'

const baseClass = 'version-pill-label'

const statusModifierMap: Record<string, string> = {
  currentDraft: 'draft',
  currentlyPublished: 'published',
  draft: 'draft',
  previouslyPublished: 'previously-published',
  published: 'published',
}

const renderStatus = (label: React.ReactNode, name: string) => {
  const modifier = statusModifierMap[name] || 'draft'
  return <span className={`status-cell status-cell--${modifier}`}>{label}</span>
}

export const VersionPillLabel: React.FC<{
  currentlyPublishedVersion?: TypeWithVersion<any>
  disableDate?: boolean

  doc: {
    [key: string]: unknown
    id: number | string
    publishedLocale?: string
    updatedAt?: string
    version: {
      [key: string]: unknown
      _status: 'draft' | 'published'
      updatedAt: string
    }
  }
  /**
   * By default, the date is displayed first, followed by the version label.
   * @default false
   */
  labelFirst?: boolean
  labelOverride?: React.ReactNode
  /**
   * @default 'pill'
   */
  labelStyle?: 'pill' | 'text'
  labelSuffix?: React.ReactNode
  latestDraftVersion?: TypeWithVersion<any>
}> = ({
  currentlyPublishedVersion,
  disableDate = false,
  doc,
  labelFirst = false,
  labelOverride,
  labelStyle = 'pill',
  labelSuffix,
  latestDraftVersion,
}) => {
  const {
    config: {
      admin: { dateFormat },
      localization,
    },
  } = useConfig()
  const { i18n, t } = useTranslation()
  const { code: currentLocale } = useLocale()

  const { name, label } = getVersionLabel({
    currentLocale,
    currentlyPublishedVersion,
    latestDraftVersion,
    t,
    version: doc,
  })
  const labelText: React.ReactNode = (
    <span>
      {labelOverride || label}
      {labelSuffix}
    </span>
  )

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
            renderStatus(labelText, name)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
          {labelStyle === 'pill' ? (
            renderStatus(labelText, name)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
        </React.Fragment>
      )}
      {localeLabel && <Pill size="small">{localeLabel}</Pill>}
    </div>
  )
}
