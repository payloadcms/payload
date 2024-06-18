import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { AdminViewComponent, SanitizedConfig } from 'payload'

import { HydrateClientUser } from '@payloadcms/ui/client'
import React, { Fragment } from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { initPage } from '../../utilities/initPage/index.js'
import { NotFoundClient } from './index.client.js'

export const generatePageMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: { [key: string]: string | string[] }
  //eslint-disable-next-line @typescript-eslint/require-await
}): Promise<Metadata> => {
  const config = await configPromise

  const i18n = await getNextRequestI18n({
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
  params,
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
  const config = await configPromise
  const { routes: { admin: adminRoute } = {} } = config

  const initPageResult = await initPage({
    config,
    redirectUnauthenticatedUser: true,
    route: `${adminRoute}/not-found`,
    searchParams,
  })

  return (
    <Fragment>
      <HydrateClientUser permissions={initPageResult.permissions} user={initPageResult.req.user} />
      <DefaultTemplate
        i18n={initPageResult.req.i18n}
        locale={initPageResult.locale}
        params={params}
        payload={initPageResult.req.payload}
        permissions={initPageResult.permissions}
        searchParams={searchParams}
        user={initPageResult.req.user}
        visibleEntities={initPageResult.visibleEntities}
      >
        <NotFoundClient />
      </DefaultTemplate>
    </Fragment>
  )
}

export const NotFoundView: AdminViewComponent = () => {
  return <NotFoundClient marginTop="large" />
}
