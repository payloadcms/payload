import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { AdminViewProps } from 'payload'

import { HydrateAuthProvider } from '@payloadcms/ui'
import {
  EntityType,
  getCreateMappedComponent,
  groupNavItems,
  RenderComponent,
} from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

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

  const lockDurationDefault = 300 // Default 5 minutes in seconds

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

  const globalConfigs = config.globals.map((global) => ({
    slug: global.slug,
    lockDuration:
      global.lockDocuments === false
        ? null // Set lockDuration to null if locking is disabled
        : typeof global.lockDocuments === 'object'
          ? global.lockDocuments.duration
          : lockDurationDefault,
  }))

  // Filter the slugs based on permissions and visibility
  const filteredGlobalConfigs = globalConfigs.filter(
    ({ slug, lockDuration }) =>
      lockDuration !== null && // Ensure lockDuration is valid
      permissions?.globals?.[slug]?.read?.permission &&
      visibleEntities.globals.includes(slug),
  )

  const globalData = await Promise.all(
    filteredGlobalConfigs.map(async ({ slug, lockDuration }) => {
      const data = await payload.findGlobal({
        slug,
        depth: 0,
        includeLockStatus: true,
      })

      return {
        slug,
        data,
        lockDuration,
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

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
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
