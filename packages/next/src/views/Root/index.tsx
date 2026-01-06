import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))

  return (
    <div style={{ position: 'relative' }}>
      <DefaultNav />
    </div>
  )
}
