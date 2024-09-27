import type { AdminViewProps } from 'payload'

import { DocumentInfoProvider, EditDepthProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { getDocumentData } from '../Document/getDocumentData.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { AccountClient } from './index.client.js'
import { Settings } from './Settings/index.js'

export { generateAccountMetadata } from './meta.js'

export const Account: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
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
    admin: {
      components: { views: { Account: CustomAccountComponent } = {} } = {},
      theme,
      user: userSlug,
    },
    routes: { api },
    serverURL,
  } = config

  const collectionConfig = config.collections.find((collection) => collection.slug === userSlug)

  if (collectionConfig && user?.id) {
    const { docPermissions, hasPublishPermission, hasSavePermission } =
      await getDocumentPermissions({
        id: user.id,
        collectionConfig,
        data: user,
        req,
      })

    const { data, formState } = await getDocumentData({
      id: user.id,
      collectionConfig,
      locale,
      req,
    })

    return (
      <DocumentInfoProvider
        AfterFields={<Settings i18n={i18n} languageOptions={languageOptions} theme={theme} />}
        apiURL={`${serverURL}${api}/${userSlug}${user?.id ? `/${user.id}` : ''}`}
        collectionSlug={userSlug}
        docPermissions={docPermissions}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        id={user?.id.toString()}
        initialData={data}
        initialState={formState}
        isEditing
      >
        <EditDepthProvider depth={1}>
          <DocumentHeader
            collectionConfig={collectionConfig}
            hideTabs
            i18n={i18n}
            payload={payload}
            permissions={permissions}
          />
          <HydrateAuthProvider permissions={permissions} />
          <RenderServerComponent
            Component={CustomAccountComponent}
            Fallback={AccountClient}
            importMap={payload.importMap}
            serverProps={{
              i18n,
              initPageResult,
              locale,
              params,
              payload,
              permissions,
              routeSegments: [],
              searchParams,
              user,
            }}
          />
          <AccountClient />
        </EditDepthProvider>
      </DocumentInfoProvider>
    )
  }

  return notFound()
}
