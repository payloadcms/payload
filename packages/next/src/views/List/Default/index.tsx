'use client'

import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  BulkUploadDrawer,
  Button,
  DeleteMany,
  EditMany,
  Gutter,
  ListControls,
  ListHeader,
  ListSelection,
  Pagination,
  PerPage,
  PopupList,
  PublishMany,
  RelationshipProvider,
  RenderComponent,
  SelectionProvider,
  SetViewActions,
  StaggeredShimmers,
  Table,
  UnpublishMany,
  ViewDescription,
  bulkUploadDrawerSlug,
  useConfig,
  useEditDepth,
  useListInfo,
  useListQuery,
  useModal,
  useRouteCache,
  useSearchParams,
  useStepNav,
  useTranslation,
  useWindowInfo,
} from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import { formatFilesize, isNumber } from 'payload/shared'
import React, { Fragment, useEffect } from 'react'

import './index.scss'

const baseClass = 'collection-list'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultListView: React.FC = () => {
  const {
    Header,
    beforeActions,
    collectionSlug,
    disableBulkDelete,
    disableBulkEdit,
    hasCreatePermission,
    newDocumentURL,
  } = useListInfo()

  const { data, defaultLimit, handlePageChange, handlePerPageChange } = useListQuery()
  const { searchParams } = useSearchParams()
  const { openModal } = useModal()
  const { clearRouteCache } = useRouteCache()

  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const {
    admin: {
      components: {
        Description,
        afterList,
        afterListTable,
        beforeList,
        beforeListTable,
        views: {
          list: { actions },
        },
      },
      description,
    },
    fields,
    labels,
  } = collectionConfig

  const { i18n, t } = useTranslation()

  const drawerDepth = useEditDepth()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  let docs = data.docs || []

  const isUploadCollection = Boolean(collectionConfig.upload)

  if (isUploadCollection) {
    docs = docs?.map((doc) => {
      return {
        ...doc,
        filesize: formatFilesize(doc.filesize),
      }
    })
  }

  useEffect(() => {
    if (drawerDepth <= 1) {
      setStepNav([
        {
          label: labels?.plural,
        },
      ])
    }
  }, [setStepNav, labels, drawerDepth])

  return (
    <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
      <SetViewActions actions={actions} />
      <RenderComponent mappedComponent={beforeList} />
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        <Gutter className={`${baseClass}__wrap`}>
          {Header || (
            <ListHeader heading={getTranslation(labels?.plural, i18n)}>
              {hasCreatePermission && (
                <Button
                  Link={Link}
                  SubMenuPopupContent={
                    isUploadCollection && collectionConfig.upload.bulkUpload ? (
                      <PopupList.ButtonGroup>
                        <PopupList.Button onClick={() => openModal(bulkUploadDrawerSlug)}>
                          {t('upload:bulkUpload')}
                        </PopupList.Button>
                      </PopupList.ButtonGroup>
                    ) : null
                  }
                  aria-label={i18n.t('general:createNewLabel', {
                    label: getTranslation(labels?.singular, i18n),
                  })}
                  buttonStyle="pill"
                  el="link"
                  size="small"
                  to={newDocumentURL}
                >
                  {i18n.t('general:createNew')}
                </Button>
              )}
              {!smallBreak && (
                <ListSelection label={getTranslation(collectionConfig.labels.plural, i18n)} />
              )}
              {(description || Description) && (
                <div className={`${baseClass}__sub-header`}>
                  <ViewDescription Description={Description} description={description} />
                </div>
              )}
              {isUploadCollection && collectionConfig.upload.bulkUpload ? (
                <BulkUploadDrawer
                  collectionSlug={collectionSlug}
                  onSuccess={() => clearRouteCache()}
                />
              ) : null}
            </ListHeader>
          )}
          <ListControls collectionConfig={collectionConfig} fields={fields} />
          <RenderComponent mappedComponent={beforeListTable} />
          {!data.docs && (
            <StaggeredShimmers
              className={[`${baseClass}__shimmer`, `${baseClass}__shimmer--rows`].join(' ')}
              count={6}
            />
          )}
          {data.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <Table
                customCellContext={{
                  collectionSlug,
                  uploadConfig: collectionConfig.upload,
                }}
                data={docs}
                fields={fields}
              />
            </RelationshipProvider>
          )}
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>{i18n.t('general:noResults', { label: getTranslation(labels?.plural, i18n) })}</p>
              {hasCreatePermission && newDocumentURL && (
                <Button Link={Link} el="link" to={newDocumentURL}>
                  {i18n.t('general:createNewLabel', {
                    label: getTranslation(labels?.singular, i18n),
                  })}
                </Button>
              )}
            </div>
          )}
          <RenderComponent mappedComponent={afterListTable} />
          {data.docs && data.docs.length > 0 && (
            <div className={`${baseClass}__page-controls`}>
              <Pagination
                hasNextPage={data.hasNextPage}
                hasPrevPage={data.hasPrevPage}
                limit={data.limit}
                nextPage={data.nextPage}
                numberOfNeighbors={1}
                onChange={(page) => void handlePageChange(page)}
                page={data.page}
                prevPage={data.prevPage}
                totalPages={data.totalPages}
              />
              {data?.totalDocs > 0 && (
                <Fragment>
                  <div className={`${baseClass}__page-info`}>
                    {data.page * data.limit - (data.limit - 1)}-
                    {data.totalPages > 1 && data.totalPages !== data.page
                      ? data.limit * data.page
                      : data.totalDocs}{' '}
                    {i18n.t('general:of')} {data.totalDocs}
                  </div>
                  <PerPage
                    handleChange={(limit) => void handlePerPageChange(limit)}
                    limit={
                      isNumber(searchParams?.limit) ? Number(searchParams.limit) : defaultLimit
                    }
                    limits={collectionConfig?.admin?.pagination?.limits}
                    resetPage={data.totalDocs <= data.pagingCounter}
                  />
                  {smallBreak && (
                    <div className={`${baseClass}__list-selection`}>
                      <ListSelection label={getTranslation(collectionConfig.labels.plural, i18n)} />
                      <div className={`${baseClass}__list-selection-actions`}>
                        {beforeActions && beforeActions}
                        {!disableBulkEdit && (
                          <Fragment>
                            <EditMany collection={collectionConfig} fields={fields} />
                            <PublishMany collection={collectionConfig} />
                            <UnpublishMany collection={collectionConfig} />
                          </Fragment>
                        )}
                        {!disableBulkDelete && <DeleteMany collection={collectionConfig} />}
                      </div>
                    </div>
                  )}
                </Fragment>
              )}
            </div>
          )}
        </Gutter>
      </SelectionProvider>
      <RenderComponent mappedComponent={afterList} />
    </div>
  )
}
