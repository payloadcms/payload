import type { DefaultServerCellComponentProps, SanitizedLocalizationConfig } from 'payload'

import { createLocalReq } from 'payload'
import React from 'react'

import { Pill } from '../../Pill/index.js'
import './index.scss'

const baseClass = 'locale-status-cell'

export const AllLocaleStatusCell = async ({
  cellData,
  payload,
  rowData,
}: DefaultServerCellComponentProps) => {
  const localization = payload.config.localization as SanitizedLocalizationConfig
  const req = await createLocalReq({}, payload)

  const availableLocale =
    (await localization.filterAvailableLocales?.({
      locales: localization.locales,
      req,
    })) ?? localization.locales

  const fallbackStatus = rowData?._status
  if (!cellData && !fallbackStatus) {
    return null
  }

  return (
    <div className={baseClass}>
      {availableLocale.map((locale) => {
        const status = cellData[locale.code] || fallbackStatus

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
