import { SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  DefaultList,
  HydrateClientUser,
  DefaultListViewProps,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'

export const CollectionList = async ({
  collectionSlug,
  config: configPromise,
  searchParams,
}: {
  collectionSlug: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user, collectionConfig } = await initPage({
    configPromise,
    redirectUnauthenticatedUser: true,
    collectionSlug,
  })

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
        <RenderCustomComponent
          CustomComponent={ListToRender}
          DefaultComponent={DefaultList}
          componentProps={componentProps}
        />
      </Fragment>
    )
  }

  return notFound()
}
