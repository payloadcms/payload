import type { AdminViewProps, Where } from 'payload'

import {
  HydrateClientUser,
  ListInfoProvider,
  ListQueryProvider,
  TableColumnsProvider,
} from '@payloadcms/ui'
import { RenderCustomComponent, formatAdminURL } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import { createClientCollectionConfig, mergeListSearchAndWhere } from 'payload'
import { isNumber, isReactComponentOrFunction } from 'payload/shared'
import React, { Fragment } from 'react'

import type { DefaultListViewProps, ListPreferences } from './Default/types.js'

import { DefaultListView } from './Default/index.js'

export { generateListMetadata } from './meta.js'

export const ListView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const {
    collectionConfig,
    locale: fullLocale,
    permissions,
    req,
    req: {
      i18n,
      locale,
      payload,
      payload: { config },
      query,
      user,
    },
    visibleEntities,
  } = initPageResult

  const collectionSlug = collectionConfig?.slug

  if (!permissions?.collections?.[collectionSlug]?.read?.permission) {
    notFound()
  }

  let listPreferences: ListPreferences
  const preferenceKey = `${collectionSlug}-list`

  try {
    listPreferences = (await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        req,
        user,
        where: {
          and: [
            {
              key: {
                equals: preferenceKey,
              },
            },
            {
              'user.relationTo': {
                equals: user.collection,
              },
            },
            {
              'user.value': {
                equals: user?.id,
              },
            },
          ],
        },
      })
      ?.then((res) => res?.docs?.[0]?.value)) as ListPreferences
  } catch (error) {} // eslint-disable-line no-empty

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    const {
      admin: { components: { views: { List: CustomList } = {} } = {} },
    } = collectionConfig

    if (!visibleEntities.collections.includes(collectionSlug)) {
      return notFound()
    }

    let CustomListView = null

    if (CustomList && typeof CustomList === 'function') {
      CustomListView = CustomList
    } else if (typeof CustomList === 'object' && isReactComponentOrFunction(CustomList.Component)) {
      CustomListView = CustomList.Component
    }

    const page = isNumber(query?.page) ? Number(query.page) : 0
    const whereQuery = mergeListSearchAndWhere({
      collectionConfig,
      query: {
        search: typeof query?.search === 'string' ? query.search : undefined,
        where: (query?.where as Where) || undefined,
      },
    })
    const limit = isNumber(query?.limit)
      ? Number(query.limit)
      : listPreferences?.limit || collectionConfig.admin.pagination.defaultLimit
    const sort =
      query?.sort && typeof query.sort === 'string'
        ? query.sort
        : listPreferences?.sort || collectionConfig.defaultSort || undefined

    const data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: null,
      limit,
      locale,
      overrideAccess: false,
      page,
      req,
      sort,
      user,
      where: whereQuery || {},
    })

    const viewComponentProps: DefaultListViewProps = {
      collectionSlug,
      listSearchableFields: collectionConfig.admin.listSearchableFields,
    }

    return (
      <Fragment>
        <HydrateClientUser permissions={permissions} user={user} />
        <ListInfoProvider
          collectionConfig={createClientCollectionConfig({
            collection: collectionConfig,
            t: initPageResult.req.i18n.t,
          })}
          collectionSlug={collectionSlug}
          hasCreatePermission={permissions?.collections?.[collectionSlug]?.create?.permission}
          newDocumentURL={formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/create`,
          })}
        >
          <ListQueryProvider
            data={data}
            defaultLimit={limit || collectionConfig?.admin?.pagination?.defaultLimit}
            defaultSort={sort}
            modifySearchParams
            preferenceKey={preferenceKey}
          >
            <TableColumnsProvider
              collectionSlug={collectionSlug}
              enableRowSelections
              listPreferences={listPreferences}
              preferenceKey={preferenceKey}
            >
              <RenderCustomComponent
                CustomComponent={CustomListView}
                DefaultComponent={DefaultListView}
                componentProps={viewComponentProps}
                serverOnlyProps={{
                  collectionConfig,
                  data,
                  hasCreatePermission:
                    permissions?.collections?.[collectionSlug]?.create?.permission,
                  i18n,
                  limit,
                  listPreferences,
                  locale: fullLocale,
                  newDocumentURL: formatAdminURL({
                    adminRoute,
                    path: `/collections/${collectionSlug}/create`,
                  }),
                  params,
                  payload,
                  permissions,
                  searchParams,
                  user,
                }}
              />
            </TableColumnsProvider>
          </ListQueryProvider>
        </ListInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
