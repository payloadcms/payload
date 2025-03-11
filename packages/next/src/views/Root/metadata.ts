import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { generateAccountViewMetadata } from '../Account/metadata.js'
import { generateCreateFirstUserViewMetadata } from '../CreateFirstUser/metadata.js'
import { generateDashboardViewMetadata } from '../Dashboard/metadata.js'
import { generateDocumentViewMetadata } from '../Document/metadata.js'
import { generateForgotPasswordViewMetadata } from '../ForgotPassword/metadata.js'
import { generateListViewMetadata } from '../List/metadata.js'
import { generateLoginViewMetadata } from '../Login/metadata.js'
import { generateNotFoundViewMetadata } from '../NotFound/metadata.js'
import { generateResetPasswordViewMetadata } from '../ResetPassword/metadata.js'
import { generateUnauthorizedViewMetadata } from '../Unauthorized/metadata.js'
import { generateVerifyViewMetadata } from '../Verify/metadata.js'
import { generateCustomViewMetadata } from './generateCustomViewMetadata.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

const oneSegmentMeta = {
  'create-first-user': generateCreateFirstUserViewMetadata,
  forgot: generateForgotPasswordViewMetadata,
  login: generateLoginViewMetadata,
  logout: generateUnauthorizedViewMetadata,
  'logout-inactivity': generateUnauthorizedViewMetadata,
  unauthorized: generateUnauthorizedViewMetadata,
}

type Args = {
  config: Promise<SanitizedConfig>
  params: Promise<{
    [key: string]: string | string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generatePageMetadata = async ({
  config: configPromise,
  params: paramsPromise,
}: Args) => {
  const config = await configPromise

  const params = await paramsPromise
  const segments = Array.isArray(params.segments) ? params.segments : []

  const currentRoute = `/${segments.join('/')}`
  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  const i18n = await getNextRequestI18n({
    config,
  })

  let meta: Metadata

  // TODO: handle custom routes

  const collectionConfig =
    isCollection &&
    segments.length > 1 &&
    config?.collections?.find((collection) => collection.slug === segmentTwo)

  const globalConfig =
    isGlobal && segments.length > 1 && config?.globals?.find((global) => global.slug === segmentTwo)

  switch (segments.length) {
    case 0: {
      meta = await generateDashboardViewMetadata({ config, i18n })
      break
    }
    case 1: {
      if (oneSegmentMeta[segmentOne] && segmentOne !== 'account') {
        // --> /create-first-user
        // --> /forgot
        // --> /login
        // --> /logout
        // --> /logout-inactivity
        // --> /unauthorized
        meta = await oneSegmentMeta[segmentOne]({ config, i18n })
        break
      } else if (segmentOne === 'account') {
        // --> /account
        meta = await generateAccountViewMetadata({ config, i18n })
        break
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        // --> /reset/:token
        meta = await generateResetPasswordViewMetadata({ config, i18n })
      }
      if (isCollection) {
        // --> /collections/:collectionSlug
        meta = await generateListViewMetadata({ collectionConfig, config, i18n })
      } else if (isGlobal) {
        // --> /globals/:globalSlug
        meta = await generateDocumentViewMetadata({
          config,
          globalConfig,
          i18n,
          params,
        })
      }
      break
    }
    default: {
      if (segmentTwo === 'verify') {
        // --> /:collectionSlug/verify/:token
        meta = await generateVerifyViewMetadata({ config, i18n })
      } else if (isCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:version
        // --> /collections/:collectionSlug/:id/api
        meta = await generateDocumentViewMetadata({ collectionConfig, config, i18n, params })
      } else if (isGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/versions/:version
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/api
        meta = await generateDocumentViewMetadata({
          config,
          globalConfig,
          i18n,
          params,
        })
      }
      break
    }
  }

  if (!meta) {
    const { viewConfig, viewKey } = getCustomViewByRoute({
      config,
      currentRoute,
    })

    if (viewKey) {
      // Custom Views
      // --> /:path
      meta = await generateCustomViewMetadata({
        config,
        i18n,
        viewConfig,
      })
    } else {
      meta = await generateNotFoundViewMetadata({ config, i18n })
    }
  }

  return meta
}
