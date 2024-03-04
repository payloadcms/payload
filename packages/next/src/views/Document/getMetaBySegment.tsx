import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { getNextI18n } from '../../utilities/getNextI18n.ts'
import { meta } from '../../utilities/meta.ts'

export type GenerateEditViewMetadata = (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  isEditing: boolean
}) => Promise<Metadata>

export const getMetaBySegment = async ({
  config: configPromise,
  params,
}: {
  config: Promise<SanitizedConfig>
  params: {
    collection?: string
    global?: string
    segments: string[]
  }
}): Promise<Metadata> => {
  const config = await configPromise

  let fn: GenerateEditViewMetadata | null = null

  const isEditing = Boolean(
    params.collection && params.segments?.length > 0 && params.segments[0] !== 'create',
  )

  if (params.collection && params?.segments?.length) {
    // `/:id`
    if (params.segments.length === 1) {
      fn = await import('../Edit/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/api`
    if (params.segments.length === 2 && params.segments[1] === 'api') {
      fn = await import('../API/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/preview`
    if (params.segments.length === 2 && params.segments[1] === 'preview') {
      fn = await import('../LivePreview/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/versions`
    if (params.segments.length === 2 && params.segments[1] === 'versions') {
      fn = await import('../Versions/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/versions/:version`
    if (params.segments.length === 3 && params.segments[1] === 'versions') {
      fn = await import('../Version/meta.ts').then((mod) => mod.generateMetadata)
    }
  }

  if (params.global) {
    // `/:slug`
    if (!params.segments?.length) {
      fn = await import('../Edit/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:slug/api`
    if (params.segments?.length === 1 && params.segments[0] === 'api') {
      fn = await import('../API/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:slug/preview`
    if (params.segments?.length === 1 && params.segments[0] === 'preview') {
      fn = await import('../LivePreview/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:slug/versions`
    if (params.segments?.length === 1 && params.segments[0] === 'versions') {
      fn = await import('../Versions/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:slug/versions/:version`
    if (params.segments?.length === 2 && params.segments[0] === 'versions') {
      fn = await import('../Version/meta.ts').then((mod) => mod.generateMetadata)
    }
  }

  const i18n = await getNextI18n({
    config,
  })

  const collectionConfig = params.collection
    ? config?.collections?.find((collection) => collection.slug === params.collection)
    : null

  const globalConfig = params.global
    ? config?.globals?.find((global) => global.slug === params.global)
    : null

  if (typeof fn === 'function') {
    return fn({
      collectionConfig,
      config,
      globalConfig,
      i18n,
      isEditing,
    })
  }

  return meta({
    config,
    description: '',
    keywords: '',
    title: '',
  })
}
