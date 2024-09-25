import type { AdminViewProps, Where } from 'payload'

import {
  DefaultListView,
  HydrateAuthProvider,
  ListInfoProvider,
  ListQueryProvider,
} from '@payloadcms/ui'
import { type ListPreferences } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import { mergeListSearchAndWhere } from 'payload'
import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

export { generateListMetadata } from './meta.js'

export const ListView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  // payloadServerAction,
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

    return (
      <Fragment>
        <HydrateAuthProvider permissions={permissions} />
        <ListInfoProvider
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
            <RenderServerComponent
              clientProps={{
                collectionSlug,
                listPreferences,
              }}
              Component={collectionConfig?.admin?.components?.views?.list.Component}
              Fallback={DefaultListView}
              importMap={payload.importMap}
              serverProps={{
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
              }}
            />
          </ListQueryProvider>
        </ListInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
