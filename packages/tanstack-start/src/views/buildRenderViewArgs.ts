import type { RenderListServerFnArgs, ServerFunctionsContextType } from '@payloadcms/ui'
import type { ListQuery, ViewTypes } from 'payload'

import type { SerializablePageState } from './Root/types.js'

export const buildRenderListArgs = (args: {
  pageState: SerializablePageState
  query: ListQuery
}): RenderListServerFnArgs => {
  const { pageState, query } = args

  return {
    collectionSlug: pageState.routeParams.collection,
    enableRowSelections: true,
    query,
    searchParams: pageState.searchParams,
    trash: pageState.viewType === 'trash',
    viewType: pageState.viewType as ViewTypes,
  }
}

export const buildRenderDocumentArgs = (args: {
  pageState: SerializablePageState
}): Parameters<ServerFunctionsContextType['renderDocument']>[0] => {
  const { pageState } = args

  return {
    collectionSlug: pageState.routeParams.collection || pageState.routeParams.global,
    docID: pageState.routeParams.id,
    documentSubViewType: pageState.documentSubViewType,
    paramsOverride: {
      segments: pageState.segments,
    },
    redirectAfterCreate: false,
    searchParams: pageState.searchParams,
    viewType: pageState.viewType as ViewTypes,
  }
}

export const buildRenderBrowseFolderArgs = (args: {
  pageState: SerializablePageState
}): {
  browseByFolderSlugs?: string[]
  folderID?: number | string
  searchParams?: Record<string, string | string[]>
} => {
  const { pageState } = args

  return {
    browseByFolderSlugs: pageState.browseByFolderSlugs,
    folderID: pageState.routeParams.folderID,
    searchParams: pageState.searchParams,
  }
}

export const buildRenderCollectionFolderArgs = (args: {
  pageState: SerializablePageState
}): {
  collectionSlug?: string
  folderID?: number | string
  searchParams?: Record<string, string | string[]>
} => {
  const { pageState } = args

  return {
    collectionSlug: pageState.routeParams.collection,
    folderID: pageState.routeParams.folderID,
    searchParams: pageState.searchParams,
  }
}
