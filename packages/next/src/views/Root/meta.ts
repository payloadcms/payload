import { generateAccountMetadata } from '../Account'
import { generateCreateFirstUserMetadata } from '../CreateFirstUser'
import { generateDashboardMetadata } from '../Dashboard'
import { generateForgotPasswordMetadata } from '../ForgotPassword'
import { generateListMetadata } from '../List'
import { generateLoginMetadata } from '../Login'
import { generateResetPasswordMetadata } from '../ResetPassword'
import { generateUnauthorizedMetadata } from '../Unauthorized'
import { generateVerifyMetadata } from '../Verify'
import { Metadata } from 'next'
import { generateDocumentMetadata } from '../Document/meta'
import { getNextI18n } from '../../utilities/getNextI18n'
import { SanitizedConfig } from 'payload/types'
import { generateNotFoundMeta } from '../NotFound/meta'

const oneSegmentMeta = {
  'create-first-user': generateCreateFirstUserMetadata,
  forgot: generateForgotPasswordMetadata,
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

  let route = config.routes.admin

  if (Array.isArray(params.segments)) {
    route = route + '/' + params.segments.join('/')
  }

  const segments = Array.isArray(params.segments) ? params.segments : []

  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  const i18n = await getNextI18n({
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
        meta = await generateListMetadata({ config, i18n, collectionConfig })
      } else if (isGlobal) {
        // --> /globals/:globalSlug
        meta = await generateDocumentMetadata({
          config,
          i18n,
          globalConfig,
          isEditing: false,
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
        const isEditing = ['preview', 'versions', 'api', 'create'].includes(segmentTwo)
        meta = await generateDocumentMetadata({ config, i18n, collectionConfig, isEditing, params })
      } else if (isGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/versions/:version
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/api
        const isEditing = ['preview', 'versions', 'api', 'create'].includes(segmentTwo)
        meta = await generateDocumentMetadata({ config, i18n, globalConfig, isEditing, params })
      }
      break
    }
  }

  if (!meta) {
    meta = await generateNotFoundMeta({ config, i18n })
  }

  return meta
}
