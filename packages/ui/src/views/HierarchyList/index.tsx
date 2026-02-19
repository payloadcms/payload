'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect } from 'react'

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
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTaxonomy } from '../../providers/Taxonomy/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { HierarchyListHeader } from './HierarchyListHeader/index.js'
import { HierarchyTable } from './HierarchyTable/index.js'
import './index.scss'

const baseClass = 'hierarchy-list'

export function HierarchyListView(props: ListViewClientProps) {
  const {
    AfterList,
    BeforeList,
    collectionSlug,
    Description,
    hasCreatePermission: hasCreatePermissionFromProps,
    taxonomyData,
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
  const { selectedParentId } = useTaxonomy()

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
    taxonomyData?.breadcrumbs && taxonomyData.breadcrumbs.length > 0
      ? taxonomyData.breadcrumbs[taxonomyData.breadcrumbs.length - 1].title
      : undefined

  useEffect(() => {
    if (!isInDrawer) {
      // Breadcrumbs exclude the last item (current item) since it's shown in the header
      const ancestorBreadcrumbs = taxonomyData?.breadcrumbs?.slice(0, -1) || []

      const baseLabel: StepNavItem = {
        label: (
          <div className={`${baseClass}__step-nav-icon-label`}>
            <TagIcon color="muted" />
            {collectionLabel}
          </div>
        ),
        url: selectedParentId
          ? formatAdminURL({
              adminRoute,
              path: `/collections/${collectionSlug}`,
            })
          : undefined,
      }

      let navItems = [baseLabel]

      if (ancestorBreadcrumbs.length > 0) {
        const taxonomyBreadcrumbs: StepNavItem[] = ancestorBreadcrumbs.map((crumb) => ({
          label: crumb.title,
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}?parent=${crumb.id}`,
          }),
        }))
        navItems = [...navItems, ...taxonomyBreadcrumbs]
      }

      setStepNav(navItems)
    }
  }, [
    adminRoute,
    setStepNav,
    isInDrawer,
    collectionSlug,
    taxonomyData,
    collectionLabel,
    currentItemTitle,
    selectedParentId,
  ])

  const parentFieldName = collectionConfig?.taxonomy?.parentFieldName || 'parent'
  const parentId = taxonomyData?.parentId ?? null

  // Build collections array for create button
  const collections: CollectionOption[] = []

  // Add taxonomy collection (for creating child taxonomy items)
  collections.push({
    collectionSlug,
    initialData: parentId !== null ? { [parentFieldName]: parentId } : {},
  })

  // Add related collections (for creating documents that reference this taxonomy)
  // Use taxonomyConfig.relatedCollections to show ALL related collections, not just ones with documents
  const taxonomyFieldName = `_t_${collectionSlug}`
  for (const slug of Object.keys(collectionConfig.taxonomy?.relatedCollections || {})) {
    collections.push({
      collectionSlug: slug,
      // Always use array - Payload normalizes for single relationship fields
      initialData: parentId !== null ? { [taxonomyFieldName]: [parentId] } : {},
    })
  }

  const filteredChildrenData = taxonomyData?.childrenData

  const collectionData = taxonomyData
    ? {
        [collectionSlug]: { docs: taxonomyData.childrenData.docs },
        ...Object.fromEntries(
          Object.entries(taxonomyData.relatedDocumentsByCollection || {}).map(([slug, related]) => [
            slug,
            { docs: related.result.docs },
          ]),
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
              }
              hasCreatePermission={hasCreatePermission}
              i18n={i18n}
            />

            <div className={`${baseClass}__controls`}>
              <SearchBar
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
              key={`${collectionSlug}-${parentId}-${searchFromURL}-${filteredChildrenData?.totalDocs}-${Object.entries(
                taxonomyData?.relatedDocumentsByCollection || {},
              )
                .map(([slug, r]) => `${slug}:${r.result.totalDocs}`)
                .join(',')}`}
              parentFieldName={parentFieldName}
              parentId={parentId}
              relatedGroups={Object.entries(taxonomyData?.relatedDocumentsByCollection || {}).map(
                ([slug, related]) => ({
                  collectionSlug: slug,
                  data: related.result,
                  hasMany: related.hasMany,
                  label: related.label,
                }),
              )}
              search={searchFromURL}
              taxonomyLabel={collectionLabel}
              useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
            />
          </Gutter>
        </DocumentSelectionProvider>
        {AfterList}
      </div>
    </Fragment>
  )
}
