import type { AdminViewProps, ClientCollectionConfig, Where } from 'payload'

import {
  HydrateAuthProvider,
  ListInfoProvider,
  ListQueryProvider,
  TableColumnsProvider,
} from '@payloadcms/ui'
import { RenderComponent, formatAdminURL, getCreateMappedComponent } from '@payloadcms/ui/shared'
import { createClientCollectionConfig } from '@payloadcms/ui/utilities/createClientConfig'
import { notFound } from 'next/navigation.js'
import { deepCopyObjectSimple, mergeListSearchAndWhere } from 'payload'
import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import type { ListPreferences } from './Default/types.js'

import { DefaultEditView } from '../Edit/Default/index.js'
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
    if (!visibleEntities.collections.includes(collectionSlug)) {
      return notFound()
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

    const createMappedComponent = getCreateMappedComponent({
      importMap: payload.importMap,
      serverProps: {
        collectionConfig,
        collectionSlug,
        data,
        hasCreatePermission: permissions?.collections?.[collectionSlug]?.create?.permission,
        i18n,
        limit,
        listPreferences,
        listSearchableFields: collectionConfig.admin.listSearchableFields,
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
      },
    })

    const ListComponent = createMappedComponent(
      collectionConfig?.admin?.components?.views?.List?.Component,
      undefined,
      DefaultListView,
      'collectionConfig?.admin?.components?.views?.List?.Component',
    )

    let clientCollectionConfig = deepCopyObjectSimple(
      collectionConfig,
    ) as unknown as ClientCollectionConfig
    clientCollectionConfig = createClientCollectionConfig({
      DefaultEditView,
      DefaultListView,
      clientCollection: clientCollectionConfig,
      collection: collectionConfig,
      createMappedComponent,
      i18n,
      importMap: payload.importMap,
      payload,
    })

    return (
      <Fragment>
        <HydrateAuthProvider permissions={permissions} />
        <ListInfoProvider
          collectionConfig={clientCollectionConfig}
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
              <RenderComponent
                clientProps={{
                  collectionSlug,
                  listSearchableFields: collectionConfig?.admin?.listSearchableFields,
                }}
                mappedComponent={ListComponent}
              />
            </TableColumnsProvider>
          </ListQueryProvider>
        </ListInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
