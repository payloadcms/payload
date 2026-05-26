import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { getCustomViewByRoute } from '@payloadcms/ui/utilities/routeResolution/getCustomViewByRoute'
import { generateAccountViewMetadata } from '@payloadcms/ui/views/Account/metadata'
import { generateCollectionTrashMetadata } from '@payloadcms/ui/views/CollectionTrash/metadata'
import { generateCreateFirstUserViewMetadata } from '@payloadcms/ui/views/CreateFirstUser/metadata'
import { generateDashboardViewMetadata } from '@payloadcms/ui/views/Dashboard/metadata'
import { generateForgotPasswordViewMetadata } from '@payloadcms/ui/views/ForgotPassword/metadata'
import { generateListViewMetadata } from '@payloadcms/ui/views/List/metadata'
import { generateLoginViewMetadata } from '@payloadcms/ui/views/Login/metadata'
import { generateNotFoundViewMetadata } from '@payloadcms/ui/views/NotFound/metadata'
import { generateResetPasswordViewMetadata } from '@payloadcms/ui/views/ResetPassword/metadata'
import { generateUnauthorizedViewMetadata } from '@payloadcms/ui/views/Unauthorized/metadata'
import { generateVerifyViewMetadata } from '@payloadcms/ui/views/Verify/metadata'

import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { generateDocumentViewMetadata } from '../Document/metadata.js'
import { generateCustomViewMetadata } from './generateCustomViewMetadata.js'

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
  const [segmentOne, segmentTwo, segmentThree] = segments

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
      if (segmentOne === 'account') {
        // --> /account
        meta = await generateAccountViewMetadata({ config, i18n })
        break
      } else if (oneSegmentMeta[segmentOne]) {
        // --> /create-first-user
        // --> /forgot
        // --> /login
        // --> /logout
        // --> /logout-inactivity
        // --> /unauthorized
        meta = await oneSegmentMeta[segmentOne]({ config, i18n })
        break
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        // --> /reset/:token
        meta = await generateResetPasswordViewMetadata({ config, i18n })
      } else if (isCollection) {
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
        if (segmentThree === 'trash' && segments.length === 3 && collectionConfig) {
          // Collection Trash Views
          // --> /collections/:collectionSlug/trash
          meta = await generateCollectionTrashMetadata({
            collectionConfig,
            config,
            i18n,
            params,
          })
        } else {
          // Collection Document Views
          // --> /collections/:collectionSlug/:id
          // --> /collections/:collectionSlug/:id/versions
          // --> /collections/:collectionSlug/:id/versions/:version
          // --> /collections/:collectionSlug/:id/api
          // --> /collections/:collectionSlug/trash/:id
          meta = await generateDocumentViewMetadata({ collectionConfig, config, i18n, params })
        }
      } else if (isGlobal) {
        // Global Document Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/versions/:version
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
