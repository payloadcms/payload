import type { AdminViewServerProps, DocumentViewServerPropsOnly } from 'payload'

import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import {
  DefaultEditView,
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
} from '../../exports/client/index.js'
import { getAccountViewData } from './getAccountViewData.js'
import { AccountClient } from './index.client.js'
import { Settings } from './Settings/index.js'

/**
 * Framework-agnostic Account view RSC.
 *
 * Loads the current user's account data, renders the `DocumentHeader`,
 * `HydrateAuthProvider`, configured edit view (falling back to `DefaultEditView`),
 * and the client-side `AccountClient`/`Settings` chrome.
 *
 * Throws `Error('not-found')` when the user is unauthenticated or the account
 * cannot be resolved; the framework adapter translates to its native 404.
 */
export const AccountViewRSC = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
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
          Fallback: DefaultEditView,
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
}
