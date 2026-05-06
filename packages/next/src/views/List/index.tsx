import type {
  AdminViewServerProps,
  ListViewClientProps,
  ListViewServerPropsOnly,
  PayloadComponent,
} from 'payload'

import {
  DefaultListView,
  HierarchyListView,
  HydrateAuthProvider,
  HydrateHierarchyProvider,
  ListQueryProvider,
} from '@payloadcms/ui'
import { getListViewData } from '@payloadcms/ui/views/List/getListViewData'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

/**
 * @internal
 */
export type RenderListViewArgs = {
  ComponentOverride?:
    | PayloadComponent
    | React.ComponentType<ListViewClientProps | (ListViewClientProps & ListViewServerPropsOnly)>
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query?: import('payload').ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  trash?: boolean
} & AdminViewServerProps

/**
 * @internal
 */
export const renderListView = async (
  args: RenderListViewArgs,
): Promise<{
  List: React.ReactNode
}> => {
  const {
    clientConfig,
    ComponentOverride,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    initPageResult,
    overrideEntityVisibility,
    params,
    query: queryFromArgs,
    searchParams,
    trash,
    viewType,
  } = args

  const {
    collectionConfig,
    locale: fullLocale,
    permissions,
    req,
    req: { payload },
    visibleEntities,
  } = initPageResult

  const data = await getListViewData({
    clientConfig,
    collectionConfig,
    ComponentOverride,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    locale: fullLocale,
    overrideEntityVisibility,
    params,
    permissions,
    query: queryFromArgs,
    renderComponent: RenderServerComponent,
    req,
    searchParams,
    trash,
    viewType,
    visibleEntities,
  })

  const isHierarchyView = viewType === 'hierarchy'
  const FallbackView = isHierarchyView ? HierarchyListView : DefaultListView

  return {
    List: (
      <Fragment>
        <HydrateAuthProvider permissions={permissions} />
        <ListQueryProvider
          collectionSlug={data.collectionSlug}
          data={data.data}
          modifySearchParams={!data.isInDrawer}
          orderableFieldName={collectionConfig.orderable === true ? '_order' : undefined}
          query={data.query}
        >
          {RenderServerComponent({
            clientProps: data.listViewClientProps,
            Component: data.View,
            Fallback: FallbackView,
            importMap: payload.importMap,
            serverProps: data.listViewServerProps,
          })}
        </ListQueryProvider>
      </Fragment>
    ),
  }
}

export const ListView: React.FC<RenderListViewArgs> = async (args) => {
  try {
    const { List: RenderedList } = await renderListView({ ...args, enableRowSelections: true })

    return RenderedList
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
