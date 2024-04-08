import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { getNextI18n } from '@payloadcms/next/utilities'
import { HydrateClientUser } from '@payloadcms/ui/elements/HydrateClientUser'
import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import React, { Fragment } from 'react'

import { initPage } from '../../utilities/initPage.js'
import { NotFoundClient } from './index.client.js'

export const generatePageMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: { [key: string]: string | string[] }
  //eslint-disable-next-line @typescript-eslint/require-await
}): Promise<Metadata> => {
  const config = await configPromise

  const i18n = getNextI18n({
    config,
  })

  return {
    title: i18n.t('general:notFound'),
  }
}

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18n
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const NotFoundPage = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const initPageResult = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: true,
    route: '/not-found',
    searchParams,
  })

  return (
    <Fragment>
      <HydrateClientUser permissions={initPageResult.permissions} user={initPageResult.req.user} />
      <DefaultTemplate
        config={initPageResult.req.payload.config}
        visibleEntities={initPageResult.visibleEntities}
      >
        <NotFoundClient />
      </DefaultTemplate>
    </Fragment>
  )
}
