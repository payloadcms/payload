import { SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  DefaultList,
  HydrateClientUser,
  DefaultListViewProps,
  TableColumnsProvider,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'
import { ListPreferences } from '../../../../ui/src/views/List/types'

export const CollectionList = async ({
  collectionSlug,
  config: configPromise,
  searchParams,
  route,
}: {
  collectionSlug: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
  route
}) => {
  const { config, payload, permissions, user, collectionConfig } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: true,
    collectionSlug,
    route,
    searchParams,
  })

  let listPreferences: ListPreferences

  try {
    listPreferences = (await payload
      .find({
        collection: 'payload-preferences',
        where: {
          key: {
            equals: `${collectionSlug}-list`,
          },
        },
        limit: 1,
        depth: 0,
      })
      ?.then((res) => res?.docs?.[0]?.value)) as unknown as ListPreferences
  } catch (error) {}

  const {
    routes: { admin },
  } = config

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

    const limit = Number(searchParams?.limit) || collectionConfig.admin.pagination.defaultLimit

    const data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit,
      user,
    })

    const componentProps: DefaultListViewProps = {
      data,
      hasCreatePermission: permissions?.collections?.[collectionSlug]?.create?.permission,
      limit,
      newDocumentURL: `${admin}/collections/${collectionSlug}/create`,
      collectionSlug,
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} permissions={permissions} />
        <TableColumnsProvider collectionSlug={collectionSlug} listPreferences={listPreferences}>
          <RenderCustomComponent
            CustomComponent={ListToRender}
            DefaultComponent={DefaultList}
            componentProps={componentProps}
          />
        </TableColumnsProvider>
      </Fragment>
    )
  }

  return notFound()
}
