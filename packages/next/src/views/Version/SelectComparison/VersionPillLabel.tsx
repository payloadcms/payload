'use client'

import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { useMemo } from 'react'

import { renderPill } from '../../Versions/cells/AutosaveCell/index.js'

export const VersionPillLabel: React.FC<{
  doc: any
  hasPublishedDoc: boolean
  latestDraftVersionID: string
  latestPublishedVersionID: string
}> = (args) => {
  const { doc, hasPublishedDoc, latestDraftVersionID, latestPublishedVersionID } = args

  const {
    config: {
      admin: { dateFormat },
      localization,
    },
  } = useConfig()
  const { i18n, t } = useTranslation()

  const status = doc.version._status
  let publishedLocalePill = null
  const publishedLocale = doc.publishedLocale || undefined

  const versionInfo = useMemo(() => {
    return {
      draft: {
        currentLabel: t('version:currentDraft'),
        latestVersion: latestDraftVersionID,
        pillStyle: undefined,
        previousLabel: t('version:draft'),
      },
      published: {
        currentLabel: t('version:currentlyPublished'),
        // The latest published version does not necessarily equal the current published version,
        // because the latest published version might have been unpublished in the meantime.
        // Hence, we should only use the latest published version if there is a published document.
        latestVersion: hasPublishedDoc ? latestPublishedVersionID : undefined,
        pillStyle: 'success',
        previousLabel: t('version:previouslyPublished'),
      },
    }
  }, [hasPublishedDoc, latestDraftVersionID, latestPublishedVersionID, t])

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
    <div className={`version-pill-label`}>
      {formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })}
      &nbsp;&nbsp;
      {renderPill(doc, latestVersion, currentLabel, previousLabel, pillStyle)}
      {publishedLocalePill}
    </div>
  )
}
