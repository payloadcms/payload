import type { EntityToGroup } from '@payloadcms/ui/utilities/groupNavItems'
import type { AdminViewProps } from 'payload'

import { HydrateClientUser } from '@payloadcms/ui/client'
import { EntityType, RenderCustomComponent, groupNavItems } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

import type { DashboardProps } from './Default/index.js'

import { DefaultDashboard } from './Default/index.js'

export { generateDashboardMetadata } from './meta.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const Dashboard: React.FC<AdminViewProps> = ({ initPageResult, params, searchParams }) => {
  const {
    locale,
    permissions,
    req: {
      i18n,
      payload: { config },
      payload,
      user,
    },
    visibleEntities,
  } = initPageResult

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  const collections = config.collections.filter(
    (collection) =>
      permissions?.collections?.[collection.slug]?.read?.permission &&
      visibleEntities.collections.includes(collection.slug),
  )

  const globals = config.globals.filter(
    (global) =>
      permissions?.globals?.[global.slug]?.read?.permission &&
      visibleEntities.globals.includes(global.slug),
  )

  const navGroups = groupNavItems(
    [
      ...(collections.map((collection) => {
        const entityToGroup: EntityToGroup = {
          type: EntityType.collection,
          entity: collection,
        }

        return entityToGroup
      }) ?? []),
      ...(globals.map((global) => {
        const entityToGroup: EntityToGroup = {
          type: EntityType.global,
          entity: global,
        }

        return entityToGroup
      }) ?? []),
    ],
    permissions,
    i18n,
  )

  const viewComponentProps: DashboardProps = {
    Link,
    i18n,
    locale,
    navGroups,
    params,
    payload,
    permissions,
    searchParams,
    user,
    visibleEntities,
  }

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <RenderCustomComponent
        CustomComponent={
          typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
        }
        DefaultComponent={DefaultDashboard}
        componentProps={viewComponentProps}
        serverOnlyProps={{
          i18n,
          locale,
          params,
          payload,
          permissions,
          searchParams,
          user,
        }}
      />
    </Fragment>
  )
}
