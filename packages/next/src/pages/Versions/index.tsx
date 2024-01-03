import React from 'react'

import { RenderCustomComponent, EditDepthProvider } from '@payloadcms/ui'
import { DefaultVersionsView } from './Default'
import { SanitizedConfig } from 'payload/types'
import { initPage } from '../../utilities/initPage'
import { DefaultVersionsViewProps } from './Default/types'

export const VersionsView = async ({
  collectionSlug,
  globalSlug,
  id,
  config: configPromise,
  searchParams,
}: {
  collectionSlug: string
  globalSlug?: string
  id?: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user } = await initPage(configPromise, true)

  const {
    routes: { admin, api },
    serverURL,
  } = config

  const { limit, page, sort } = searchParams

  let CustomVersionsView: React.ComponentType | null = null
  let docURL: string
  let entityLabel: string
  let slug: string
  let editURL: string

  const collectionConfig = collectionSlug
    ? config.collections.find((collection) => collection.slug === collectionSlug)
    : null

  const globalConfig = globalSlug
    ? config.globals.find((global) => global.slug === globalSlug)
    : null

  let data
  let versionsData

  if (collectionSlug) {
    data = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 0,
      user,
      // draft: true,
    })

    versionsData = await payload.findVersions({
      collection: collectionSlug,
      depth: 0,
      user,
      page: page ? parseInt(page as string, 10) : undefined,
      sort: sort as string,
      // TODO: why won't this work?!
      // throws an `unsupported BSON` error
      // where: {
      //   parent: {
      //     equals: id,
      //   },
      // },
    })

    docURL = `${serverURL}${api}/${slug}/${id}`
    // entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    editURL = `${admin}/collections/${collectionSlug}/${id}`

    // The component definition could come from multiple places in the config
    // we need to cascade into the proper component from the top-down
    // 1. "components.Edit"
    // 2. "components.Edit.Versions"
    // 3. "components.Edit.Versions.Component"
    const EditCollection = collectionConfig?.admin?.components?.views?.Edit

    if (typeof EditCollection === 'function') {
      CustomVersionsView = EditCollection
    } else if (
      typeof EditCollection === 'object' &&
      typeof EditCollection.Versions === 'function'
    ) {
      CustomVersionsView = EditCollection.Versions
    } else if (
      typeof EditCollection?.Versions === 'object' &&
      'Component' in EditCollection.Versions &&
      typeof EditCollection.Versions.Component === 'function'
    ) {
      CustomVersionsView = EditCollection.Versions.Component
    }
  }

  if (globalSlug) {
    data = await payload.findGlobal({
      slug: globalSlug,
      depth: 0,
      user,
      // draft: true,
    })

    versionsData = await payload.findGlobalVersions({
      slug: globalSlug,
      depth: 0,
      user,
      page: page ? parseInt(page as string, 10) : undefined,
      sort: sort as string,
      where: {
        parent: {
          equals: id,
        },
      },
    })

    docURL = `${serverURL}${api}/globals/${globalSlug}`
    // entityLabel = getTranslation(globalConfig.label, i18n)
    editURL = `${admin}/globals/${globalSlug}`

    // See note above about cascading component definitions
    const EditGlobal = global?.admin?.components?.views?.Edit

    if (typeof EditGlobal === 'function') {
      CustomVersionsView = EditGlobal
    } else if (typeof EditGlobal === 'object' && typeof EditGlobal.Versions === 'function') {
      CustomVersionsView = EditGlobal.Versions
    } else if (
      typeof EditGlobal?.Versions === 'object' &&
      'Component' in EditGlobal.Versions &&
      typeof EditGlobal.Versions.Component === 'function'
    ) {
      CustomVersionsView = EditGlobal.Versions.Component
    }
  }

  // useEffect(() => {
  //   const editConfig = (collection || global)?.admin?.components?.views?.Edit
  //   const versionsActions =
  //     editConfig && 'Versions' in editConfig && 'actions' in editConfig.Versions
  //       ? editConfig.Versions.actions
  //       : []

  //   setViewActions(versionsActions)
  // }, [collection, global, setViewActions])

  const componentProps: DefaultVersionsViewProps = {
    id,
    canAccessAdmin: permissions?.canAccessAdmin,
    config,
    collectionConfig,
    data,
    editURL,
    entityLabel,
    globalConfig,
    user,
    versionsData,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  }

  return (
    <EditDepthProvider depth={1}>
      <RenderCustomComponent
        CustomComponent={CustomVersionsView}
        DefaultComponent={DefaultVersionsView}
        componentProps={componentProps}
      />
    </EditDepthProvider>
  )
}
