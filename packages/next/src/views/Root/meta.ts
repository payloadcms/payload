import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { generateAccountMetadata } from '../Account/index.js'
import { generateCreateFirstUserMetadata } from '../CreateFirstUser/index.js'
import { generateDashboardMetadata } from '../Dashboard/index.js'
import { generateDocumentMetadata } from '../Document/meta.js'
import { generateForgotPasswordMetadata } from '../ForgotPassword/index.js'
import { generateGraphQLPlaygroundMetadata } from '../GraphQLPlayground/index.js'
import { generateListMetadata } from '../List/index.js'
import { generateLoginMetadata } from '../Login/index.js'
import { generateNotFoundMeta } from '../NotFound/meta.js'
import { generateResetPasswordMetadata } from '../ResetPassword/index.js'
import { generateUnauthorizedMetadata } from '../Unauthorized/index.js'
import { generateVerifyMetadata } from '../Verify/index.js'
import { generateCustomViewMetadata } from './generateCustomViewMetadata.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

const oneSegmentMeta = {
  'create-first-user': generateCreateFirstUserMetadata,
  forgot: generateForgotPasswordMetadata,
  'graphql-playground': generateGraphQLPlaygroundMetadata,
  login: generateLoginMetadata,
  logout: generateUnauthorizedMetadata,
  'logout-inactivity': generateUnauthorizedMetadata,
  unauthorized: generateUnauthorizedMetadata,
}

type Args = {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

export const generatePageMetadata = async ({ config: configPromise, params }: Args) => {
  const config = await configPromise

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
      meta = await generateDashboardMetadata({ config, i18n })
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
        meta = await generateAccountMetadata({ config, i18n })
        break
      }
      break
    }
    case 2: {
      if (segmentOne === 'reset') {
        // --> /reset/:token
        meta = await generateResetPasswordMetadata({ config, i18n })
      }
      if (isCollection) {
        // --> /collections/:collectionSlug
        meta = await generateListMetadata({ collectionConfig, config, i18n })
      } else if (isGlobal) {
        // --> /globals/:globalSlug
        meta = await generateDocumentMetadata({
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
        meta = await generateVerifyMetadata({ config, i18n })
      } else if (isCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:version
        // --> /collections/:collectionSlug/:id/api
        meta = await generateDocumentMetadata({ collectionConfig, config, i18n, params })
      } else if (isGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/versions/:version
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/api
        meta = await generateDocumentMetadata({
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
      meta = await generateNotFoundMeta({ config, i18n })
    }
  }

  return meta
}
