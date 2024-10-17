'use client'

import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  DeleteMany,
  EditMany,
  Gutter,
  ListControls,
  ListHeader,
  ListSelection,
  Pagination,
  PerPage,
  PublishMany,
  RelationshipProvider,
  RenderComponent,
  SelectionProvider,
  SetViewActions,
  StaggeredShimmers,
  Table,
  UnpublishMany,
  useAuth,
  useBulkUpload,
  useConfig,
  useEditDepth,
  useListInfo,
  useListQuery,
  useModal,
  useStepNav,
  useTranslation,
  useWindowInfo,
  ViewDescription,
} from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import { formatFilesize, isNumber } from 'payload/shared'
import React, { Fragment, useEffect } from 'react'

import './index.scss'

const baseClass = 'collection-list'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultListView: React.FC = () => {
  const { user } = useAuth()
  const {
    beforeActions,
    collectionSlug,
    disableBulkDelete,
    disableBulkEdit,
    hasCreatePermission,
    Header,
    newDocumentURL,
  } = useListInfo()

  const router = useRouter()

  const { data, defaultLimit, handlePageChange, handlePerPageChange, params } = useListQuery()
  const { openModal } = useModal()
  const { setCollectionSlug, setOnSuccess } = useBulkUpload()
  const { drawerSlug } = useBulkUpload()

  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const {
    admin: {
      components: {
        afterList,
        afterListTable,
        beforeList,
        beforeListTable,
        Description,
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

  const openBulkUpload = React.useCallback(() => {
    setCollectionSlug(collectionSlug)
    openModal(drawerSlug)
    setOnSuccess(() => router.refresh())
  }, [router, collectionSlug, drawerSlug, openModal, setCollectionSlug, setOnSuccess])

  useEffect(() => {
    if (drawerDepth <= 1) {
      setStepNav([
        {
          label: labels?.plural,
        },
      ])
    }
  }, [setStepNav, labels, drawerDepth])

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  return (
    <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
      <SetViewActions actions={actions} />
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs} user={user}>
        <RenderComponent mappedComponent={beforeList} />
        <Gutter className={`${baseClass}__wrap`}>
          {Header || (
            <ListHeader heading={getTranslation(labels?.plural, i18n)}>
              {hasCreatePermission && (
                <>
                  <Button
                    aria-label={i18n.t('general:createNewLabel', {
                      label: getTranslation(labels?.singular, i18n),
                    })}
                    buttonStyle="pill"
                    el={'link'}
                    Link={Link}
                    size="small"
                    to={newDocumentURL}
                  >
                    {i18n.t('general:createNew')}
                  </Button>

                  {isBulkUploadEnabled && (
                    <Button
                      aria-label={t('upload:bulkUpload')}
                      buttonStyle="pill"
                      onClick={openBulkUpload}
                      size="small"
                    >
                      {t('upload:bulkUpload')}
                    </Button>
                  )}
                </>
              )}
              {!smallBreak && (
                <ListSelection label={getTranslation(collectionConfig.labels.plural, i18n)} />
              )}
              {(description || Description) && (
                <div className={`${baseClass}__sub-header`}>
                  <ViewDescription Description={Description} description={description} />
                </div>
              )}
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
                <Button el="link" Link={Link} to={newDocumentURL}>
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
                    limit={isNumber(params?.limit) ? Number(params.limit) : defaultLimit}
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
        <RenderComponent mappedComponent={afterList} />
      </SelectionProvider>
    </div>
  )
}
