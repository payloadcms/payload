import { createLocalReq, type DefaultServerCellComponentProps } from 'payload'
import React from 'react'

import { AllLocaleStatusCellClient } from './index.client.js'

export const AllLocaleStatusCell = async ({ cellData, payload }: DefaultServerCellComponentProps) => {
  const { localization } = payload.config
  const req = await createLocalReq({}, payload)

  let availableLocales: string[] = []


  if (localization) {
    const filtered =
      (await localization.filterAvailableLocales?.({
        locales: localization.locales,
        req,
      })) ?? localization.locales

    availableLocales = filtered.map((locale) => locale.code)
  }

  return (
    <AllLocaleStatusCellClient
      availableLocales={availableLocales}
      data={cellData}
    />
  )
}
