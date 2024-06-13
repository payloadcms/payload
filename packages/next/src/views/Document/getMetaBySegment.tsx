import type { Metadata } from 'next'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { generateMetadata as apiMeta } from '../API/meta.js'
import { generateMetadata as editMeta } from '../Edit/meta.js'
import { generateMetadata as livePreviewMeta } from '../LivePreview/meta.js'
import { generateNotFoundMeta } from '../NotFound/meta.js'
import { generateMetadata as versionMeta } from '../Version/meta.js'
import { generateMetadata as versionsMeta } from '../Versions/meta.js'

export type GenerateEditViewMetadata = (
  args: Parameters<GenerateViewMetadata>[0] & {
    collectionConfig?: SanitizedCollectionConfig | null
    globalConfig?: SanitizedGlobalConfig | null
  },
) => Promise<Metadata>

export const getMetaBySegment: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  params,
}) => {
  const { segments } = params

  let fn: GenerateEditViewMetadata | null = null

  const [segmentOne] = segments
  const isCollection = segmentOne === 'collections'
  const isGlobal = segmentOne === 'globals'

  const isEditing =
    isGlobal || Boolean(isCollection && segments?.length > 2 && segments[2] !== 'create')

  if (isCollection) {
    // `/:id`
    if (params.segments.length === 3) {
      fn = editMeta
    }

    // `/:id/api`
    if (params.segments.length === 4 && params.segments[3] === 'api') {
      fn = apiMeta
    }

    // `/:id/preview`
    if (params.segments.length === 4 && params.segments[3] === 'preview') {
      fn = livePreviewMeta
    }

    // `/:id/versions`
    if (params.segments.length === 4 && params.segments[3] === 'versions') {
      fn = versionsMeta
    }

    // `/:id/versions/:version`
    if (params.segments.length === 5 && params.segments[3] === 'versions') {
      fn = versionMeta
    }
  }

  if (isGlobal) {
    // `/:slug`
    if (params.segments?.length === 2) {
      fn = editMeta
    }

    // `/:slug/api`
    if (params.segments?.length === 3 && params.segments[2] === 'api') {
      fn = apiMeta
    }

    // `/:slug/preview`
    if (params.segments?.length === 3 && params.segments[2] === 'preview') {
      fn = livePreviewMeta
    }

    // `/:slug/versions`
    if (params.segments?.length === 3 && params.segments[2] === 'versions') {
      fn = versionsMeta
    }

    // `/:slug/versions/:version`
    if (params.segments?.length === 4 && params.segments[2] === 'versions') {
      fn = versionMeta
    }
  }

  const i18n = await getNextRequestI18n({
    config,
  })

  if (typeof fn === 'function') {
    return fn({
      collectionConfig,
      config,
      globalConfig,
      i18n,
      isEditing,
    })
  }

  return generateNotFoundMeta({ config, i18n })
}
