import type { AdminViewServerProps, DocumentViewServerPropsOnly } from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { getDocPreferences } from '../Document/getDocPreferences.js'
import { getDocumentData } from '../Document/getDocumentData.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { getIsLocked } from '../Document/getIsLocked.js'
import { getVersions } from '../Document/getVersions.js'
import { EditView } from '../Edit/index.js'
import { AccountClient } from './index.client.js'
import { Settings } from './Settings/index.js'

export async function Account({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const {
    languageOptions,
    locale,
    permissions,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
  } = initPageResult

  const {
    admin: { theme, user: userSlug },
    routes: { api },
    serverURL,
  } = config

  const collectionConfig = payload?.collections?.[userSlug]?.config

  if (collectionConfig && user?.id) {
    // Fetch the data required for the view
    const data = await getDocumentData({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      locale,
      payload,
      req,
      user,
    })

    if (!data) {
      throw new Error('not-found')
    }

    // Get document preferences
    const docPreferences = await getDocPreferences({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      payload,
      user,
    })

    // Get permissions
    const { docPermissions, hasPublishPermission, hasSavePermission } =
      await getDocumentPermissions({
        id: user.id,
        collectionConfig,
        data,
        req,
      })

    // Build initial form state from data
    const { state: formState } = await buildFormState({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      data,
      docPermissions,
      docPreferences,
      locale: locale?.code,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: collectionConfig.slug,
      skipValidation: true,
    })

    // Fetch document lock state
    const { currentEditor, isLocked, lastUpdateTime } = await getIsLocked({
      id: user.id,
      collectionConfig,
      isEditing: true,
      req,
    })

    // Get all versions required for UI
    const { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount } =
      await getVersions({
        id: user.id,
        collectionConfig,
        doc: data,
        docPermissions,
        locale: locale?.code,
        payload,
        user,
      })

    return (
      <DocumentInfoProvider
        AfterFields={
          <Settings
            i18n={i18n}
            languageOptions={languageOptions}
            payload={payload}
            theme={theme}
            user={user}
          />
        }
        apiURL={`${serverURL}${api}/${userSlug}${user?.id ? `/${user.id}` : ''}`}
        collectionSlug={userSlug}
        currentEditor={currentEditor}
        docPermissions={docPermissions}
        hasPublishedDoc={hasPublishedDoc}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        id={user?.id}
        initialData={data}
        initialState={formState}
        isEditing
        isLocked={isLocked}
        lastUpdateTime={lastUpdateTime}
        mostRecentVersionIsAutosaved={mostRecentVersionIsAutosaved}
        unpublishedVersionCount={unpublishedVersionCount}
        versionCount={versionCount}
      >
        <EditDepthProvider>
          <DocumentHeader
            collectionConfig={collectionConfig}
            hideTabs
            i18n={i18n}
            payload={payload}
            permissions={permissions}
          />
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            Component: config.admin?.components?.views?.account?.Component,
            Fallback: EditView,
            importMap: payload.importMap,
            serverProps: {
              doc: data,
              i18n,
              initPageResult,
              locale,
              params,
              payload,
              permissions,
              routeSegments: [],
              searchParams,
              user,
            } satisfies DocumentViewServerPropsOnly,
          })}
          <AccountClient />
        </EditDepthProvider>
      </DocumentInfoProvider>
    )
  }

  return notFound()
}
