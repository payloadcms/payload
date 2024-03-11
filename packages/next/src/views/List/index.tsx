import {
  HydrateClientUser,
  ListInfoProvider,
  RenderCustomComponent,
  TableColumnsProvider,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import { isEntityHidden } from 'payload/utilities'
import React, { Fragment } from 'react'

import type { AdminViewProps } from '../Root/index.js'
import type { DefaultListViewProps, ListPreferences } from './Default/types.js'

import { DefaultListView } from './Default/index.js'

export { generateListMetadata } from './meta.js'

export const ListView: React.FC<AdminViewProps> = async ({ initPageResult, searchParams }) => {
  const {
    collectionConfig,
    permissions,
    req: {
      payload,
      payload: { config },
      user,
    },
  } = initPageResult

  const collectionSlug = collectionConfig?.slug

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
      ?.then((res) => res?.docs?.[0]?.value)) as ListPreferences
  } catch (error) {} // eslint-disable-line no-empty

  const {
    routes: { admin },
  } = config

  if (collectionConfig) {
    const {
      admin: { components: { views: { List: CustomList } = {} } = {}, hidden },
    } = collectionConfig

    if (isEntityHidden({ hidden, user })) {
      return notFound()
    }

    let CustomListView = null

    if (CustomList && typeof CustomList === 'function') {
      CustomListView = CustomList
    } else if (typeof CustomList === 'object' && typeof CustomList.Component === 'function') {
      CustomListView = CustomList.Component
    }

    const limit = Number(searchParams?.limit) || collectionConfig.admin.pagination.defaultLimit

    const data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit,
      overrideAccess: false,
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
          <TableColumnsProvider
            collectionSlug={collectionSlug}
            enableRowSelections
            listPreferences={listPreferences}
          >
            <RenderCustomComponent
              CustomComponent={CustomListView}
              DefaultComponent={DefaultListView}
              componentProps={componentProps}
            />
          </TableColumnsProvider>
        </ListInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
