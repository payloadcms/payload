import type { AdminViewServerProps, ComponentRenderer, DocumentViewServerPropsOnly } from 'payload'

import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { DefaultEditView } from '../Edit/index.js'
import { getAccountViewData } from './getAccountViewData.js'
import { AccountClient } from './index.client.js'
import { Settings } from './Settings/index.js'

export type AccountViewProps = {
  onNotFound?: () => never
  renderComponent: ComponentRenderer
} & AdminViewServerProps

export async function AccountView({
  initPageResult,
  onNotFound,
  params,
  renderComponent,
  searchParams,
}: AccountViewProps) {
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

  let accountData
  try {
    accountData = await getAccountViewData({
      locale,
      renderComponent,
      req,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found' && onNotFound) {
      return onNotFound()
    }
    throw err
  }

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
          renderComponent={renderComponent}
          req={req}
        />
        <HydrateAuthProvider permissions={permissions} />
        {renderComponent({
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
            renderComponent,
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
