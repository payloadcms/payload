'use client'

import type { CollectionPreferences, ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CollectionOption } from '../../elements/CreateDocumentButton/index.js'
import type { DocumentLayout } from '../../elements/LayoutToggle/index.js'
import type { StepNavItem } from '../../elements/StepNav/index.js'
import type { SelectableDocument } from '../../providers/DocumentSelection/types.js'
import type { FlatFolderContents } from '../List/getFlatFolderContents.js'

import { CreateDocumentButton } from '../../elements/CreateDocumentButton/index.js'
import { LayoutToggle } from '../../elements/LayoutToggle/index.js'
import { ListControlsBar } from '../../elements/ListControlsBar/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { ListSearchFilter } from '../../elements/Search/ListSearchFilter/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentSelectionProvider } from '../../providers/DocumentSelection/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouter, useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FlatFolderContentsView } from './FlatFolderContents/index.js'
import { getHierarchyListURL } from './getHierarchyListURL.js'
import { HierarchyListHeader } from './HierarchyListHeader/index.js'
import { HierarchyTable } from './HierarchyTable/index.js'
import { TypeFilter } from './TypeFilter/index.js'
import './index.css'

const baseClass = 'hierarchy-list'

export function HierarchyListView(props: ListViewClientProps) {
  return (
    <HierarchyListContent
      key={`${props.collectionSlug}:${props.hierarchyData?.parentId}`}
      {...props}
    />
  )
}

function HierarchyListContent(props: ListViewClientProps) {
  const {
    AfterList,
    baseFilter,
    BeforeList,
    collectionSlug,
    currentHierarchyItem,
    Description,
    documentLayout,
    flatFolderContents,
    hasCreatePermission: hasCreatePermissionFromProps,
    hierarchyData,
    HierarchyIcon,
    HierarchySmallIcon,
    viewType,
  } = props

  const router = useRouter()
  const { setPreference } = usePreferences()
  const searchParams = useSearchParams()
  const searchFromURL = searchParams.get('search') || ''
  const typeFilterFromURL = searchParams.get('typeFilter')
  const flatQueryKey = JSON.stringify([
    collectionSlug,
    hierarchyData?.parentId,
    searchFromURL,
    typeFilterFromURL,
  ])
  const [layout, setLayout] = useState<DocumentLayout>(documentLayout ?? 'table')
  const [flatState, setFlatState] = useState({ contents: flatFolderContents, key: flatQueryKey })
  const flatContents = flatState.key === flatQueryKey ? flatState.contents : flatFolderContents
  const [flatLoading, setFlatLoading] = useState<'documents' | 'folders' | null>(null)
  const [flatError, setFlatError] = useState<string>()
  const flatLoadingRef = useRef(false)
  const flatQueryKeyRef = useRef(flatQueryKey)
  const requestVersionRef = useRef(0)
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
  const isFlatFolderView = Boolean(flatContents)
  const parentFieldName = hierarchyConfig?.parentFieldName

  const { i18n, t } = useTranslation()
  const collectionLabel = getTranslation(labels?.plural, i18n)

  const { setStepNav } = useStepNav()
  const { parent, refreshTree } = useHierarchy()
  const { clearRouteCache } = useRouteCache()
  const { serverFunction } = useServerFunctions()

  // Callback for when a new document is created
  const handleSave = useCallback(() => {
    requestVersionRef.current += 1
    clearRouteCache()
    refreshTree(collectionSlug)
    router.refresh()
  }, [clearRouteCache, collectionSlug, refreshTree, router])

  useEffect(() => {
    flatQueryKeyRef.current = flatQueryKey
    requestVersionRef.current += 1
    flatLoadingRef.current = false
    setFlatLoading(null)
    setFlatError(undefined)
    setFlatState({ contents: flatFolderContents, key: flatQueryKey })
  }, [flatFolderContents, flatQueryKey])

  const handleLayoutChange = async (nextLayout: DocumentLayout) => {
    setLayout(nextLayout)
    await setPreference<CollectionPreferences>(`collection-${collectionSlug}`, (preferences) => ({
      ...(preferences ?? {}),
      documentLayout: nextLayout,
    }))
    router.refresh()
  }

  // Update URL when search changes (debouncing is handled by ListSearchFilter)
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
        requestVersionRef.current += 1
        void startRouteTransition(() => router.replace(newUrl))
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
      // The trail ends with the current item as plain text rather than a link back to itself.
      const breadcrumbs = hierarchyData?.breadcrumbs || []

      const baseLabel: StepNavItem = {
        label: collectionLabel,
        url: getHierarchyListURL({
          adminRoute,
          collectionSlug,
        }),
      }

      let navItems = [baseLabel]

      if (breadcrumbs.length > 0) {
        const lastIndex = breadcrumbs.length - 1
        const hierarchyBreadcrumbs: StepNavItem[] = breadcrumbs.map((crumb, index) => ({
          label: crumb.title,
          url:
            index === lastIndex
              ? undefined
              : getHierarchyListURL({
                  adminRoute,
                  collectionSlug,
                  parentFieldName,
                  parentID: crumb.id,
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

  const handleFlatLoadMore = useCallback(
    async (source: 'documents' | 'folders') => {
      if (flatLoadingRef.current || !flatContents || parentId === null) {
        return
      }

      flatLoadingRef.current = true
      const requestVersion = requestVersionRef.current
      setFlatLoading(source)
      setFlatError(undefined)

      try {
        const page = flatContents[source].page + 1
        const next = (await serverFunction({
          name: 'get-flat-folder-contents',
          args: {
            collectionSlug,
            page,
            parentID: parentId,
            search: searchFromURL || undefined,
            source,
            typeFilter:
              typeFilterFromURL !== null ? typeFilterFromURL.split(',').filter(Boolean) : undefined,
          },
        })) as FlatFolderContents
        if (
          requestVersionRef.current !== requestVersion ||
          flatQueryKeyRef.current !== flatQueryKey
        ) {
          return
        }
        const nextPage = next[source]

        if (nextPage.page !== page) {
          throw new Error('Unexpected folder contents page')
        }

        setFlatState((previous) => {
          if (
            previous.key !== flatQueryKey ||
            !previous.contents ||
            previous.contents[source].page !== page - 1
          ) {
            return previous
          }

          const existing = new Set(
            previous.contents[source].docs.map((doc) =>
              JSON.stringify([doc._collectionSlug, doc.id]),
            ),
          )
          const newDocs = nextPage.docs.filter(
            (doc) => !existing.has(JSON.stringify([doc._collectionSlug, doc.id])),
          )

          return {
            ...previous,
            contents: {
              ...previous.contents,
              [source]: { ...nextPage, docs: [...previous.contents[source].docs, ...newDocs] },
            },
          }
        })
      } catch (_error) {
        if (
          requestVersionRef.current === requestVersion &&
          flatQueryKeyRef.current === flatQueryKey
        ) {
          setFlatError(t('error:unknown'))
        }
      } finally {
        if (
          requestVersionRef.current === requestVersion &&
          flatQueryKeyRef.current === flatQueryKey
        ) {
          flatLoadingRef.current = false
          setFlatLoading(null)
        }
      }
    },
    [
      collectionSlug,
      flatContents,
      flatQueryKey,
      parentId,
      searchFromURL,
      serverFunction,
      t,
      typeFilterFromURL,
    ],
  )

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

  const selectedTypes = useMemo(
    () =>
      typeFilterFromURL !== null && (isFlatFolderView || typeFilterFromURL)
        ? isFlatFolderView
          ? typeFilterFromURL.split(',').filter(Boolean)
          : typeFilterFromURL.split(',')
        : typeOptions.map((opt) => opt.value),
    [isFlatFolderView, typeFilterFromURL, typeOptions],
  )

  // Update URL when type filter changes
  const handleTypeFilterChange = useCallback(
    (values: string[]) => {
      // Build new URL with updated typeFilter param
      const currentParams: Record<string, string> = {}
      searchParams.forEach((v, k) => {
        currentParams[k] = v
      })

      // Only add typeFilter if not all types are selected
      const allSelected = values.length === typeOptions.length
      if (!allSelected && (isFlatFolderView || values.length > 0)) {
        currentParams.typeFilter = values.join(',')
      } else {
        delete currentParams.typeFilter
      }

      const queryString = qs.stringify(currentParams, { addQueryPrefix: true })
      const newUrl = `${window.location.pathname}${queryString}`

      if (window.location.search !== queryString) {
        requestVersionRef.current += 1
        void startRouteTransition(() => router.replace(newUrl))
      }
    },
    [isFlatFolderView, router, searchParams, startRouteTransition, typeOptions.length],
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

  const collectionData = useMemo(
    () =>
      flatContents
        ? Object.fromEntries(
            Array.from(
              [...flatContents.folders.docs, ...flatContents.documents.docs].reduce(
                (groups, doc) => {
                  const group = groups.get(doc._collectionSlug) ?? []
                  group.push(doc)
                  groups.set(doc._collectionSlug, group)
                  return groups
                },
                new Map<string, FlatFolderContents['documents']['docs']>(),
              ),
              ([slug, docs]) => [slug, { docs }],
            ),
          )
        : hierarchyData
          ? {
              [collectionSlug]: { docs: hierarchyData.childrenData.docs },
              ...Object.fromEntries(
                Object.entries(hierarchyData.relatedDocumentsByCollection || {}).map(
                  ([slug, related]) => [slug, { docs: related.result.docs }],
                ),
              ),
            }
          : {},
    [collectionSlug, flatContents, hierarchyData],
  )
  const selectionMetadataFieldName =
    hierarchyConfig?.collectionSpecific && typeof hierarchyConfig.collectionSpecific === 'object'
      ? hierarchyConfig.collectionSpecific.fieldName
      : undefined
  const getSelectionMetadata = useCallback(
    ({
      collectionSlug: selectedCollectionSlug,
      doc,
    }: {
      collectionSlug: string
      doc: SelectableDocument
    }) => ({
      allowedCollections:
        selectedCollectionSlug === collectionSlug && selectionMetadataFieldName
          ? ((doc as Record<string, unknown>)[selectionMetadataFieldName] as string[] | undefined)
          : undefined,
    }),
    [collectionSlug, selectionMetadataFieldName],
  )

  return (
    <Fragment>
      <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
        {BeforeList}
        <DocumentSelectionProvider
          collectionData={collectionData}
          getSelectionMetadata={getSelectionMetadata}
          preserveSelectionOnDataChange={Boolean(flatContents)}
          selectionScopeKey={flatContents ? flatQueryKey : undefined}
        >
          <div className={`${baseClass}__wrap`}>
            <HierarchyListHeader
              collectionConfig={collectionConfig}
              currentItemId={parentId}
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
              hasUpdatePermission={currentHierarchyItem?.hasUpdatePermission}
              HierarchyIcon={HierarchyIcon}
              i18n={i18n}
              viewType={viewType}
            />

            <ListControlsBar className={`${baseClass}__controls`}>
              <div className={`${baseClass}__controls-left`}>
                <ListSearchFilter
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
              {!isInDrawer && <LayoutToggle layout={layout} onChange={handleLayoutChange} />}
            </ListControlsBar>

            {flatContents && parentId !== null ? (
              <FlatFolderContentsView
                collectionSlug={collectionSlug}
                contents={flatContents}
                error={flatError}
                HierarchyIcon={HierarchySmallIcon ?? HierarchyIcon}
                isLoading={flatLoading}
                onLoadMore={handleFlatLoadMore}
                parentID={parentId}
              />
            ) : (
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
                layout={layout}
                parentFieldName={parentFieldName}
                parentId={parentId}
                relatedGroups={filteredRelatedGroups}
                search={searchFromURL}
                useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
              />
            )}
          </div>
        </DocumentSelectionProvider>
        {AfterList}
      </div>
    </Fragment>
  )
}
