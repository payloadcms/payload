import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import * as qs from 'qs-esm'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { Wrapper } from '../../templates/Default/Wrapper/index.js'
import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'

export const NotFoundPage = async ({
  config: configPromise,
  importMap,
  searchParams: searchParamsPromise,
}: {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise
  await new Promise((resolve) => setTimeout(resolve, 100))

  return (
    <Wrapper baseClass={'test'} className={'dewf'}>
      <DefaultNav config={config} importMap={importMap} />
    </Wrapper>
  )
}
