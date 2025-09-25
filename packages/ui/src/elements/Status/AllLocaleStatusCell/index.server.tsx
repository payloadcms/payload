import type { DefaultServerCellComponentProps, SanitizedLocalizationConfig } from 'payload'

import { createLocalReq } from 'payload'
import React from 'react'

import { Pill } from '../../Pill/index.js'
import './index.scss'

const baseClass = 'locale-status-cell'

export const AllLocaleStatusCell = async ({
  collectionConfig,
  payload,
  rowData,
}: DefaultServerCellComponentProps) => {
  const localization = payload.config.localization as SanitizedLocalizationConfig
  const req = await createLocalReq({}, payload)
  const fallbackStatus = rowData?._status

  const availableLocales =
    (await localization.filterAvailableLocales?.({
      locales: localization.locales,
      req,
    })) ?? localization.locales

  const selectLocales: Record<string, true> = {}
  availableLocales.forEach((locale) => {
    if (typeof locale === 'string') {
      selectLocales[locale] = true
    } else {
      selectLocales[locale.code] = true
    }
  })

  const versionStatus = await payload.db
    .findVersions({
      collection: collectionConfig.slug,
      limit: 1,
      select: {
        localeStatus: selectLocales,
      },
      where: {
        parent: {
          equals: rowData.id,
        },
      },
    })
    .then((result) => result.docs[0])

  if (!fallbackStatus && !versionStatus?.localeStatus) {
    return null
  }

  return (
    <div className={baseClass}>
      {availableLocales.map((locale) => {
        const status = versionStatus?.localeStatus?.[locale.code] || fallbackStatus

        return (
          <Pill
            key={locale.code}
            pillStyle={status === 'published' ? 'success' : 'light-gray'}
            size="small"
          >
            {locale.code}
          </Pill>
        )
      })}
    </div>
  )
}
