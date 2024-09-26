import type {
  AdminViewProps,
  PayloadComponent,
  ServerProps,
  ServerSideEditViewProps,
} from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { formatAdminURL, isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'
import type { ViewFromConfig } from './getViewsFromConfig.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { renderEntity } from '../../utilities/renderEntity.js'
import { NotFoundView } from '../NotFound/index.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getMetaBySegment } from './getMetaBySegment.js'
import { getViewsFromConfig } from './getViewsFromConfig.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export const Document: React.FC<AdminViewProps> = async ({
  clientConfig,
  importMap,
  initPageResult,
  params,
  payloadServerAction,
  searchParams,
}) => {
  const {
    collectionConfig,
    docID: id,
    globalConfig,
    locale,
    permissions,
    req,
    req: {
      i18n,
      payload,
      payload: {
        config,
        config: {
          routes: { admin: adminRoute, api: apiRoute },
          serverURL,
        },
      },
      user,
    },
    visibleEntities,
  } = initPageResult

  const segments = Array.isArray(params?.segments) ? params.segments : []

  const collectionSlug = collectionConfig?.slug || undefined

  const globalSlug = globalConfig?.slug || undefined

  const isEditing = getIsEditing({ id, collectionSlug, globalSlug })

  let RootViewOverride: PayloadComponent
  let CustomView: ViewFromConfig<ServerSideEditViewProps>
  let DefaultView: ViewFromConfig<ServerSideEditViewProps>
  let ErrorView: ViewFromConfig<AdminViewProps>

  let apiURL: string

  const { data, formState } = await getDocumentData({
    id,
    collectionConfig,
    globalConfig,
    locale,
    req,
  })

  if (!data) {
    notFound()
  }

  const { docPermissions, hasPublishPermission, hasSavePermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data,
    globalConfig,
    req,
  })

  const serverProps: ServerProps = {
    i18n,
    initPageResult,
    locale,
    params,
    payload,
    payloadServerAction,
    permissions,
    routeSegments: segments,
    searchParams,
    user,
  }

  if (collectionConfig) {
    if (!visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug)) {
      notFound()
    }

    const params = new URLSearchParams()
    if (collectionConfig.versions?.drafts) {
      params.append('draft', 'true')
    }
    if (locale?.code) {
      params.append('locale', locale.code)
    }

    const apiQueryParams = `?${params.toString()}`

    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${id}${apiQueryParams}`

    RootViewOverride =
      collectionConfig?.admin?.components?.views?.edit?.root &&
      'Component' in collectionConfig.admin.components.views.edit.root
        ? collectionConfig?.admin?.components?.views?.edit?.root?.Component
        : null

    if (!RootViewOverride) {
      const collectionViews = getViewsFromConfig({
        collectionConfig,
        config,
        docPermissions,
        routeSegments: segments,
      })

      CustomView = collectionViews?.CustomView
      DefaultView = collectionViews?.DefaultView
      ErrorView = collectionViews?.ErrorView
    }

    if (!CustomView && !DefaultView && !RootViewOverride && !ErrorView) {
      ErrorView = {
        Component: NotFoundView,
      }
    }
  }

  if (globalConfig) {
    if (!visibleEntities?.globals?.find((visibleSlug) => visibleSlug === globalSlug)) {
      notFound()
    }

    const params = new URLSearchParams({
      locale: locale?.code,
    })

    if (globalConfig.versions?.drafts) {
      params.append('draft', 'true')
    }

    if (locale?.code) {
      params.append('locale', locale.code)
    }

    const apiQueryParams = `?${params.toString()}`

    apiURL = `${serverURL}${apiRoute}/${globalSlug}${apiQueryParams}`

    RootViewOverride =
      globalConfig?.admin?.components?.views?.edit?.root &&
      'Component' in globalConfig.admin.components.views.edit.root
        ? globalConfig?.admin?.components?.views?.edit?.root?.Component
        : null

    if (!RootViewOverride) {
      const globalViews = getViewsFromConfig({
        config,
        docPermissions,
        globalConfig,
        routeSegments: segments,
      })

      CustomView = globalViews?.CustomView
      DefaultView = globalViews?.DefaultView
      ErrorView = globalViews?.ErrorView

      if (!CustomView && !DefaultView && !RootViewOverride && !ErrorView) {
        ErrorView = {
          Component: NotFoundView,
        }
      }
    }
  }

  /**
   * Handle case where autoSave is enabled and the document is being created
   * => create document and redirect
   */
  const shouldAutosave =
    hasSavePermission &&
    ((collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave))
  const validateDraftData =
    collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.validate

  if (shouldAutosave && !validateDraftData && !id && collectionSlug) {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {},
      depth: 0,
      draft: true,
      fallbackLocale: null,
      locale: locale?.code,
      req,
      user,
    })

    if (doc?.id) {
      const redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}/${doc.id}`,
        serverURL,
      })
      redirect(redirectURL)
    } else {
      notFound()
    }
  }

  const entitySlots = renderEntity({
    clientConfig,
    collectionConfig,
    config,
    formState,
    globalConfig,
    hasSavePermission,
    i18n,
    importMap,
    payload,
    permissions,
  })

  const clientProps = { payloadServerAction, ...entitySlots }

  return (
    <DocumentInfoProvider
      apiURL={apiURL}
      collectionSlug={collectionConfig?.slug}
      disableActions={false}
      docPermissions={docPermissions}
      globalSlug={globalConfig?.slug}
      hasPublishPermission={hasPublishPermission}
      hasSavePermission={hasSavePermission}
      id={id}
      initialData={data}
      initialState={formState}
      isEditing={isEditing}
      key={locale?.code}
    >
      {!RootViewOverride && (
        <DocumentHeader
          collectionConfig={collectionConfig}
          globalConfig={globalConfig}
          i18n={i18n}
          payload={payload}
          permissions={permissions}
        />
      )}
      <HydrateAuthProvider permissions={permissions} />
      {/**
       * After bumping the Next.js canary to 104, and React to 19.0.0-rc-06d0b89e-20240801" we have to deepCopy the permissions object (https://github.com/payloadcms/payload/pull/7541).
       * If both HydrateClientUser and RenderCustomComponent receive the same permissions object (same object reference), we get a
       * "TypeError: Cannot read properties of undefined (reading '$$typeof')" error when loading up some version views - for example a versions
       * view in the draft-posts collection of the versions test suite. RenderCustomComponent is what renders the versions view.
       *
       * // TODO: Revisit this in the future and figure out why this is happening. Might be a React/Next.js bug. We don't know why it happens, and a future React/Next version might unbreak this (keep an eye on this and remove deepCopyObjectSimple if that's the case)
       */}
      <EditDepthProvider
        depth={1}
        key={`${collectionSlug || globalSlug}${locale?.code ? `-${locale?.code}` : ''}`}
      >
        {ErrorView ? (
          <RenderServerComponent
            clientProps={clientProps}
            Component={ErrorView.ComponentConfig || ErrorView.Component}
            importMap={importMap}
            serverProps={serverProps}
          />
        ) : (
          <RenderServerComponent
            clientProps={clientProps}
            Component={
              RootViewOverride
                ? RootViewOverride
                : CustomView?.ComponentConfig || CustomView?.Component
                  ? CustomView?.ComponentConfig || CustomView?.Component
                  : DefaultView?.ComponentConfig || DefaultView?.Component
            }
            importMap={importMap}
            serverProps={serverProps}
          />
        )}
      </EditDepthProvider>
    </DocumentInfoProvider>
  )
}
