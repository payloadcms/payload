'use client'

import type { ListPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import LinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import { formatFilesize, isNumber } from 'payload/shared'
import React, { Fragment, useEffect, useState } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { DeleteMany } from '../../elements/DeleteMany/index.js'
import { EditMany } from '../../elements/EditMany/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListSelection } from '../../elements/ListSelection/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { Pagination } from '../../elements/Pagination/index.js'
import { PerPage } from '../../elements/PerPage/index.js'
import { PublishMany } from '../../elements/PublishMany/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { TableColumnsProvider } from '../../elements/TableColumns/index.js'
import { UnpublishMany } from '../../elements/UnpublishMany/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { SelectionProvider } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListHeader } from './ListHeader/index.js'
import './index.scss'

const baseClass = 'collection-list'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export type ListViewSlots = {
  AfterList?: React.ReactNode
  AfterListTable?: React.ReactNode
  BeforeList?: React.ReactNode
  BeforeListTable?: React.ReactNode
  Description?: React.ReactNode
  Table: React.ReactNode
}

export type ListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: string
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  listPreferences?: ListPreferences
  newDocumentURL: string
  preferenceKey?: string
  renderedFilters?: Map<string, React.ReactNode>
} & ListViewSlots

export const DefaultListView: React.FC<ListViewClientProps> = (props) => {
  const {
    AfterList,
    AfterListTable,
    beforeActions,
    BeforeList,
    BeforeListTable,
    collectionSlug,
    columnState,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    hasCreatePermission,
    listPreferences,
    newDocumentURL,
    preferenceKey,
    renderedFilters,
    Table: InitialTable,
  } = props

  const [Table, setTable] = useState(InitialTable)

  const { createNewDrawerSlug, drawerSlug: listDrawerSlug, onBulkSelect } = useListDrawerContext()

  useEffect(() => {
    if (InitialTable) {
      setTable(InitialTable)
    }
  }, [InitialTable])

  const { user } = useAuth()

  const { getEntityConfig } = useConfig()
  const router = useRouter()

  const {
    data,
    defaultLimit: initialLimit,
    handlePageChange,
    handlePerPageChange,
    query,
  } = useListQuery()

  const { openModal } = useModal()
  const { setCollectionSlug, setCurrentActivePath, setOnSuccess } = useBulkUpload()
  const { drawerSlug: bulkUploadDrawerSlug } = useBulkUpload()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig

  const isUploadCollection = Boolean(upload)

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const isInDrawer = Boolean(listDrawerSlug)

  const { i18n, t } = useTranslation()

  const drawerDepth = useEditDepth()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const docs = React.useMemo(() => {
    if (isUploadCollection) {
      return data.docs.map((doc) => {
        return {
          ...doc,
          filesize: formatFilesize(doc.filesize),
        }
      })
    } else {
      return data.docs
    }
  }, [data.docs, isUploadCollection])

  const openBulkUpload = React.useCallback(() => {
    setCollectionSlug(collectionSlug)
    setCurrentActivePath(collectionSlug)
    openModal(bulkUploadDrawerSlug)
    setOnSuccess(collectionSlug, () => router.refresh())
  }, [
    router,
    collectionSlug,
    bulkUploadDrawerSlug,
    openModal,
    setCollectionSlug,
    setCurrentActivePath,
    setOnSuccess,
  ])

  useEffect(() => {
    if (!drawerDepth) {
      setStepNav([
        {
          label: labels?.plural,
        },
      ])
    }
  }, [setStepNav, labels, drawerDepth])

  return (
    <Fragment>
      <TableColumnsProvider
        collectionSlug={collectionSlug}
        columnState={columnState}
        docs={docs}
        enableRowSelections={enableRowSelections}
        listPreferences={listPreferences}
        preferenceKey={preferenceKey}
        setTable={setTable}
      >
        <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
          <SelectionProvider docs={docs} totalDocs={data.totalDocs} user={user}>
            {BeforeList}
            <Gutter className={`${baseClass}__wrap`}>
              <ListHeader
                collectionConfig={collectionConfig}
                Description={
                  <div className={`${baseClass}__sub-header`}>
                    <RenderCustomComponent
                      CustomComponent={Description}
                      Fallback={
                        <ViewDescription description={collectionConfig?.admin?.description} />
                      }
                    />
                  </div>
                }
                hasCreatePermission={hasCreatePermission}
                i18n={i18n}
                isBulkUploadEnabled={isBulkUploadEnabled}
                newDocumentURL={newDocumentURL}
                openBulkUpload={openBulkUpload}
                smallBreak={smallBreak}
                t={t}
              />
              <ListControls
                beforeActions={
                  enableRowSelections && typeof onBulkSelect === 'function'
                    ? beforeActions
                      ? [...beforeActions, <SelectMany key="select-many" onClick={onBulkSelect} />]
                      : [<SelectMany key="select-many" onClick={onBulkSelect} />]
                    : beforeActions
                }
                collectionConfig={collectionConfig}
                collectionSlug={collectionSlug}
                disableBulkDelete={disableBulkDelete}
                disableBulkEdit={disableBulkEdit}
                renderedFilters={renderedFilters}
              />
              {BeforeListTable}
              {docs.length > 0 && <RelationshipProvider>{Table}</RelationshipProvider>}
              {docs.length === 0 && (
                <div className={`${baseClass}__no-results`}>
                  <p>
                    {i18n.t('general:noResults', { label: getTranslation(labels?.plural, i18n) })}
                  </p>
                  {hasCreatePermission && newDocumentURL && (
                    <Fragment>
                      {isInDrawer ? (
                        <Button el="button" onClick={() => openModal(createNewDrawerSlug)}>
                          {i18n.t('general:createNewLabel', {
                            label: getTranslation(labels?.singular, i18n),
                          })}
                        </Button>
                      ) : (
                        <Button el="link" Link={Link} to={newDocumentURL}>
                          {i18n.t('general:createNewLabel', {
                            label: getTranslation(labels?.singular, i18n),
                          })}
                        </Button>
                      )}
                    </Fragment>
                  )}
                </div>
              )}
              {AfterListTable}
              {docs.length > 0 && (
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
                  {data.totalDocs > 0 && (
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
                        limit={isNumber(query?.limit) ? Number(query.limit) : initialLimit}
                        limits={collectionConfig?.admin?.pagination?.limits}
                        resetPage={data.totalDocs <= data.pagingCounter}
                      />
                      {smallBreak && (
                        <div className={`${baseClass}__list-selection`}>
                          <ListSelection
                            label={getTranslation(collectionConfig.labels.plural, i18n)}
                          />
                          <div className={`${baseClass}__list-selection-actions`}>
                            {enableRowSelections && typeof onBulkSelect === 'function'
                              ? beforeActions
                                ? [
                                    ...beforeActions,
                                    <SelectMany key="select-many" onClick={onBulkSelect} />,
                                  ]
                                : [<SelectMany key="select-many" onClick={onBulkSelect} />]
                              : beforeActions}
                            {!disableBulkEdit && (
                              <Fragment>
                                <EditMany collection={collectionConfig} />
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
            {AfterList}
          </SelectionProvider>
        </div>
      </TableColumnsProvider>
    </Fragment>
  )
}
