import type {
  ImportMap,
  Locale,
  PayloadComponent,
  SanitizedConfig,
  SanitizedDocumentPermissions,
} from 'payload'

import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { getPreferences } from '@payloadcms/ui/utilities/getPreferences'
import { getDocPreferences } from '@payloadcms/ui/views/Document/getDocPreferences'
import { getDocumentData } from '@payloadcms/ui/views/Document/getDocumentData'
import { getRootPageDescriptor } from '@payloadcms/ui/views/Root/getRootPageDescriptor'
import { PREFERENCE_KEYS } from 'payload/shared'

import type { DashboardLayoutItem, SerializablePageData, SerializablePageState } from './types.js'

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
    locale: req.locale as unknown as Locale | undefined,
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
        .map((field) => [field.name, { create: true, read: true, update: true } as const]),
    ),
    read: true,
    readVersions: true,
    update: true,
  } as const satisfies SanitizedDocumentPermissions

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
    admin: { user: userSlug },
  } = config

  const rootPageResult = await getRootPageDescriptor({
    importMap,
    initPageResult,
    searchParams,
    segments,
  })

  if (rootPageResult.type === 'not-found') {
    throw new Error('not-found')
  }

  if (rootPageResult.type === 'redirect') {
    throw new Error(`REDIRECT:${rootPageResult.url}`)
  }

  const {
    browseByFolderSlugs,
    clientConfig,
    DefaultView,
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
    visibleEntities,
  } = rootPageResult.descriptor

  const navPreferences = await getNavPrefs(req)

  let pageData: SerializablePageData = undefined
  const pageViewType = viewType as string | undefined

  if (pageViewType === 'login') {
    pageData = {
      ...pageData,
      login: getLoginPageData(config),
    }
  }

  if (pageViewType === 'createFirstUser') {
    pageData = {
      ...pageData,
      createFirstUser: await getCreateFirstUserPageData({
        localeCode: locale?.code,
        req,
      }),
    }
  }

  if (pageViewType === 'dashboard') {
    const { defaultLayout = [], widgets = [] } = config.admin.dashboard || {}

    const savedPreferences = await getPreferences(
      PREFERENCE_KEYS.DASHBOARD_LAYOUT,
      payload,
      req.user?.id,
      req.user?.collection,
    )

    let layoutItems: DashboardLayoutItem[] | null = null

    if (
      savedPreferences?.value &&
      typeof savedPreferences.value === 'object' &&
      'layouts' in savedPreferences.value &&
      savedPreferences.value.layouts
    ) {
      layoutItems = savedPreferences.value.layouts as DashboardLayoutItem[]
    }

    if (!layoutItems) {
      const widgetInstances =
        typeof defaultLayout === 'function' ? await defaultLayout({ req }) : defaultLayout

      layoutItems = widgetInstances.map((instance, index) => {
        const widget = widgets.find((w) => w.slug === instance.widgetSlug)
        return {
          id: `${instance.widgetSlug}-${index}`,
          data: instance.data,
          maxWidth: widget?.maxWidth ?? 'full',
          minWidth: widget?.minWidth ?? 'x-small',
          width: instance.width || 'x-small',
        }
      })
    }

    pageData = {
      ...pageData,
      dashboard: { layoutItems },
    }
  }

  if (pageViewType === 'verify') {
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
