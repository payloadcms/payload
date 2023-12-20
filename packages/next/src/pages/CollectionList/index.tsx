import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'
import { RenderCustomComponent, TableColumnsProvider } from '@payloadcms/ui/elements'
import { DefaultList } from '@payloadcms/ui/views'
import formatFields from '../../../../ui/src/views/List/formatFields'
import { createClientConfig } from '../../createClientConfig'

export const CollectionList = async ({
  collectionSlug,
  config: configPromise,
  searchParams,
}: {
  collectionSlug: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const headers = getHeaders()

  const { permissions } = await auth({
    headers,
    config: configPromise,
  })

  const config = await configPromise
  const clientConfig = await createClientConfig(configPromise)

  const {
    routes: { admin },
  } = config

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  const collectionClientConfig = clientConfig.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  if (collectionConfig) {
    const collectionPermissions = permissions?.collections?.[collectionSlug]
    const hasCreatePermission = collectionPermissions?.create?.permission
    const newDocumentURL = `${admin}/collections/${collectionSlug}/create`
    const defaultLimit = collectionConfig.admin.pagination.defaultLimit
    const fields = formatFields(collectionClientConfig)

    const {
      admin: { components: { views: { List: CustomList } = {} } = {} },
    } = collectionConfig

    let ListToRender = null

    if (CustomList && typeof CustomList === 'function') {
      ListToRender = CustomList
    } else if (typeof CustomList === 'object' && typeof CustomList.Component === 'function') {
      ListToRender = CustomList.Component
    }

    return (
      <TableColumnsProvider collection={collectionClientConfig}>
        <RenderCustomComponent
          CustomComponent={ListToRender}
          DefaultComponent={DefaultList}
          componentProps={{
            collection: { ...collectionClientConfig, fields },
            data: {},
            hasCreatePermission,
            limit: searchParams?.limit || defaultLimit,
            newDocumentURL,
            // resetParams,
            // titleField,
          }}
        />
      </TableColumnsProvider>
    )
  }

  return null
}
