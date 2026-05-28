import type { HierarchyViewData, PayloadComponent, SanitizedCollectionConfig, Where } from 'payload'
import type React from 'react'

import { isNumber } from 'payload/shared'

import type { GetListViewDataArgs } from './getListViewData.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import {
  DefaultListView,
  HierarchyListView,
  HydrateAuthProvider,
  HydrateHierarchyProvider,
  ListQueryProvider,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
} from '../../exports/client/index.js'
import { getListViewData } from './getListViewData.js'
import { handleHierarchy } from './handleHierarchy.js'

/**
 * Framework-agnostic List view RSC.
 *
 * Performs all server-side data fetching (via `getListViewData`), optionally
 * fetches hierarchy data when `viewType === 'hierarchy'`, renders the configured
 * list view component (or `DefaultListView` / `HierarchyListView` fallback) via
 * `RenderServerComponent`, and wraps the result in the necessary hydration
 * providers.
 *
 * Throws `Error('not-found')` when the collection is missing or the user lacks
 * read permission — the adapter (next, tanstack-start, ...) is responsible for
 * translating that into its framework-specific 404 response.
 *
 * Works under any framework whose runtime evaluates React Server Components.
 */
export type ListViewRSCArgs = {
  /**
   * Optional — when missing, `ListViewRSC` throws `Error('not-found')` so the
   * adapter can surface a 404. Required for normal rendering paths.
   */
  collectionConfig?: SanitizedCollectionConfig
  /**
   * Allows passing a fully-resolved `PayloadComponent` reference instead of
   * relying on the collection's configured list view. Falls back to the
   * collection's list `Component` or `DefaultListView` / `HierarchyListView`.
   */
  ComponentOverride?: PayloadComponent
} & Omit<GetListViewDataArgs, 'collectionConfig'>

export const ListViewRSC = async (args: ListViewRSCArgs): Promise<React.ReactNode> => {
  const {
    collectionConfig,
    ComponentOverride,
    permissions,
    req,
    req: { payload },
    searchParams,
    viewType,
  } = args

  if (!collectionConfig) {
    throw new Error('not-found')
  }

  const result = await getListViewData({
    ...args,
    collectionConfig,
    renderComponent: RenderServerComponent,
  })

  const { collectionSlug, data, listViewClientProps, listViewServerProps, query, View } = result

  // ---- Hierarchy view data ----
  const isHierarchyCollection = Boolean(collectionConfig.hierarchy)
  const hierarchyParentFieldName =
    typeof collectionConfig.hierarchy === 'object'
      ? (collectionConfig.hierarchy.parentFieldName ?? 'parent')
      : 'parent'
  const isHierarchyView = viewType === 'hierarchy'

  let hierarchyData: HierarchyViewData | undefined
  let HierarchyIcon: React.ReactNode | undefined
  let hierarchyParentId: null | number | string = null
  let baseFilterConstraint: null | undefined | Where = null

  if (isHierarchyCollection && isHierarchyView) {
    const parentParam = searchParams?.[hierarchyParentFieldName]
    if (parentParam === 'null' || parentParam === undefined) {
      hierarchyParentId = null
    } else if (typeof parentParam === 'string') {
      hierarchyParentId =
        payload.db.defaultIDType === 'number' && isNumber(parentParam)
          ? Number(parentParam)
          : parentParam
    }

    baseFilterConstraint =
      (await (collectionConfig.admin?.baseFilter ?? collectionConfig.admin?.baseListFilter)?.({
        limit: query.limit,
        page: query.page,
        req,
        // `getListViewData` normalizes `sort` to a string before returning; runtime guarantees this.
        sort: typeof query.sort === 'string' ? query.sort : '',
      })) ?? null

    const typeFilterParam = searchParams?.typeFilter
    const typeFilter =
      typeof typeFilterParam === 'string' && typeFilterParam.length > 0
        ? typeFilterParam.split(',')
        : undefined

    hierarchyData = await handleHierarchy({
      baseFilter: baseFilterConstraint,
      collectionConfig,
      collectionSlug,
      parentId: hierarchyParentId,
      permissions,
      req,
      search: typeof query?.search === 'string' ? query.search : undefined,
      typeFilter,
      user: req.user,
    })

    const hierarchyConfig =
      typeof collectionConfig.hierarchy === 'object' ? collectionConfig.hierarchy : undefined

    HierarchyIcon = RenderServerComponent({
      Component: hierarchyConfig?.admin?.components?.Icon,
      importMap: payload.importMap,
      key: `hierarchy-icon-${collectionSlug}`,
    })
  }

  // ---- Render the list view component ----
  const RenderedListViewComponent = RenderServerComponent({
    clientProps: {
      ...listViewClientProps,
      baseFilter: baseFilterConstraint,
      hierarchyData,
      HierarchyIcon,
    },
    Component: ComponentOverride ?? View,
    Fallback: isHierarchyView ? HierarchyListView : DefaultListView,
    importMap: payload.importMap,
    key: `list-view-${collectionSlug}-${viewType}`,
    serverProps: listViewServerProps,
  })

  // ---- Wrap in providers ----
  if (isHierarchyView) {
    const hierarchyConfig =
      typeof collectionConfig.hierarchy === 'object' ? collectionConfig.hierarchy : undefined

    return (
      <>
        <HydrateAuthProvider permissions={permissions} />
        <HydrateHierarchyProvider
          allowedCollections={hierarchyData?.allowedCollections}
          baseFilter={baseFilterConstraint ?? undefined}
          collectionSlug={collectionSlug}
          expandedNodes={hierarchyData?.breadcrumbs?.slice(0, -1).map((b) => b.id)}
          parent={hierarchyData?.parent}
          parentFieldName={hierarchyConfig?.parentFieldName}
          tableData={data}
          treeLimit={hierarchyConfig?.admin?.treeLimit}
          typeFieldName={
            hierarchyConfig?.collectionSpecific &&
            typeof hierarchyConfig.collectionSpecific === 'object'
              ? hierarchyConfig.collectionSpecific.fieldName
              : undefined
          }
        />
        {RenderedListViewComponent}
      </>
    )
  }

  return (
    <>
      <HydrateAuthProvider permissions={permissions} />
      <ListQueryProvider
        collectionSlug={collectionSlug}
        data={data}
        modifySearchParams={!result.isInDrawer}
        orderableFieldName={collectionConfig.orderable === true ? '_order' : undefined}
        query={query}
      >
        {RenderedListViewComponent}
      </ListQueryProvider>
    </>
  )
}
