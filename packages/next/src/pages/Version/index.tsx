import type { Option } from '@payloadcms/ui'
import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { Document } from 'payload/types'

import { notFound } from 'next/navigation'
import React from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { DefaultVersionView } from './Default'

export const VersionView: React.FC<ServerSideEditViewProps> = async (props) => {
  const { config, params, payload, permissions, user } = props

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

  if (collectionSlug) {
    slug = collectionSlug
    docPermissions = permissions.collections[collectionSlug]

    try {
      doc = await payload.findVersionByID({
        id: versionID,
        collection: slug,
        depth: 1,
        locale: '*',
      })

      publishedDoc = await payload.findByID({
        id,
        collection: slug,
        depth: 1,
        draft: false,
        locale: '*',
      })

      mostRecentDoc = await payload.findByID({
        id,
        collection: slug,
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
        id: versionID,
        depth: 1,
        locale: '*',
        slug,
      })

      publishedDoc = payload.findGlobal({
        depth: 1,
        draft: false,
        locale: '*',
        slug,
      })

      mostRecentDoc = payload.findGlobal({
        depth: 1,
        draft: true,
        locale: '*',
        slug,
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
      doc={doc}
      docPermissions={docPermissions}
      globalSlug={globalSlug}
      id={id}
      initialComparisonDoc={mostRecentDoc}
      localeOptions={localeOptions}
      mostRecentDoc={mostRecentDoc}
      permissions={permissions}
      publishedDoc={publishedDoc}
      user={user}
      versionID={versionID}
    />
  )
}
