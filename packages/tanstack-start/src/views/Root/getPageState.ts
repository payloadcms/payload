import type {
  CollectionPreferences,
  ImportMap,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getPreferences } from '@payloadcms/ui/utilities/getPreferences'
import { getVisibleEntities } from '@payloadcms/ui/utilities/getVisibleEntities'
import { handleAuthRedirect } from '@payloadcms/ui/utilities/handleAuthRedirect'
import { isCustomAdminView } from '@payloadcms/ui/utilities/isCustomAdminView'
import { isPublicAdminRoute } from '@payloadcms/ui/utilities/isPublicAdminRoute'
import { getDocPreferences } from '@payloadcms/ui/views/Document/getDocPreferences'
import { getDocumentData } from '@payloadcms/ui/views/Document/getDocumentData'
import { getRouteData } from '@payloadcms/ui/views/Root/getRouteData'
import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'

import type { SerializablePageData, SerializablePageState } from './types.js'

import { getNavPrefs } from '../../utilities/getNavPrefs.js'
import { initReq } from '../../utilities/initReq.js'

const isSerializablePayloadComponent = (
  value: PayloadComponent | undefined,
): value is Exclude<PayloadComponent, false> => {
  return Boolean(value && (typeof value === 'string' || typeof value === 'object'))
}

const serializePayloadComponents = (
  components: PayloadComponent[] | undefined,
): PayloadComponent[] | undefined => {
  const safeComponents = components?.filter(isSerializablePayloadComponent)
  return safeComponents?.length ? safeComponents : undefined
}

const getRouteEntityConfigs = ({
  config,
  currentRoute,
  segments,
}: {
  config: SanitizedConfig
  currentRoute: string
  segments: string[]
}): {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
} => {
  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'

  let collectionConfig: SanitizedCollectionConfig = undefined
  let globalConfig: SanitizedGlobalConfig = undefined

  if (isCollectionRoute && segments[1]) {
    collectionConfig = config.collections.find(({ slug }) => slug === segments[1])
  }

  if (isGlobalRoute && segments[1]) {
    globalConfig = config.globals.find(({ slug }) => slug === segments[1])
  }

  if (isCollectionRoute && segments.length === 1) {
    const hasCollectionsCustomView = isCustomAdminView({
      adminRoute: config.routes.admin,
      config,
      route: currentRoute,
    })

    if (!hasCollectionsCustomView) {
      return {}
    }
  }

  if (isGlobalRoute && segments.length === 1) {
    const hasGlobalsCustomView = isCustomAdminView({
      adminRoute: config.routes.admin,
      config,
      route: currentRoute,
    })

    if (!hasGlobalsCustomView) {
      return {}
    }
  }

  return {
    collectionConfig,
    globalConfig,
  }
}

const getLoginPageData = (config: SanitizedConfig): SerializablePageData['login'] => {
  const prefillAutoLogin =
    typeof config.admin?.autoLogin === 'object' && config.admin?.autoLogin.prefillOnly

  if (!prefillAutoLogin || typeof config.admin?.autoLogin !== 'object') {
    return undefined
  }

  return {
    prefillEmail: config.admin.autoLogin.email,
    prefillPassword: config.admin.autoLogin.password,
    prefillUsername: config.admin.autoLogin.username,
  }
}

const buildRedirectSearch = (searchParams: Record<string, string | string[]>) => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry)
      }
    } else if (value !== undefined) {
      params.set(key, value)
    }
  }

  const result = params.toString()

  return result ? `?${result}` : ''
}

const getCreateFirstUserPageData = async ({
  localeCode,
  req,
}: {
  localeCode?: string
  req: Awaited<ReturnType<typeof initReq>>['req']
}): Promise<SerializablePageData['createFirstUser']> => {
  const {
    payload,
    payload: {
      collections,
      config: {
        admin: { user: userSlug },
      },
    },
    user,
  } = req

  const collectionConfig = collections?.[userSlug]?.config

  if (!collectionConfig) {
    return undefined
  }

  const data = await getDocumentData({
    collectionSlug: collectionConfig.slug,
    locale: req.locale,
    payload,
    req,
    user,
  })

  const docPreferences = await getDocPreferences({
    collectionSlug: collectionConfig.slug,
    payload,
    user,
  })

  const docPermissions = {
    create: true,
    delete: true,
    fields: Object.fromEntries(
      collectionConfig.fields
        .filter((field): field is { name: string } & typeof field => 'name' in field)
        .map((field) => [field.name, { create: true, read: true, update: true }]),
    ),
    read: true,
    readVersions: true,
    update: true,
  }

  const { state } = await buildFormState({
    collectionSlug: collectionConfig.slug,
    data,
    docPermissions,
    docPreferences,
    locale: localeCode,
    operation: 'create',
    renderAllFields: true,
    req,
    schemaPath: collectionConfig.slug,
    skipClientConfigAuth: true,
    skipValidation: true,
  })

  return {
    docPermissions,
    docPreferences,
    initialState: reduceToSerializableFields(state),
    loginWithUsername: collectionConfig.auth?.loginWithUsername,
    userSlug,
  }
}

const getVerifyPageData = async ({
  collection,
  req,
  token,
}: {
  collection?: string
  req: Awaited<ReturnType<typeof initReq>>['req']
  token?: string
}): Promise<SerializablePageData['verify']> => {
  let isVerified = false
  let message = req.t('authentication:unableToVerify')

  if (!collection || !token) {
    return { isVerified, message }
  }

  try {
    await req.payload.verifyEmail({
      collection,
      token,
    })
    isVerified = true
    message = req.t('authentication:emailVerified')
  } catch {
    // Keep the default failure message
  }

  return { isVerified, message }
}

export async function getPageState(args: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  searchParams: Record<string, string | string[]>
  segments: string[]
}): Promise<SerializablePageState> {
  const { config: configPromise, importMap, searchParams, segments } = args

  const initPageResult = await initReq({
    config: configPromise,
    importMap,
    key: 'getPageState',
  })

  const {
    locale,
    permissions,
    req,
    req: { payload },
  } = initPageResult

  const config = payload.config
  const {
    admin: {
      routes: { createFirstUser: createFirstUserRouteValue },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(segments) && segments.length > 0 ? `/${segments.join('/')}` : null,
  })

  const { collectionConfig, globalConfig } = getRouteEntityConfigs({
    config,
    currentRoute,
    segments,
  })

  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'

  if (
    (isCollectionRoute && segments[1] && !collectionConfig) ||
    (isGlobalRoute && segments[1] && !globalConfig)
  ) {
    throw new Error('not-found')
  }

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config, route: currentRoute }) &&
    !isCustomAdminView({ adminRoute, config, route: currentRoute })
  ) {
    throw new Error(
      `REDIRECT:${handleAuthRedirect({
        config,
        route: currentRoute,
        searchParams,
        user: req.user,
      })}`,
    )
  }

  let collectionPreferences: CollectionPreferences = undefined

  if (collectionConfig && segments.length === 2) {
    if (config.folders && collectionConfig.folders && segments[1] !== config.folders.slug) {
      collectionPreferences = await getPreferences<CollectionPreferences>(
        `collection-${collectionConfig.slug}`,
        req.payload,
        req.user?.id,
        config.admin.user,
      ).then((res) => res?.value)
    }
  }

  const {
    browseByFolderSlugs,
    DefaultView,
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
  } = getRouteData({
    adminRoute,
    collectionConfig,
    collectionPreferences,
    currentRoute,
    globalConfig,
    payload,
    searchParams,
    segments,
  })

  req.routeParams = routeParams

  const dbHasUser =
    req.user ||
    (await req.payload.db
      .findOne({
        collection: userSlug,
        req,
      })
      ?.then((doc) => Boolean(doc)))

  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req.user) {
      throw new Error('not-found')
    }

    if (dbHasUser) {
      throw new Error(`REDIRECT:${adminRoute}`)
    }
  }

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy
  const createFirstUserRoute = formatAdminURL({
    adminRoute,
    path: createFirstUserRouteValue,
  })

  if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
    throw new Error(`REDIRECT:${adminRoute}`)
  }

  if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
    throw new Error(`REDIRECT:${createFirstUserRoute}`)
  }

  if (dbHasUser && currentRoute === createFirstUserRoute) {
    throw new Error(`REDIRECT:${adminRoute}`)
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    throw new Error(`REDIRECT:${adminRoute}`)
  }

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: viewType === 'createFirstUser' ? true : req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  if (
    clientConfig.localization &&
    req.locale &&
    !clientConfig.localization.localeCodes.includes(req.locale)
  ) {
    const redirectSearch = buildRedirectSearch({
      ...searchParams,
      locale: clientConfig.localization.localeCodes.includes(
        clientConfig.localization.defaultLocale,
      )
        ? clientConfig.localization.defaultLocale
        : clientConfig.localization.localeCodes[0],
    })

    throw new Error(`REDIRECT:${currentRoute}${redirectSearch}`)
  }

  const visibleEntities = getVisibleEntities({ req })
  const navPreferences = await getNavPrefs(req)

  let pageData: SerializablePageData = undefined

  if (viewType === 'login') {
    pageData = {
      ...pageData,
      login: getLoginPageData(config),
    }
  }

  if (viewType === 'createFirstUser') {
    pageData = {
      ...pageData,
      createFirstUser: await getCreateFirstUserPageData({
        localeCode: locale?.code,
        req,
      }),
    }
  }

  if (viewType === 'verify') {
    pageData = {
      ...pageData,
      verify: await getVerifyPageData({
        collection: routeParams.collection,
        req,
        token: routeParams.token,
      }),
    }
  }

  return {
    browseByFolderSlugs,
    clientConfig,
    customView: isSerializablePayloadComponent(DefaultView?.payloadComponent)
      ? DefaultView.payloadComponent
      : undefined,
    documentSubViewType,
    locale,
    navPreferences,
    pageData,
    permissions,
    routeParams,
    searchParams,
    segments,
    templateClassName,
    templateType,
    unsupportedCustomView: Boolean(
      DefaultView?.Component && !viewType && !DefaultView?.payloadComponent,
    ),
    viewActions: serializePayloadComponents(viewActions),
    viewType,
    visibleEntities,
  }
}
