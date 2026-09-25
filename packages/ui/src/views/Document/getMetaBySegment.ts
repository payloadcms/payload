import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewAdapter,
  EditConfig,
  MetaConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import type { GenerateEditViewMetadata } from '../API/generateAPIViewMetadata.js'

import { generateAPIViewMetadata } from '../API/generateAPIViewMetadata.js'
import { generateVersionViewMetadata } from '../Version/generateVersionViewMetadata.js'
import { generateVersionsViewMetadata } from '../Versions/generateVersionsViewMetadata.js'
import { generateEditViewMetadata } from './generateEditViewMetadata.js'
import { getDocumentView } from './index.js'

export type GetMetaBySegmentArgs = {
  adminViews: AdminViewAdapter<unknown, MetaConfig>
  collectionConfig?: null | SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: null | SanitizedGlobalConfig
  i18n: I18nClient
  params: { [key: string]: string | string[] | undefined; segments?: string | string[] }
}

/**
 * Resolves a collection/global document subview from route segments and returns
 * its `MetaConfig`. Shared by all framework adapters — segment-routing logic
 * lives here so adapters do not duplicate it.
 */
export const getMetaBySegment = async ({
  adminViews,
  collectionConfig,
  config,
  globalConfig,
  i18n,
  params,
}: GetMetaBySegmentArgs): Promise<MetaConfig> => {
  const rawSegments = params.segments
  const segments = Array.isArray(rawSegments) ? rawSegments : []

  let fn: GenerateEditViewMetadata | null = null

  const [segmentOne] = segments
  const isCollection = segmentOne === 'collections'
  const isGlobal = segmentOne === 'globals'

  const isEditing =
    isGlobal || Boolean(isCollection && segments.length > 2 && segments[2] !== 'create')

  if (isCollection) {
    if (segments.length === 3) {
      fn = generateEditViewMetadata
    }

    if (segments.length === 4 && segments[2] === 'trash') {
      fn = (args) => generateEditViewMetadata({ ...args, isReadOnly: true })
    }

    if (segments.length === 4) {
      switch (segments[3]) {
        case 'api':
          fn = generateAPIViewMetadata
          break
        case 'versions':
          fn = generateVersionsViewMetadata
          break
        default:
          break
      }
    }

    if (segments.length === 5) {
      switch (segments[3]) {
        case 'versions':
          fn = generateVersionViewMetadata
          break
        default:
          break
      }
    }

    if (segments.length === 5 && segments[2] === 'trash') {
      switch (segments[4]) {
        case 'api':
          fn = generateAPIViewMetadata
          break
        case 'versions':
          fn = generateVersionsViewMetadata
          break
        default:
          break
      }
    }

    if (segments.length === 6 && segments[2] === 'trash' && segments[4] === 'versions') {
      fn = generateVersionViewMetadata
    }
  }

  if (isGlobal) {
    if (segments.length === 2) {
      fn = generateEditViewMetadata
    }

    if (segments.length === 3) {
      switch (segments[2]) {
        case 'api':
          fn = generateAPIViewMetadata
          break
        case 'versions':
          fn = generateVersionsViewMetadata
          break
        default:
          break
      }
    }

    if (segments.length === 4 && segments[2] === 'versions') {
      fn = generateVersionViewMetadata
    }
  }

  if (typeof fn === 'function') {
    return fn({
      collectionConfig,
      config,
      globalConfig,
      i18n,
      isEditing,
    })
  }

  const { viewKey } = getDocumentView({
    collectionConfig,
    config,
    docPermissions: {
      create: true,
      delete: true,
      fields: true,
      read: true,
      readVersions: true,
      update: true,
    },
    globalConfig,
    routeSegments: segments,
  })

  if (viewKey) {
    const customViewConfig =
      collectionConfig?.admin?.components?.views?.edit?.[viewKey] ||
      globalConfig?.admin?.components?.views?.edit?.[viewKey]

    if (customViewConfig) {
      return generateEditViewMetadata({
        collectionConfig,
        config,
        globalConfig,
        i18n,
        isEditing,
        view: viewKey as keyof EditConfig,
      })
    }
  }

  return adminViews.notFound.generateMetadata({ config, i18n })
}
