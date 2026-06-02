'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import type { CollectionOption } from '../../elements/CreateDocumentButton/index.js'
import type { StepNavItem } from '../../elements/StepNav/index.js'

import { CreateDocumentButton } from '../../elements/CreateDocumentButton/index.js'
import { ListControlsBar } from '../../elements/ListControlsBar/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentSelectionProvider } from '../../providers/DocumentSelection/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouter, useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { HierarchyListHeader } from './HierarchyListHeader/index.js'
import { HierarchyTable } from './HierarchyTable/index.js'
import { TypeFilter } from './TypeFilter/index.js'
import './index.css'

const baseClass = 'hierarchy-list'

export function HierarchyListView(props: ListViewClientProps) {
  const {
    AfterList,
    baseFilter,
    BeforeList,
    collectionSlug,
    Description,
    hasCreatePermission: hasCreatePermissionFromProps,
    hierarchyData,
    HierarchyIcon,
    HierarchySmallIcon,
    viewType,
  } = props

  const router = useRouter()
  const searchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()

  const { allowCreate, isInDrawer } = useListDrawerContext()

  const hasCreatePermission =
    allowCreate !== undefined
      ? allowCreate && hasCreatePermissionFromProps
      : hasCreatePermissionFromProps

  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const { labels } = collectionConfig

  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName

  const { i18n, t } = useTranslation()
  const collectionLabel = getTranslation(labels?.plural, i18n)

  const { setStepNav } = useStepNav()
  const { parent, refreshTree } = useHierarchy()
  const { clearRouteCache } = useRouteCache()

  // Callback for when a new document is created
  const handleSave = useCallback(() => {
    clearRouteCache()
    refreshTree(collectionSlug)
  }, [clearRouteCache, collectionSlug, refreshTree])

  // Get search from URL params
  const searchFromURL = searchParams.get('search') || ''

  // Update URL when search changes (debouncing is handled by SearchBar)
  // This triggers a server refetch via Next.js router
  const handleSearchChange = useCallback(
    (value: string) => {
      // Build new URL with updated search param
      const currentParams: Record<string, string> = {}
      searchParams.forEach((v, k) => {
        currentParams[k] = v
      })

      if (value) {
        currentParams.search = value
      } else {
        delete currentParams.search
      }

      const queryString = qs.stringify(currentParams, { addQueryPrefix: true })
      const newUrl = `${window.location.pathname}${queryString}`

      if (window.location.search !== queryString) {
        startRouteTransition(() => router.replace(newUrl))
      }
    },
    [router, searchParams, startRouteTransition],
  )

  // Get current item title from breadcrumbs (last item is the current one)
  const currentItemTitle =
    hierarchyData?.breadcrumbs && hierarchyData.breadcrumbs.length > 0
      ? hierarchyData.breadcrumbs[hierarchyData.breadcrumbs.length - 1].title
      : undefined

  useEffect(() => {
    if (!isInDrawer) {
      // Breadcrumbs exclude the last item (current item) since it's shown in the header
      const ancestorBreadcrumbs = hierarchyData?.breadcrumbs?.slice(0, -1) || []

      const baseLabel: StepNavItem = {
        label: collectionLabel,
        url: formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}`,
        }),
      }

      let navItems = [baseLabel]

      if (ancestorBreadcrumbs.length > 0) {
        const queryParam = parentFieldName || 'parent'
        const hierarchyBreadcrumbs: StepNavItem[] = ancestorBreadcrumbs.map((crumb) => ({
          label: crumb.title,
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}?${queryParam}=${crumb.id}`,
          }),
        }))
        navItems = [...navItems, ...hierarchyBreadcrumbs]
      }

      setStepNav(navItems)
    }
  }, [
    adminRoute,
    setStepNav,
    isInDrawer,
    collectionSlug,
    hierarchyData,
    collectionLabel,
    parentFieldName,
  ])

  const parentId = hierarchyData?.parentId ?? null

  // Build collections array for create button
  // Filter by allowedCollections when set (from parent's collectionSpecific field)
  const { allowedCollections } = hierarchyData || {}

  const collections: CollectionOption[] = []

  // Add hierarchy collection (always allowed for creating child hierarchy items)
  // Include parent's collectionSpecific values so new folders inherit the restriction
  const hierarchyInitialData: Record<string, unknown> = {}
  if (parentId !== null) {
    hierarchyInitialData[parentFieldName] = parentId

    const collectionSpecificFieldName =
      hierarchyConfig?.collectionSpecific && typeof hierarchyConfig.collectionSpecific === 'object'
        ? hierarchyConfig.collectionSpecific.fieldName
        : undefined
    const parentCollectionSpecificValues = collectionSpecificFieldName
      ? (parent?.[collectionSpecificFieldName] as string[] | undefined)
      : undefined
    if (
      collectionSpecificFieldName &&
      parentCollectionSpecificValues &&
      parentCollectionSpecificValues.length > 0
    ) {
      hierarchyInitialData[collectionSpecificFieldName] = parentCollectionSpecificValues
    }
  }

  collections.push({
    collectionSlug,
    initialData: Object.keys(hierarchyInitialData).length > 0 ? hierarchyInitialData : {},
  })

  // Add related collections (for creating documents that reference this hierarchy)
  // Filter by allowedCollections when set
  for (const [slug, relatedConfig] of Object.entries(hierarchyConfig?.relatedCollections || {})) {
    // Skip if not in allowed list (when allowedCollections has restrictions)
    // Empty array means "no restrictions" (folder accepts all types)
    if (
      allowedCollections &&
      allowedCollections.length > 0 &&
      !allowedCollections.some((c) => c.slug === slug)
    ) {
      continue
    }

    // Use array for hasMany fields, single value for hasMany: false
    const fieldValue = relatedConfig.hasMany ? [parentId] : parentId

    collections.push({
      collectionSlug: slug,
      initialData: parentId !== null ? { [relatedConfig.fieldName]: fieldValue } : {},
    })
  }

  // Build type filter options from hierarchy collection + related collections
  // Filter by allowedCollections when set
  const typeOptions = useMemo(() => {
    const options: { label: string; value: string }[] = []

    // Add related collections (filtered by allowedCollections when set)
    for (const [slug] of Object.entries(hierarchyConfig?.relatedCollections || {})) {
      // Skip if not in allowed list (when allowedCollections has restrictions)
      // Empty array means "no restrictions" (folder accepts all types)
      if (
        allowedCollections &&
        allowedCollections.length > 0 &&
        !allowedCollections.some((c) => c.slug === slug)
      ) {
        continue
      }

      const config = getEntityConfig({ collectionSlug: slug })
      options.push({
        label: getTranslation(config.labels?.plural, i18n),
        value: slug,
      })
    }

    return options
  }, [allowedCollections, getEntityConfig, hierarchyConfig?.relatedCollections, i18n])

  // Get type filter from URL params (comma-separated list)
  const typeFilterFromURL = searchParams.get('typeFilter')
  const typeFilterValues = typeFilterFromURL ? typeFilterFromURL.split(',') : null

  // Track selected types (default: from URL or all selected)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    () => typeFilterValues || typeOptions.map((opt) => opt.value),
  )

  // Update URL when type filter changes
  const handleTypeFilterChange = useCallback(
    (values: string[]) => {
      setSelectedTypes(values)

      // Build new URL with updated typeFilter param
      const currentParams: Record<string, string> = {}
      searchParams.forEach((v, k) => {
        currentParams[k] = v
      })

      // Only add typeFilter if not all types are selected
      const allSelected = values.length === typeOptions.length
      if (!allSelected && values.length > 0) {
        currentParams.typeFilter = values.join(',')
      } else {
        delete currentParams.typeFilter
      }

      const queryString = qs.stringify(currentParams, { addQueryPrefix: true })
      const newUrl = `${window.location.pathname}${queryString}`

      if (window.location.search !== queryString) {
        startRouteTransition(() => router.replace(newUrl))
      }
    },
    [router, searchParams, startRouteTransition, typeOptions.length],
  )

  // Filter children based on selected types (client-side for immediate feedback)
  // Server already filters, but this handles the hierarchy collection toggle
  const filteredChildrenData = useMemo(() => {
    if (!hierarchyData?.childrenData) {
      return undefined
    }
    return hierarchyData.childrenData
  }, [hierarchyData?.childrenData])

  // Filter related groups based on selected types
  const filteredRelatedGroups = useMemo(() => {
    return Object.entries(hierarchyData?.relatedDocumentsByCollection || {})
      .filter(([slug]) => selectedTypes.includes(slug))
      .map(([slug, related]) => ({
        collectionSlug: slug,
        data: related.result,
        fieldName: related.fieldName,
        hasMany: related.hasMany,
        label: related.label,
      }))
  }, [hierarchyData?.relatedDocumentsByCollection, selectedTypes])

  const collectionData = hierarchyData
    ? {
        [collectionSlug]: { docs: hierarchyData.childrenData.docs },
        ...Object.fromEntries(
          Object.entries(hierarchyData.relatedDocumentsByCollection || {}).map(
            ([slug, related]) => [slug, { docs: related.result.docs }],
          ),
        ),
      }
    : {}

  return (
    <Fragment>
      <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
        {BeforeList}
        <DocumentSelectionProvider collectionData={collectionData}>
          <div className={`${baseClass}__wrap`}>
            <HierarchyListHeader
              collectionConfig={collectionConfig}
              currentItemTitle={currentItemTitle}
              Description={
                <React.Fragment>
                  {hierarchyData.allowedCollections &&
                    hierarchyData.allowedCollections.length > 0 && (
                      <div className={`${baseClass}__allowed-types`}>
                        {t('general:accepts')}:{' '}
                        {hierarchyData.allowedCollections.map((c) => c.label).join(', ')}
                      </div>
                    )}
                  {Description || collectionConfig?.admin?.description ? (
                    <div className={`${baseClass}__sub-header`}>
                      <RenderCustomComponent
                        CustomComponent={Description}
                        Fallback={
                          <ViewDescription
                            collectionSlug={collectionSlug}
                            description={collectionConfig?.admin?.description}
                          />
                        }
                      />
                    </div>
                  ) : null}
                </React.Fragment>
              }
              HierarchyIcon={HierarchyIcon}
              i18n={i18n}
              viewType={viewType}
            />

            <ListControlsBar className={`${baseClass}__controls`}>
              <div className={`${baseClass}__controls-left`}>
                <SearchBar
                  label={t('general:searchBy', {
                    label: getTranslation(collectionConfig?.admin?.useAsTitle || 'id', i18n),
                  })}
                  onSearchChange={handleSearchChange}
                  searchQueryParam={searchFromURL}
                />
                <TypeFilter
                  i18n={i18n}
                  key={`type-filter-${hierarchyData.parent ? hierarchyData.parent.id : 'root'}`}
                  onChange={handleTypeFilterChange}
                  options={typeOptions}
                  selectedValues={selectedTypes}
                />
              </div>
              {hasCreatePermission && collections.length > 0 && (
                <CreateDocumentButton
                  buttonStyle="primary"
                  collections={collections}
                  drawerSlug={`hierarchy-create-${collectionSlug}`}
                  onSave={handleSave}
                />
              )}
            </ListControlsBar>

            <HierarchyTable
              baseFilter={baseFilter}
              childrenData={filteredChildrenData}
              collections={collections}
              collectionSlug={collectionSlug}
              hasCreatePermission={hasCreatePermission}
              HierarchyIcon={HierarchySmallIcon ?? HierarchyIcon}
              hierarchyLabel={collectionLabel}
              key={`${collectionSlug}-${parentId}-${searchFromURL}-${JSON.stringify(baseFilter)}-${filteredChildrenData?.totalDocs}-${Object.entries(
                hierarchyData?.relatedDocumentsByCollection || {},
              )
                .map(([slug, r]) => `${slug}:${r.result.totalDocs}`)
                .join(',')}`}
              parentFieldName={parentFieldName}
              parentId={parentId}
              relatedGroups={filteredRelatedGroups}
              search={searchFromURL}
              useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
            />
          </div>
        </DocumentSelectionProvider>
        {AfterList}
      </div>
    </Fragment>
  )
}
