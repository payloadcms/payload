import type { AdminViewProps, ServerSideEditViewProps } from 'payload'

import { DocumentInfoProvider, HydrateClientUser } from '@payloadcms/ui'
import { RenderCustomComponent } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { getDocumentData } from '../Document/getDocumentData.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { EditView } from '../Edit/index.js'
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
    admin: { components: { views: { Account: CustomAccountComponent } = {} } = {}, user: userSlug },
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

    const viewComponentProps: ServerSideEditViewProps = {
      initPageResult,
      params,
      routeSegments: [],
      searchParams,
    }

    return (
      <DocumentInfoProvider
        AfterFields={<Settings i18n={i18n} languageOptions={languageOptions} />}
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
        <DocumentHeader
          collectionConfig={collectionConfig}
          config={payload.config}
          hideTabs
          i18n={i18n}
          permissions={permissions}
        />
        <HydrateClientUser permissions={permissions} user={user} />
        <RenderCustomComponent
          CustomComponent={
            typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
          }
          DefaultComponent={EditView}
          componentProps={viewComponentProps}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      </DocumentInfoProvider>
    )
  }

  return notFound()
}
