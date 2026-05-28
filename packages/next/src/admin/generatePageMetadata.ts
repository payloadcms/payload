import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewConfig,
  EditConfig,
  MetaConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui/shared'
import { getCustomViewByRoute } from '@payloadcms/ui/utilities/routeResolution/getCustomViewByRoute'
import { getDocumentView } from '@payloadcms/ui/views/Document/getDocumentView'

import { getNextRequestI18n } from '../utilities/getNextRequestI18n.js'
import { generateMetadata } from '../utilities/meta.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export type GenerateEditViewMetadata = (
  args: {
    collectionConfig?: null | SanitizedCollectionConfig
    globalConfig?: null | SanitizedGlobalConfig
    isReadOnly?: boolean
    view?: keyof EditConfig
  } & Parameters<GenerateViewMetadata>[0],
) => Promise<Metadata>

const generateNotFoundViewMetadata = async ({
  config,
  i18n,
}: {
  config: SanitizedConfig
  i18n: I18nClient
}): Promise<Metadata> =>
  generateMetadata({
    description: i18n.t('general:pageNotFound'),
    keywords: `404 ${i18n.t('general:notFound')}`,
    serverURL: config.serverURL,
    title: i18n.t('general:notFound'),
  })

const generateAccountViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    serverURL: config.serverURL,
    title: t('authentication:account'),
    ...(config.admin.meta || {}),
  })

const generateCreateFirstUserViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
    ...(config.admin.meta || {}),
  })

const generateDashboardViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    serverURL: config.serverURL,
    title: t('general:dashboard'),
    ...config.admin.meta,
    openGraph: {
      title: t('general:dashboard'),
      ...(config.admin.meta?.openGraph || {}),
    },
  })

const generateForgotPasswordViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
    ...(config.admin.meta || {}),
    serverURL: config.serverURL,
  })

const generateLoginViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:login')}`,
    keywords: `${t('authentication:login')}`,
    serverURL: config.serverURL,
    title: t('authentication:login'),
    ...(config.admin.meta || {}),
  })

const generateResetPasswordViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}): Promise<Metadata> =>
  generateMetadata({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
    ...(config.admin.meta || {}),
  })

const generateUnauthorizedViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
    ...(config.admin.meta || {}),
  })

const generateVerifyViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    serverURL: config.serverURL,
    title: t('authentication:verify'),
    ...(config.admin.meta || {}),
  })

const generateListViewMetadata = async (
  args: { collectionConfig: SanitizedCollectionConfig } & Parameters<GenerateViewMetadata>[0],
): Promise<Metadata> => {
  const { collectionConfig, config, i18n } = args
  const title = collectionConfig ? getTranslation(collectionConfig.labels.plural, i18n) : ''

  return generateMetadata({
    ...(config.admin.meta || {}),
    description: '',
    keywords: '',
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}

const generateCollectionTrashMetadata = async (
  args: { collectionConfig: SanitizedCollectionConfig } & Parameters<GenerateViewMetadata>[0],
): Promise<Metadata> => {
  const { collectionConfig, config, i18n } = args
  let title = collectionConfig ? getTranslation(collectionConfig.labels.plural, i18n) : ''
  title = `${title ? `${title} ` : title}${i18n.t('general:trash')}`

  return generateMetadata({
    ...(config.admin.meta || {}),
    description: '',
    keywords: '',
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}

const generateEditViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
  isEditing,
  isReadOnly = false,
  view = 'default',
}): Promise<Metadata> => {
  const { t } = i18n

  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  const verb = isReadOnly
    ? t('general:viewing')
    : isEditing
      ? t('general:editing')
      : t('general:creating')

  const metaToUse: MetaConfig = {
    ...(config.admin.meta || {}),
    description: `${verb} - ${entityLabel}`,
    keywords: `${entityLabel}, Payload, CMS`,
    title: `${verb} - ${entityLabel}`,
  }

  const ogToUse: MetaConfig['openGraph'] = {
    title: `${isEditing ? t('general:edit') : t('general:edit')} - ${entityLabel}`,
    ...(config.admin.meta.openGraph || {}),
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta?.openGraph || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta?.openGraph || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
  }

  return generateMetadata({
    ...metaToUse,
    openGraph: ogToUse,
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}) as MetaConfig),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}) as MetaConfig),
    serverURL: config.serverURL,
  })
}

const generateAPIViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}) => {
  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  return generateMetadata({
    ...(config.admin.meta || {}),
    description: `API - ${entityLabel}`,
    keywords: 'API',
    serverURL: config.serverURL,
    title: `API - ${entityLabel}`,
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.api?.meta || {}),
        }
      : {}) as MetaConfig),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.api?.meta || {}),
        }
      : {}) as MetaConfig),
  })
}

const generateVersionsViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}): Promise<Metadata> => {
  const { t } = i18n
  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''
  let metaToUse: MetaConfig = { ...(config.admin.meta || {}) }
  const data: any = {}

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const titleFromData = data?.[useAsTitle]
    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersions', {
        documentTitle: data?.[useAsTitle],
        entitySlug: collectionConfig.slug,
      }),
      title: `${t('version:versions')}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`,
      ...(collectionConfig?.admin.meta || {}),
      ...(collectionConfig?.admin?.components?.views?.edit?.versions?.meta || {}),
    }
  }

  if (globalConfig) {
    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug }),
      title: `${t('version:versions')} - ${entityLabel}`,
      ...((globalConfig?.admin.meta || {}) as MetaConfig),
      ...((globalConfig?.admin?.components?.views?.edit?.versions?.meta || {}) as MetaConfig),
    }
  }

  return generateMetadata({ ...metaToUse, serverURL: config.serverURL })
}

const generateVersionViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}): Promise<Metadata> => {
  const { t } = i18n
  let metaToUse: MetaConfig = { ...(config.admin.meta || {}) }
  const doc: any = {}
  const formattedCreatedAt = doc?.createdAt
    ? formatDate({ date: doc.createdAt, i18n, pattern: config?.admin?.dateFormat })
    : ''

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    const titleFromData = doc?.[useAsTitle]
    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersion', { documentTitle: titleFromData, entityLabel }),
      title: `${t('version:version')}${formattedCreatedAt ? ` - ${formattedCreatedAt}` : ''}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`,
      ...(collectionConfig?.admin?.meta || {}),
      ...(collectionConfig?.admin?.components?.views?.edit?.version?.meta || {}),
    }
  }

  if (globalConfig) {
    const entityLabel = getTranslation(globalConfig.label, i18n)
    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersionGlobal', { entityLabel }),
      title: `${t('version:version')}${formattedCreatedAt ? ` - ${formattedCreatedAt}` : ''}${entityLabel}`,
      ...((globalConfig?.admin?.meta || {}) as MetaConfig),
      ...((globalConfig?.admin?.components?.views?.edit?.version?.meta || {}) as MetaConfig),
    }
  }

  return generateMetadata({ ...metaToUse, serverURL: config.serverURL })
}

const generateCustomViewMetadata = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18nClient
  viewConfig: AdminViewConfig
}): Promise<Metadata> => {
  const { config, viewConfig } = args
  if (!viewConfig) {
    return null
  }
  return generateMetadata({
    description: `Payload`,
    keywords: `Payload`,
    serverURL: config.serverURL,
    title: 'Payload',
    ...(config.admin.meta || {}),
    ...(viewConfig.meta || {}),
    openGraph: {
      title: 'Payload',
      ...(config.admin.meta?.openGraph || {}),
      ...(viewConfig.meta?.openGraph || {}),
    },
  })
}

/**
 * Resolves the Document-subview metadata by inspecting the route segments.
 * Mirrors the prior `getMetaBySegment` helper.
 */
const getDocumentMetaBySegment: GenerateEditViewMetadata = async ({
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
    if (segments?.length === 2) {
      fn = generateEditViewMetadata
    }
    if (segments?.length === 3) {
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
    if (segments?.length === 4 && segments[2] === 'versions') {
      fn = generateVersionViewMetadata
    }
  }

  const i18n = await getNextRequestI18n({ config })

  if (typeof fn === 'function') {
    return fn({ collectionConfig, config, globalConfig, i18n, isEditing })
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
    routeSegments: typeof segments === 'string' ? [segments] : segments,
  }) || { viewKey: undefined }

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

  return generateNotFoundViewMetadata({ config, i18n })
}

const oneSegmentMeta: Record<string, GenerateViewMetadata> = {
  'create-first-user': generateCreateFirstUserViewMetadata,
  forgot: generateForgotPasswordViewMetadata,
  login: generateLoginViewMetadata,
  logout: generateUnauthorizedViewMetadata,
  'logout-inactivity': generateUnauthorizedViewMetadata,
  unauthorized: generateUnauthorizedViewMetadata,
}

type GeneratePageMetadataArgs = {
  config: Promise<SanitizedConfig>
  params: Promise<{ [key: string]: string | string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

/**
 * Resolves Next.js page metadata for any admin route segment by walking the
 * segments and selecting the appropriate per-view metadata generator. Falls
 * back to custom-view metadata, then to a 404 title.
 */
export const generatePageMetadata = async ({
  config: configPromise,
  params: paramsPromise,
}: GeneratePageMetadataArgs) => {
  const config = await configPromise
  const params = await paramsPromise
  const segments = Array.isArray(params.segments) ? params.segments : []

  const currentRoute = `/${segments.join('/')}`
  const [segmentOne, segmentTwo, segmentThree] = segments
  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  const i18n = await getNextRequestI18n({ config })

  let meta: Metadata

  const collectionConfig =
    (isCollection &&
      segments.length > 1 &&
      config?.collections?.find((collection) => collection.slug === segmentTwo)) ||
    undefined

  const globalConfig =
    (isGlobal &&
      segments.length > 1 &&
      config?.globals?.find((global) => global.slug === segmentTwo)) ||
    undefined

  switch (segments.length) {
    case 0: {
      meta = await generateDashboardViewMetadata({ config, i18n })
      break
    }
    case 1: {
      if (segmentOne === 'account') {
        meta = await generateAccountViewMetadata({ config, i18n })
        break
      } else if (oneSegmentMeta[segmentOne]) {
        meta = await oneSegmentMeta[segmentOne]({ config, i18n })
        break
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        meta = await generateResetPasswordViewMetadata({ config, i18n })
      } else if (isCollection) {
        meta = await generateListViewMetadata({ collectionConfig, config, i18n })
      } else if (isGlobal) {
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
        meta = await generateVerifyViewMetadata({ config, i18n })
      } else if (isCollection) {
        if (segmentThree === 'trash' && segments.length === 3 && collectionConfig) {
          meta = await generateCollectionTrashMetadata({
            collectionConfig,
            config,
            i18n,
            params,
          })
        } else {
          meta = await generateDocumentMetadata({ collectionConfig, config, i18n, params })
        }
      } else if (isGlobal) {
        meta = await generateDocumentMetadata({ config, globalConfig, i18n, params })
      }
      break
    }
  }

  if (!meta) {
    const { viewConfig, viewKey } = getCustomViewByRoute({ config, currentRoute })
    if (viewKey) {
      meta = await generateCustomViewMetadata({ config, i18n, viewConfig })
    } else {
      meta = await generateNotFoundViewMetadata({ config, i18n })
    }
  }

  return meta
}

/**
 * Shim that exposes the document-segment resolver as a `GenerateEditViewMetadata`
 * for external consumers that previously imported `getMetaBySegment`.
 */
export const generateDocumentMetadata: GenerateEditViewMetadata = (args) =>
  getDocumentMetaBySegment(args)
