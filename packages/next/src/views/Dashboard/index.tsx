import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { AdminViewProps } from 'payload'

import { HydrateAuthProvider } from '@payloadcms/ui'
import {
  EntityType,
  RenderComponent,
  getCreateMappedComponent,
  groupNavItems,
} from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

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

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
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
    },
  })

  const mappedDashboardComponent = createMappedComponent(
    CustomDashboardComponent?.Component,
    undefined,
    DefaultDashboard,
    'CustomDashboardComponent.Component',
  )

  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <RenderComponent
        clientProps={{
          Link,
          locale,
        }}
        mappedComponent={mappedDashboardComponent}
      />
    </Fragment>
  )
}
