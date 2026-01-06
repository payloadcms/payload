import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { Wrapper } from '../../templates/Default/Wrapper/index.js'
export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise

  await new Promise((resolve) => setTimeout(resolve, 300))

  return (
    <div style={{ position: 'relative' }}>
      <Wrapper baseClass={'test'} className={'dewf'}>
        <DefaultNav config={config} importMap={importMap} />
      </Wrapper>
    </div>
  )
}
