import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { AdminViewServerProps, TypedUser } from 'payload'

import { HydrateAuthProvider, SetStepNav } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { DefaultDashboard } from './Default/index.js'

const globalLockDurationDefault = 300

export async function DashboardView(props: AdminViewServerProps) {
  const {
    locale,
    permissions,
    req: {
      i18n,
      payload: { config },
      payload,
      user,
    },
    req,
    visibleEntities,
  } = props.initPageResult
  const collections = config.collections.filter(
    (collection) =>
      permissions?.collections?.[collection.slug]?.read &&
      visibleEntities.collections.includes(collection.slug),
  )

  const globals = config.globals.filter(
    (global) =>
      permissions?.globals?.[global.slug]?.read && visibleEntities.globals.includes(global.slug),
  )

  // Query locked global documents only if there are globals in the config
  let globalData: DashboardViewServerPropsOnly['globalData'] = []

  if (config.globals.length > 0) {
    const lockedDocuments = await payload.find({
      collection: 'payload-locked-documents',
      depth: 1,
      overrideAccess: false,
      pagination: false,
      req,
      select: {
        globalSlug: true,
        updatedAt: true,
        user: true,
      },
      where: {
        globalSlug: {
          exists: true,
        },
      },
    })

    // Map over globals to include `lockDuration` and lock data for each global slug
    globalData = config.globals.map((global) => {
      const lockDuration =
        typeof global.lockDocuments === 'object'
          ? global.lockDocuments.duration
          : globalLockDurationDefault

      const lockedDoc = lockedDocuments.docs.find((doc) => doc.globalSlug === global.slug)

      return {
        slug: global.slug,
        data: {
          _isLocked: !!lockedDoc,
          _lastEditedAt: (lockedDoc?.updatedAt as string) ?? null,
          _userEditing: (lockedDoc?.user as { value?: TypedUser })?.value ?? null,
        },
        lockDuration,
      }
    })
  }

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
      <SetStepNav nav={[]} />
      {RenderServerComponent({
        clientProps: {
          locale,
        } satisfies DashboardViewClientProps,
        Component: config.admin?.components?.views?.dashboard?.Component,
        Fallback: DefaultDashboard,
        importMap: payload.importMap,
        serverProps: {
          ...props,
          globalData,
          i18n,
          locale,
          navGroups,
          payload,
          permissions,
          user,
          visibleEntities,
        } satisfies DashboardViewServerPropsOnly,
      })}
    </Fragment>
  )
}
