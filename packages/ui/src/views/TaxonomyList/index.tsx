'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { StepNavItem } from '../../elements/StepNav/index.js'

import { Button } from '../../elements/Button/index.js'
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
import { TaxonomyListHeader } from './TaxonomyListHeader/index.js'
import { TaxonomyTable } from './TaxonomyTable/index.js'
import './index.scss'

const baseClass = 'taxonomy-list'

export function TaxonomyListView(props: ListViewClientProps) {
  const {
    AfterList,
    BeforeList,
    collectionSlug,
    Description,
    hasCreatePermission: hasCreatePermissionFromProps,
    newDocumentURL,
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

  const isRootLevel = selectedParentId === null

  const filteredChildrenData = taxonomyData?.childrenData

  const collectionData = taxonomyData
    ? {
        [collectionSlug]: { docs: taxonomyData.childrenData.docs },
        ...Object.fromEntries(
          Object.entries(taxonomyData.relatedDocuments || {}).map(([slug, related]) => [
            slug,
            { docs: related.data.docs },
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
            <TaxonomyListHeader
              collectionConfig={collectionConfig}
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
              isRootLevel={isRootLevel}
              newDocumentURL={newDocumentURL}
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

            {taxonomyData ? (
              <TaxonomyTable
                childrenData={filteredChildrenData}
                collectionSlug={collectionSlug}
                key={`${collectionSlug}-${taxonomyData.parentId}`}
                parentId={taxonomyData.parentId}
                relatedGroups={Object.entries(taxonomyData.relatedDocuments || {}).map(
                  ([slug, related]) => ({
                    collectionSlug: slug,
                    data: related.data,
                    fieldInfo: related.fieldInfo,
                    label: related.label,
                  }),
                )}
                search={searchFromURL}
                taxonomyLabel={collectionLabel}
                useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
              />
            ) : (
              <div className={`${baseClass}__no-results`}>
                <p>{t('general:noResults', { label: collectionLabel })}</p>
                {hasCreatePermission && newDocumentURL && (
                  <Button el="link" to={newDocumentURL}>
                    {t('general:createNewLabel', {
                      label: getTranslation(labels?.singular, i18n),
                    })}
                  </Button>
                )}
              </div>
            )}
          </Gutter>
        </DocumentSelectionProvider>
        {AfterList}
      </div>
    </Fragment>
  )
}
