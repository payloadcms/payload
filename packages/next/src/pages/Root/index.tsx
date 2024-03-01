import type { SanitizedConfig } from 'payload/types'

import { DefaultTemplate } from '@payloadcms/ui'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { Account } from '../Account'
import { CreateFirstUser } from '../CreateFirstUser'
import { Dashboard } from '../Dashboard'
import { ForgotPassword } from '../ForgotPassword'
import { Login } from '../Login'
import { Logout, LogoutInactivity } from '../Logout'
import { ResetPassword } from '../ResetPassword'
import { Unauthorized } from '../Unauthorized'
import Verify from '../Verify'

type Args = {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const oneSegmentViews = {
  'create-first-user': CreateFirstUser,
  forgot: ForgotPassword,
  login: Login,
  logout: Logout,
  'logout-inactivity': LogoutInactivity,
  unauthorized: Unauthorized,
}

const twoSegmentViews = {
  reset: ResetPassword,
  verify: Verify,
}

export const RootPage = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise

  let route = config.routes.admin

  if (Array.isArray(params.segments)) {
    route = route + '/' + params.segments.join('/')
  }

  const segments = Array.isArray(params.segments) ? params.segments : []

  const [segmentOne, segmentTwo, segmentThree, segmentFour, segmentFive] = segments

  // Catch any single-segment routes:
  // /create-first-user
  // /forgot
  // /login
  // /logout
  // /logout-inactivity
  // /unauthorized
  // /verify
  // /account
  if (segments.length === 1 && oneSegmentViews[segmentOne] && segmentOne !== 'account') {
    const page = await initPage({ config, route })
    const View = oneSegmentViews[segmentOne]

    return <View page={page} searchParams={searchParams} />
  }

  // Catch any two-segment routes:
  // /reset
  // /verify
  if (segments.length === 2 && twoSegmentViews[segmentOne]) {
    const page = await initPage({ config, route })
    const View = twoSegmentViews[segmentOne]
    return <View page={page} params={params} searchParams={searchParams} />
  }

  const page = await initPage({ config, redirectUnauthenticatedUser: true, route })

  return (
    <DefaultTemplate
      config={config}
      i18n={page.req.i18n}
      permissions={page.permissions}
      user={page.req.user}
    >
      {segmentOne === 'account' && <Account page={page} searchParams={searchParams} />}
      {segments.length === 0 && <Dashboard page={page} searchParams={searchParams} />}
    </DefaultTemplate>
  )

  // * Catch any two-segment routes:
  // /reset-password/:token
  // /verify/:token
  // /collections/:collectionSlug
  // /globals/:globalSlug

  // * Catch any three-segment routes:
  // /collections/:collectionSlug/:id

  // * Catch any four-segment routes:
  // /collections/:collectionSlug/:id/versions

  // * Catch any five-segment routes:
  // /collections/:collectionSlug/:id/versions/:versionId

  return null
}

export const generateMeta = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: 'Payload',
    keywords: 'Payload',
    title: 'Payload',
    // description: `${t('authentication:logoutUser')}`,
    // keywords: `${t('authentication:logout')}`,
    // title: t('authentication:logout'),
  })
}
