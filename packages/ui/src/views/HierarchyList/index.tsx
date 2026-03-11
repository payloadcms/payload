'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import type { CollectionOption } from '../../elements/CreateDocumentButton/index.js'
import type { StepNavItem } from '../../elements/StepNav/index.js'

import { Gutter } from '../../elements/Gutter/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { TagIcon } from '../../icons/Tag/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentSelectionProvider } from '../../providers/DocumentSelection/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { HierarchyListHeader } from './HierarchyListHeader/index.js'
import { HierarchyTable } from './HierarchyTable/index.js'
import { TypeFilter } from './TypeFilter/index.js'
import './index.scss'

const baseClass = 'hierarchy-list'

export function HierarchyListView(props: ListViewClientProps) {
  const {
    AfterList,
    BeforeList,
    collectionSlug,
    Description,
    hasCreatePermission: hasCreatePermissionFromProps,
    hierarchyData,
    HierarchyIcon,
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

  const { i18n, t } = useTranslation()
  const collectionLabel = getTranslation(labels?.plural, i18n)

  const { setStepNav } = useStepNav()
  const { parent } = useHierarchy()

  // Get search from URL params
  const searchFromURL = searchParams.get('search') || ''

  // Update URL when search changes (debouncing is handled by SearchFilter)
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
        label: (
          <div className={`${baseClass}__step-nav-icon-label`}>
            {HierarchyIcon || <TagIcon color="muted" />}
            {collectionLabel}
          </div>
        ),
        url: parent?.id
          ? formatAdminURL({
              adminRoute,
              path: `/collections/${collectionSlug}`,
            })
          : undefined,
      }

      let navItems = [baseLabel]

      if (ancestorBreadcrumbs.length > 0) {
        const hierarchyBreadcrumbs: StepNavItem[] = ancestorBreadcrumbs.map((crumb) => ({
          label: crumb.title,
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}?parent=${crumb.id}`,
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
    currentItemTitle,
    parent,
    HierarchyIcon,
  ])

  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName
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
          <Gutter className={`${baseClass}__wrap`}>
            <HierarchyListHeader
              collectionConfig={collectionConfig}
              collections={collections}
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
              hasCreatePermission={hasCreatePermission}
              HierarchyIcon={HierarchyIcon}
              i18n={i18n}
            />

            <div className={`${baseClass}__controls`}>
              <SearchBar
                Actions={[
                  <TypeFilter
                    i18n={i18n}
                    key={`type-filter-${hierarchyData.parent ? hierarchyData.parent.id : 'root'}`}
                    onChange={handleTypeFilterChange}
                    options={typeOptions}
                    selectedValues={selectedTypes}
                  />,
                ]}
                label={t('general:searchBy', {
                  label: getTranslation(collectionConfig?.admin?.useAsTitle || 'id', i18n),
                })}
                onSearchChange={handleSearchChange}
                searchQueryParam={searchFromURL}
              />
            </div>

            <HierarchyTable
              childrenData={filteredChildrenData}
              collections={collections}
              collectionSlug={collectionSlug}
              hasCreatePermission={hasCreatePermission}
              HierarchyIcon={HierarchyIcon}
              hierarchyLabel={collectionLabel}
              key={`${collectionSlug}-${parentId}-${searchFromURL}-${filteredChildrenData?.totalDocs}-${Object.entries(
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
          </Gutter>
        </DocumentSelectionProvider>
        {AfterList}
      </div>
    </Fragment>
  )
}
