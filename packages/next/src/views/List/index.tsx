import type { ListPreferences, ListViewClientProps } from '@payloadcms/ui'
import type { AdminViewProps, Where } from 'payload'

import {
  DefaultListView,
  HydrateAuthProvider,
  ListInfoProvider,
  ListQueryProvider,
} from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import { filterFields } from 'packages/ui/src/elements/TableColumns/filterFields.js'
import { getInitialColumns } from 'packages/ui/src/elements/TableColumns/getInitialColumns.js'
import { renderFilters, renderTable } from 'packages/ui/src/utilities/renderTable.js'
import { mergeListSearchAndWhere } from 'payload'
import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../../../ui/src/elements/RenderServerComponent/index.js'
import { ListDrawerHeader } from '../../elements/ListDrawerHeader/index.js'

export { generateListMetadata } from './meta.js'

export const renderListView = async (
  args: {
    enableRowSelections: boolean
  } & AdminViewProps,
): Promise<{
  List: React.ReactNode
}> => {
  const { clientConfig, drawerSlug, enableRowSelections, initPageResult, params, searchParams } =
    args

  const {
    collectionConfig,
    collectionConfig: {
      slug: collectionSlug,
      admin: { defaultColumns, useAsTitle },
      defaultSort,
      fields,
    },
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

  if (!permissions?.collections?.[collectionSlug]?.read?.permission) {
    throw new Error('not-found')
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
  } catch (_err) {} // eslint-disable-line no-empty

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    if (!visibleEntities.collections.includes(collectionSlug)) {
      throw new Error('not-found')
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
        : listPreferences?.sort ||
          (typeof collectionConfig.defaultSort === 'string'
            ? collectionConfig.defaultSort
            : undefined)

    const data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: null,
      includeLockStatus: true,
      limit,
      locale,
      overrideAccess: false,
      page,
      req,
      sort,
      user,
      where: whereQuery || {},
    })

    const initialColumns = getInitialColumns(filterFields(fields), useAsTitle, defaultColumns)

    const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

    const { columnState, Table } = renderTable({
      clientFields: clientCollectionConfig?.fields,
      collectionSlug,
      columnPreferences: listPreferences?.columns,
      columns: initialColumns,
      docs: data.docs,
      drawerSlug,
      enableRowSelections,
      fields,
      importMap: payload.importMap,
      useAsTitle,
    })

    const renderedFilters = renderFilters(fields, req.payload.importMap)

    const clientProps: ListViewClientProps = {
      collectionSlug,
      columnState,
      listPreferences,
      renderedFilters,
      Table,
    }

    const hasCreatePermission = permissions?.collections?.[collectionSlug]?.create?.permission

    return {
      List: (
        <Fragment>
          <HydrateAuthProvider permissions={permissions} />
          <ListInfoProvider
            // beforeActions={
            //   enableRowSelections
            //     ? [<SelectMany key="select-many" onClick={onBulkSelect} />]
            //     : undefined
            // }
            collectionSlug={collectionSlug}
            hasCreatePermission={hasCreatePermission}
            Header={
              drawerSlug ? (
                <ListDrawerHeader
                  CustomDescription={
                    collectionConfig?.admin?.components?.Description ? (
                      <RenderServerComponent
                        Component={collectionConfig.admin.components.Description}
                        importMap={payload.importMap}
                      />
                    ) : undefined
                  }
                  description={clientCollectionConfig?.admin?.description}
                  drawerSlug={drawerSlug}
                  hasCreatePermission={hasCreatePermission}
                  pluralLabel={clientCollectionConfig?.labels?.plural}
                />
              ) : null
            }
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
              <RenderServerComponent
                clientProps={clientProps}
                Component={collectionConfig?.admin?.components?.views?.list.Component}
                Fallback={DefaultListView}
                importMap={payload.importMap}
                serverProps={{
                  collectionConfig,
                  collectionSlug,
                  data,
                  hasCreatePermission:
                    permissions?.collections?.[collectionSlug]?.create?.permission,
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
                }}
              />
            </ListQueryProvider>
          </ListInfoProvider>
        </Fragment>
      ),
    }
  }

  throw new Error('not-found')
}

export const ListView: React.FC<
  {
    enableRowSelections: boolean
  } & AdminViewProps
> = async (args) => {
  try {
    const { List: RenderedList } = await renderListView({ ...args, enableRowSelections: true })
    return RenderedList
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    }
  }
}
