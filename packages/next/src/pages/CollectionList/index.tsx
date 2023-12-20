import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'
import { RenderCustomComponent, TableColumnsProvider } from '@payloadcms/ui/elements'
import { DefaultList } from '@payloadcms/ui/views'

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

  const {
    routes: { admin },
  } = config

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  if (collectionConfig) {
    const {
      admin: { components: { views: { List: CustomList } = {} } = {} },
    } = collectionConfig

    let ListToRender = null

    if (CustomList && typeof CustomList === 'function') {
      ListToRender = CustomList
    } else if (typeof CustomList === 'object' && typeof CustomList.Component === 'function') {
      ListToRender = CustomList.Component
    }

    const initialData = {}

    return (
      <TableColumnsProvider collectionSlug={collectionSlug}>
        <RenderCustomComponent
          CustomComponent={ListToRender}
          DefaultComponent={DefaultList}
          componentProps={{
            collection: collectionConfig,
            data: initialData,
            hasCreatePermission: permissions?.collections?.[collectionSlug]?.create?.permission,
            limit: searchParams?.limit || collectionConfig.admin.pagination.defaultLimit,
            newDocumentURL: `${admin}/collections/${collectionSlug}/create`,
            // resetParams,
            // titleField,
          }}
        />
      </TableColumnsProvider>
    )
  }

  return null
}
