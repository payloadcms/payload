import type { I18nClient } from '@payloadcms/translations'
import type { AdminViewAdapter, AdminViewKey, MetaConfig, SanitizedConfig } from 'payload'

import { generateCollectionTrashMetadata } from '../CollectionTrash/generateCollectionTrashMetadata.js'
import { generateListViewMetadata } from '../List/generateListViewMetadata.js'
import { generateCustomViewMetadata } from './generateCustomViewMetadata.js'
import { generateDocumentViewMetadata } from './generateDocumentViewMetadata.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

export type GeneratePageMetadataArgs = {
  adminViews: AdminViewAdapter<unknown, MetaConfig>
  config: SanitizedConfig
  i18n: I18nClient
  params: { [key: string]: string | string[] | undefined; segments?: string | string[] }
}

const oneSegmentMetaKeys: Record<string, AdminViewKey> = {
  'create-first-user': 'createFirstUser',
  forgot: 'forgot',
  login: 'login',
  logout: 'unauthorized',
  'logout-inactivity': 'unauthorized',
  unauthorized: 'unauthorized',
}

/**
 * Resolves an admin page's `MetaConfig` from route segments. Shared by all
 * framework adapters — segment-routing logic lives here so adapters do not
 * duplicate it. Returns the framework-agnostic `MetaConfig`; adapters cast to
 * their framework metadata type at the boundary.
 */
export const generatePageMetadata = async ({
  adminViews,
  config,
  i18n,
  params,
}: GeneratePageMetadataArgs): Promise<MetaConfig> => {
  const rawSegments = params.segments
  const segments = Array.isArray(rawSegments) ? rawSegments : []
  const currentRoute = `/${segments.join('/')}`
  const [segmentOne, segmentTwo, segmentThree] = segments

  const isCollection = segmentOne === 'collections'
  const isGlobal = segmentOne === 'globals'

  const collectionConfig =
    isCollection && segments.length > 1
      ? config?.collections?.find((c) => c.slug === segmentTwo)
      : undefined

  const globalConfig =
    isGlobal && segments.length > 1
      ? config?.globals?.find((g) => g.slug === segmentTwo)
      : undefined

  let meta: MetaConfig | undefined

  switch (segments.length) {
    case 0: {
      meta = await adminViews.dashboard.generateMetadata({ config, i18n })
      break
    }
    case 1: {
      if (segmentOne === 'account') {
        meta = await adminViews.account.generateMetadata({ config, i18n })
      } else if (oneSegmentMetaKeys[segmentOne]) {
        const key = oneSegmentMetaKeys[segmentOne]
        meta = await adminViews[key].generateMetadata({ config, i18n })
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        meta = await adminViews.reset.generateMetadata({ config, i18n })
      } else if (isCollection && collectionConfig) {
        meta = await generateListViewMetadata({ collectionConfig, config, i18n })
      } else if (isGlobal && globalConfig) {
        meta = await generateDocumentViewMetadata({
          adminViews,
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
        meta = await adminViews.verify.generateMetadata({ config, i18n })
      } else if (isCollection && collectionConfig) {
        if (segmentThree === 'trash' && segments.length === 3) {
          meta = await generateCollectionTrashMetadata({
            collectionConfig,
            config,
            i18n,
            params,
          })
        } else {
          meta = await generateDocumentViewMetadata({
            adminViews,
            collectionConfig,
            config,
            i18n,
            params,
          })
        }
      } else if (isGlobal && globalConfig) {
        meta = await generateDocumentViewMetadata({
          adminViews,
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
    const { viewConfig, viewKey } = getCustomViewByRoute({ config, currentRoute })

    if (viewKey) {
      meta = await generateCustomViewMetadata({ config, i18n, viewConfig })
    } else {
      meta = await adminViews.notFound.generateMetadata({ config, i18n })
    }
  }

  return meta
}
