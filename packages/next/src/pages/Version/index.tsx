import React from 'react'

import { DefaultVersionView } from './Default'
import { Document } from 'payload/types'
import type { Option, ServerSideEditViewProps } from '@payloadcms/ui'
import { CollectionPermission, GlobalPermission } from 'payload/auth'
import { notFound } from 'next/navigation'

export const VersionView: React.FC<ServerSideEditViewProps> = async (props) => {
  const { config, permissions, payload, user, params } = props

  const versionID = params.segments[2]

  const collectionConfig = 'collectionConfig' in props && props?.collectionConfig
  const globalConfig = 'globalConfig' in props && props?.globalConfig
  const id = 'id' in props ? props.id : undefined

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const { localization } = config

  let docPermissions: CollectionPermission | GlobalPermission
  let slug: string

  let doc: Document
  let publishedDoc: Document
  let mostRecentDoc: Document
  let comparisonDoc: Document

  if (collectionSlug) {
    slug = collectionSlug
    docPermissions = permissions.collections[collectionSlug]

    try {
      doc = await payload.findVersionByID({
        collection: slug,
        id: versionID,
        depth: 1,
        locale: '*',
      })

      publishedDoc = await payload.findByID({
        collection: slug,
        id,
        depth: 1,
        draft: false,
        locale: '*',
      })

      mostRecentDoc = await payload.findByID({
        collection: slug,
        id,
        depth: 1,
        draft: true,
        locale: '*',
      })

      // TODO: this `id` will be dynamic based on the user's selection
      // Use URL params to achieve this
      comparisonDoc = await payload.findByID({
        collection: slug,
        id,
        depth: 1,
        draft: true,
        locale: '*',
      })
    } catch (error) {
      return notFound()
    }
  }

  if (globalSlug) {
    slug = globalSlug
    docPermissions = permissions.globals[globalSlug]

    try {
      doc = payload.findGlobalVersionByID({
        slug,
        id: versionID,
        depth: 1,
        locale: '*',
      })

      publishedDoc = payload.findGlobal({
        slug,
        depth: 1,
        draft: false,
        locale: '*',
      })

      mostRecentDoc = payload.findGlobal({
        slug,
        depth: 1,
        draft: true,
        locale: '*',
      })

      // TODO: this `slug` will be dynamic based on the user's selection
      // Use URL params to achieve this
      comparisonDoc = payload.findGlobal({
        slug,
        depth: 1,
        draft: true,
        locale: '*',
      })
    } catch (error) {
      return notFound()
    }
  }

  const localeOptions: Option[] =
    localization &&
    localization?.locales &&
    localization.locales.map(({ code, label }) => ({
      label: typeof label === 'string' ? label : '',
      value: code,
    }))

  if (!doc) {
    return notFound()
  }

  return (
    <DefaultVersionView
      collectionSlug={collectionSlug}
      globalSlug={globalSlug}
      comparisonDoc={comparisonDoc}
      doc={doc}
      localeOptions={localeOptions}
      mostRecentDoc={mostRecentDoc}
      id={id}
      permissions={permissions}
      publishedDoc={publishedDoc}
      user={user}
      versionID={versionID}
      docPermissions={docPermissions}
    />
  )
}
