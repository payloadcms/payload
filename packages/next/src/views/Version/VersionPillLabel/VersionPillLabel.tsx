'use client'

import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'

import { getVersionLabel } from '../../Versions/cells/AutosaveCell/getVersionLabel.js'
import './index.scss'

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
    publishedLocale?: string
    version: {
      _status: string
      id: number | string
    }
  }
  /**
   * By default, the date is displayed first, followed by the version label.
   */
  labelFirst?: boolean
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
}> = (args) => {
  const {
    disableDate = false,
    doc,
    labelFirst,
    labelStyle = 'pill',
    latestDraftVersion,
    latestPublishedVersion,
  } = args

  const {
    config: {
      admin: { dateFormat },
      localization,
    },
  } = useConfig()
  const { i18n, t } = useTranslation()

  let publishedLocalePill = null
  const publishedLocale = doc.publishedLocale || undefined

  const { label, pillStyle } = getVersionLabel({
    latestDraftVersion,
    latestPublishedVersion,
    t,
    version: doc?.version,
  })

  if (localization && localization?.locales && publishedLocale) {
    const localeCode = Array.isArray(publishedLocale) ? publishedLocale[0] : publishedLocale

    const locale = localization.locales.find((loc) => loc.code === localeCode)
    const formattedLabel = locale?.label?.[i18n?.language] || locale?.label

    if (formattedLabel) {
      publishedLocalePill = <Pill>{formattedLabel}</Pill>
    }
  }

  const Label: React.ReactNode =
    labelStyle === 'pill' ? (
      renderPill(label, pillStyle)
    ) : (
      <span className={`${baseClass}-text`}>{label}</span>
    )

  const Date =
    disableDate !== true ? (
      <span className={`${baseClass}-date`}>
        {formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })}
      </span>
    ) : null

  if (labelFirst) {
    return (
      <div className={baseClass}>
        {Label}
        {Date}
        {publishedLocalePill}
      </div>
    )
  }

  return (
    <div className={baseClass}>
      {Date}
      {Label}
      {publishedLocalePill}
    </div>
  )
}
