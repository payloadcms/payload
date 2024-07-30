import type { AdminViewComponent, AdminViewProps, EditViewComponent } from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateClientUser } from '@payloadcms/ui'
import {
  RenderCustomComponent,
  formatAdminURL,
  isEditing as getIsEditing,
} from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { NotFoundView } from '../NotFound/index.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getMetaBySegment } from './getMetaBySegment.js'
import { getViewsFromConfig } from './getViewsFromConfig.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export const Document: React.FC<AdminViewProps> = async ({
  importMap,
  initPageResult,
  params,
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

  let ViewOverride: MappedComponent<ServerSideEditViewProps>
  let CustomView: MappedComponent<ServerSideEditViewProps>
  let DefaultView: MappedComponent<ServerSideEditViewProps>
  let ErrorView: MappedComponent<AdminViewProps>

  let apiURL: string

  const { data, formState } = await getDocumentData({
    id,
    collectionConfig,
    globalConfig,
    locale,
    req,
  })

  const { docPermissions, hasPublishPermission, hasSavePermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data,
    globalConfig,
    req,
  })

  const createMappedComponent = getCreateMappedComponent({
    importMap,
    serverProps: {
      i18n,
      initPageResult,
      locale,
      params,
      payload,
      permissions,
      routeSegments: segments,
      searchParams,
      user,
    },
  })

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

    ViewOverride =
      collectionConfig?.admin?.components?.views?.Edit?.Default &&
      'Component' in collectionConfig.admin.components.views.Edit.Default
        ? createMappedComponent(
            collectionConfig?.admin?.components?.views?.Edit?.Default
              ?.Component as EditViewComponent, // some type info gets lost from Config => SanitizedConfig due to our usage of Deep type operations from ts-essentials. Despite .Component being defined as EditViewComponent, this info is lost and we need cast it here.
          )
        : null

    if (!ViewOverride) {
      const collectionViews = getViewsFromConfig({
        collectionConfig,
        config,
        docPermissions,
        routeSegments: segments,
      })

      CustomView = createMappedComponent(
        collectionViews?.CustomView?.payloadComponent,
        undefined,
        collectionViews?.CustomView?.Component,
      )
      DefaultView = createMappedComponent(
        collectionViews?.DefaultView?.payloadComponent,
        undefined,
        collectionViews?.DefaultView?.Component,
      )
      ErrorView = createMappedComponent(
        collectionViews?.ErrorView?.payloadComponent,
        undefined,
        collectionViews?.ErrorView?.Component,
      )
    }

    if (!CustomView && !DefaultView && !ViewOverride && !ErrorView) {
      ErrorView = createMappedComponent(undefined, undefined, NotFoundView)
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

    const editConfig = globalConfig?.admin?.components?.views?.Edit
    ViewOverride = typeof editConfig === 'function' ? editConfig : null

    if (!ViewOverride) {
      const globalViews = getViewsFromConfig({
        config,
        docPermissions,
        globalConfig,
        routeSegments: segments,
      })

      CustomView = createMappedComponent(
        globalViews?.CustomView?.payloadComponent,
        undefined,
        globalViews?.CustomView?.Component,
      )
      DefaultView = createMappedComponent(
        globalViews?.DefaultView?.payloadComponent,
        undefined,
        globalViews?.DefaultView?.Component,
      )
      ErrorView = createMappedComponent(
        globalViews?.ErrorView?.payloadComponent,
        undefined,
        globalViews?.ErrorView?.Component,
      )

      if (!CustomView && !DefaultView && !ViewOverride && !ErrorView) {
        ErrorView = createMappedComponent(undefined, undefined, NotFoundView)
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
    >
      {!ViewOverride?.Component && (
        <DocumentHeader
          collectionConfig={collectionConfig}
          config={payload.config}
          globalConfig={globalConfig}
          i18n={i18n}
          permissions={permissions}
        />
      )}
      <HydrateClientUser permissions={permissions} user={user} />
      <EditDepthProvider
        depth={1}
        key={`${collectionSlug || globalSlug}${locale?.code ? `-${locale?.code}` : ''}`}
      >
        {ErrorView?.Component ? (
          <RenderMappedComponent component={ErrorView} />
        ) : (
          <RenderMappedComponent
            component={
              ViewOverride?.Component
                ? ViewOverride
                : CustomView?.Component
                  ? CustomView
                  : DefaultView
            }
          />
        )}
      </EditDepthProvider>
    </DocumentInfoProvider>
  )
}
