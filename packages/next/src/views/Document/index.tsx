import type { AdminViewProps, Data, PayloadComponent, ServerSideEditViewProps } from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL, isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { notFound, redirect } from 'next/navigation.js'
import { logError } from 'payload'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'
import type { ViewFromConfig } from './getViewsFromConfig.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { NotFoundView } from '../NotFound/index.js'
import { getDocPreferences } from './getDocPreferences.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getIsLocked } from './getIsLocked.js'
import { getMetaBySegment } from './getMetaBySegment.js'
import { getVersions } from './getVersions.js'
import { getViewsFromConfig } from './getViewsFromConfig.js'
import { renderDocumentSlots } from './renderDocumentSlots.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

// This function will be responsible for rendering an Edit Document view
// it will be called on the server for Edit page views as well as
// called on-demand from document drawers
export const renderDocument = async ({
  disableActions,
  drawerSlug,
  importMap,
  initialData,
  initPageResult,
  overrideEntityVisibility,
  params,
  redirectAfterDelete,
  redirectAfterDuplicate,
  searchParams,
}: {
  overrideEntityVisibility?: boolean
} & AdminViewProps): Promise<{
  data: Data
  Document: React.ReactNode
}> => {
  const {
    collectionConfig,
    docID: idFromArgs,
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
  let isEditing = getIsEditing({ id: idFromArgs, collectionSlug, globalSlug })

  let RootViewOverride: PayloadComponent
  let CustomView: ViewFromConfig<ServerSideEditViewProps>
  let DefaultView: ViewFromConfig<ServerSideEditViewProps>
  let ErrorView: ViewFromConfig<AdminViewProps>

  let apiURL: string

  // Fetch the doc required for the view
  let doc =
    initialData ||
    (await getDocumentData({
      id: idFromArgs,
      collectionSlug,
      globalSlug,
      locale,
      payload,
      req,
      user,
    }))

  if (isEditing && !doc) {
    throw new Error('not-found')
  }

  const [
    docPreferences,
    { docPermissions, hasPublishPermission, hasSavePermission },
    { currentEditor, isLocked, lastUpdateTime },
  ] = await Promise.all([
    // Get document preferences
    getDocPreferences({
      id: idFromArgs,
      collectionSlug,
      globalSlug,
      payload,
      user,
    }),

    // Get permissions
    getDocumentPermissions({
      id: idFromArgs,
      collectionConfig,
      data: doc,
      globalConfig,
      req,
    }),

    // Fetch document lock state
    getIsLocked({
      id: idFromArgs,
      collectionConfig,
      globalConfig,
      isEditing,
      req,
    }),
  ])

  const [
    { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount },
    { state: formState },
  ] = await Promise.all([
    getVersions({
      id: idFromArgs,
      collectionConfig,
      doc,
      docPermissions,
      globalConfig,
      locale: locale?.code,
      payload,
      user,
    }),
    buildFormState({
      id: idFromArgs,
      collectionSlug,
      data: doc,
      docPermissions,
      docPreferences,
      fallbackLocale: false,
      globalSlug,
      locale: locale?.code,
      operation: (collectionSlug && idFromArgs) || globalSlug ? 'update' : 'create',
      renderAllFields: true,
      req,
      schemaPath: collectionSlug || globalSlug,
    }),
  ])

  const serverProps: ServerSideEditViewProps = {
    doc,
    i18n,
    initPageResult,
    locale,
    params,
    payload,
    permissions,
    routeSegments: segments,
    searchParams,
    user,
  }

  if (collectionConfig) {
    if (
      !visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug) &&
      !overrideEntityVisibility
    ) {
      throw new Error('not-found')
    }

    const params = new URLSearchParams()
    if (collectionConfig.versions?.drafts) {
      params.append('draft', 'true')
    }
    if (locale?.code) {
      params.append('locale', locale.code)
    }

    const apiQueryParams = `?${params.toString()}`

    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${idFromArgs}${apiQueryParams}`

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
      throw new Error('not-found')
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

  let id = idFromArgs

  if (shouldAutosave && !validateDraftData && !idFromArgs && collectionSlug) {
    doc = await payload.create({
      collection: collectionSlug,
      data: initialData || {},
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: locale?.code,
      req,
      user,
    })

    if (doc?.id) {
      id = doc.id
      isEditing = getIsEditing({ id: doc.id, collectionSlug, globalSlug })

      if (!drawerSlug) {
        const redirectURL = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${doc.id}`,
          serverURL,
        })

        redirect(redirectURL)
      }
    } else {
      throw new Error('not-found')
    }
  }

  const documentSlots = renderDocumentSlots({
    collectionConfig,
    globalConfig,
    hasSavePermission,
    permissions: docPermissions,
    req,
  })

  const clientProps = { formState, ...documentSlots }

  return {
    data: doc,
    Document: (
      <DocumentInfoProvider
        apiURL={apiURL}
        collectionSlug={collectionConfig?.slug}
        currentEditor={currentEditor}
        disableActions={disableActions ?? false}
        docPermissions={docPermissions}
        globalSlug={globalConfig?.slug}
        hasPublishedDoc={hasPublishedDoc}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        id={id}
        initialData={doc}
        initialState={formState}
        isEditing={isEditing}
        isLocked={isLocked}
        key={locale?.code}
        lastUpdateTime={lastUpdateTime}
        mostRecentVersionIsAutosaved={mostRecentVersionIsAutosaved}
        redirectAfterDelete={redirectAfterDelete}
        redirectAfterDuplicate={redirectAfterDuplicate}
        unpublishedVersionCount={unpublishedVersionCount}
        versionCount={versionCount}
      >
        {!RootViewOverride && !drawerSlug && (
          <DocumentHeader
            collectionConfig={collectionConfig}
            globalConfig={globalConfig}
            i18n={i18n}
            payload={payload}
            permissions={permissions}
          />
        )}
        <HydrateAuthProvider permissions={permissions} />
        <EditDepthProvider>
          {ErrorView
            ? RenderServerComponent({
                clientProps,
                Component: ErrorView.ComponentConfig || ErrorView.Component,
                importMap,
                serverProps,
              })
            : RenderServerComponent({
                clientProps,
                Component: RootViewOverride
                  ? RootViewOverride
                  : CustomView?.ComponentConfig || CustomView?.Component
                    ? CustomView?.ComponentConfig || CustomView?.Component
                    : DefaultView?.ComponentConfig || DefaultView?.Component,
                importMap,
                serverProps,
              })}
        </EditDepthProvider>
      </DocumentInfoProvider>
    ),
  }
}

export const Document: React.FC<AdminViewProps> = async (args) => {
  try {
    const { Document: RenderedDocument } = await renderDocument(args)
    return RenderedDocument
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    logError({ err: error, payload: args.initPageResult.req.payload })

    if (error.message === 'not-found') {
      notFound()
    }
  }
}
