import type { AdminViewServerProps, DocumentViewServerPropsOnly } from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { getAccountViewData } from '@payloadcms/ui/views/Account/getAccountViewData'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { EditView } from '../Edit/index.js'
import { AccountClient } from './index.client.js'
import { Settings } from './Settings/index.js'

export async function AccountView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
  } = config

  try {
    const accountData = await getAccountViewData({
      locale,
      renderComponent: RenderServerComponent,
      req,
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
        apiURL={accountData.apiURL}
        collectionSlug={userSlug}
        currentEditor={accountData.currentEditor}
        docPermissions={accountData.docPermissions}
        hasDeletePermission={accountData.hasDeletePermission}
        hasPublishedDoc={accountData.hasPublishedDoc}
        hasPublishPermission={accountData.hasPublishPermission}
        hasSavePermission={accountData.hasSavePermission}
        hasTrashPermission={accountData.hasTrashPermission}
        id={user?.id}
        initialData={accountData.data}
        initialState={accountData.formState}
        isEditing
        isLocked={accountData.isLocked}
        lastUpdateTime={accountData.lastUpdateTime}
        mostRecentVersionIsAutosaved={accountData.mostRecentVersionIsAutosaved}
        unpublishedVersionCount={accountData.unpublishedVersionCount}
        versionCount={accountData.versionCount}
      >
        <EditDepthProvider>
          <DocumentHeader
            collectionConfig={accountData.collectionConfig}
            hideTabs
            permissions={permissions}
            renderComponent={RenderServerComponent}
            req={req}
          />
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            Component: config.admin?.components?.views?.account?.Component,
            Fallback: EditView,
            importMap: payload.importMap,
            serverProps: {
              doc: accountData.data,
              hasPublishedDoc: accountData.hasPublishedDoc,
              i18n,
              initPageResult,
              locale,
              params,
              payload,
              permissions,
              renderComponent: RenderServerComponent,
              routeSegments: [],
              searchParams,
              user,
            } satisfies DocumentViewServerPropsOnly,
          })}
          <AccountClient />
        </EditDepthProvider>
      </DocumentInfoProvider>
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found') {
      return notFound()
    }
    throw err
  }
}
