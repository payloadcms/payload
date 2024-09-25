import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { AdminViewProps } from 'payload'

import { HydrateAuthProvider } from '@payloadcms/ui'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DefaultDashboard } from './Default/index.js'

export { generateDashboardMetadata } from './meta.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const Dashboard: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
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

  const globalSlugs = config.globals.map((global) => global.slug)

  // Filter the slugs based on permissions and visibility
  const filteredGlobalSlugs = globalSlugs.filter(
    (slug) =>
      permissions?.globals?.[slug]?.read?.permission && visibleEntities.globals.includes(slug),
  )

  const globalData = await Promise.all(
    filteredGlobalSlugs.map(async (slug) => {
      const data = await payload.findGlobal({
        slug,
        depth: 0,
        includeLockStatus: true,
      })

      return {
        slug,
        data,
      }
    }),
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

  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <RenderServerComponent
        clientProps={{
          Link,
          locale,
        }}
        Component={CustomDashboardComponent}
        Fallback={DefaultDashboard}
        importMap={payload.importMap}
        serverProps={{
          globalData,
          i18n,
          Link,
          locale,
          navGroups,
          params,
          payload,
          permissions,
          searchParams,
          user,
          visibleEntities,
        }}
      />
    </Fragment>
  )
}
