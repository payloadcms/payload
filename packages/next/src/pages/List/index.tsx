import type { DefaultListViewProps } from '@payloadcms/ui'
import type { SanitizedConfig } from 'payload/types'

import {
  DefaultList,
  HydrateClientUser,
  RenderCustomComponent,
  TableColumnsProvider,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import React, { Fragment } from 'react'

import type { ListPreferences } from '../../../../ui/src/views/List/types'

import { ListInfoProvider } from '../../../../ui/src/providers/ListInfo'
import { initPage } from '../../utilities/initPage'

export const ListView = async ({
  collectionSlug,
  config: configPromise,
  route,
  searchParams,
}: {
  collectionSlug: string
  config: Promise<SanitizedConfig>
  route
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { collectionConfig, config, payload, permissions, user } = await initPage({
    collectionSlug,
    config: configPromise,
    redirectUnauthenticatedUser: true,
    route,
    searchParams,
  })

  let listPreferences: ListPreferences

  try {
    listPreferences = (await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        where: {
          key: {
            equals: `${collectionSlug}-list`,
          },
        },
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
      collectionSlug,
    }

    return (
      <Fragment>
        <HydrateClientUser permissions={permissions} user={user} />
        <ListInfoProvider
          collectionSlug={collectionSlug}
          data={data}
          hasCreatePermission={permissions?.collections?.[collectionSlug]?.create?.permission}
          limit={limit}
          newDocumentURL={`${admin}/collections/${collectionSlug}/create`}
        >
          <TableColumnsProvider collectionSlug={collectionSlug} listPreferences={listPreferences}>
            <RenderCustomComponent
              CustomComponent={ListToRender}
              DefaultComponent={DefaultList}
              componentProps={componentProps}
            />
          </TableColumnsProvider>
        </ListInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
