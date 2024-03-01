import type { SanitizedConfig } from 'payload/types'

import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { CreateFirstUser } from '../CreateFirstUser'
import { ForgotPassword } from '../ForgotPassword'
import { Login } from '../Login'
import { Logout, LogoutInactivity } from '../Logout'
import { Unauthorized } from '../Unauthorized'

type Args = {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const views = {
  'create-first-user': CreateFirstUser,
  forgot: ForgotPassword,
  login: Login,
  logout: Logout,
  'logout-inactivity': LogoutInactivity,
  unauthorized: Unauthorized,
}

export const RootPage = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise
  const route = `${config.routes.admin}/${params.segments.join('/')}`
  const page = await initPage({ config, route })

  const [segmentOne, segmentTwo] = params.segments

  // Catch any single-segment routes:
  // /create-first-user
  // /forgot
  // /login
  // /logout
  // /logout-inactivity
  // /unauthorized
  // /verify

  if (params.segments.length === 1 && views[segmentOne]) {
    const View = views[segmentOne]

    return <View page={page} searchParams={searchParams} />
  }

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
