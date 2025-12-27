import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { ClientCollectionConfig, ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { CloseModalButton } from '../../../elements/CloseModalButton/index.js'
import { DefaultListViewTabs } from '../../../elements/DefaultListViewTabs/index.js'
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { DrawerRelationshipSelect } from '../../../elements/ListHeader/DrawerRelationshipSelect/index.js'
import { ListDrawerCreateNewDocButton } from '../../../elements/ListHeader/DrawerTitleActions/index.js'
import { ListHeader } from '../../../elements/ListHeader/index.js'
import {
  ListBulkUploadButton,
  ListCreateNewButton,
  ListEmptyTrashButton,
} from '../../../elements/ListHeader/TitleActions/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useListQuery } from '../../../providers/ListQuery/index.js'
import { ListSelection } from '../ListSelection/index.js'
import './index.scss'

const drawerBaseClass = 'list-drawer'

export type ListHeaderProps = {
  Actions?: React.ReactNode[]
  className?: string
  collectionConfig: ClientCollectionConfig
  Description?: React.ReactNode
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  hasCreatePermission: boolean
  hasDeletePermission?: boolean
  i18n: I18nClient
  isBulkUploadEnabled: boolean
  isTrashEnabled?: boolean
  listSelectionItems?: React.ReactNode[]
  newDocumentURL: string
  onBulkUploadSuccess?: () => void
  /** @deprecated This prop will be removed in the next major version.
   *
   * Opening of the bulk upload modal is handled internally.
   *
   * Prefer `onBulkUploadSuccess` usage to handle the success of the bulk upload.
   */
  openBulkUpload: () => void
  smallBreak: boolean
  /** @deprecated This prop will be removed in the next major version. */
  t?: TFunction
  TitleActions?: React.ReactNode[]
  viewType?: ViewTypes
}

export const CollectionListHeader: React.FC<ListHeaderProps> = ({
  className,
  collectionConfig,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  hasCreatePermission,
  hasDeletePermission,
  i18n,
  isBulkUploadEnabled,
  isTrashEnabled,
  listSelectionItems,
  newDocumentURL,
  onBulkUploadSuccess,
  openBulkUpload,
  smallBreak,
  viewType,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { drawerSlug, isInDrawer, selectedOption } = useListDrawerContext()
  const isTrashRoute = viewType === 'trash'
  const { isGroupingBy } = useListQuery()

  if (isInDrawer) {
    return (
      <ListHeader
        Actions={[
          <CloseModalButton
            className={`${drawerBaseClass}__header-close`}
            key="close-button"
            slug={drawerSlug}
          />,
        ]}
        AfterListHeaderContent={
          <>
            {Description}
            {<DrawerRelationshipSelect />}
          </>
        }
        className={`${drawerBaseClass}__header`}
        title={getTranslation(
          getEntityConfig({ collectionSlug: selectedOption.value })?.labels?.plural,
          i18n,
        )}
        TitleActions={[
          <ListDrawerCreateNewDocButton
            hasCreatePermission={hasCreatePermission}
            key="list-drawer-create-new-doc"
          />,
        ].filter(Boolean)}
      />
    )
  }

  return (
    <ListHeader
      Actions={[
        !smallBreak && !isGroupingBy && (
          <ListSelection
            collectionConfig={collectionConfig}
            disableBulkDelete={disableBulkDelete}
            disableBulkEdit={disableBulkEdit}
            key="list-selection"
            label={getTranslation(collectionConfig?.labels?.plural, i18n)}
            ListSelectionItems={listSelectionItems}
            showSelectAllAcrossPages={!isGroupingBy}
            viewType={viewType}
          />
        ),
        <DefaultListViewTabs
          collectionConfig={collectionConfig}
          config={config}
          key="default-list-actions"
          viewType={viewType}
        />,
      ].filter(Boolean)}
      AfterListHeaderContent={Description}
      className={className}
      title={getTranslation(collectionConfig?.labels?.plural, i18n)}
      TitleActions={[
        hasCreatePermission && !isTrashRoute && (
          <ListCreateNewButton
            collectionConfig={collectionConfig}
            hasCreatePermission={hasCreatePermission}
            key="list-header-create-new-doc"
            newDocumentURL={newDocumentURL}
          />
        ),
        hasCreatePermission && isBulkUploadEnabled && !isTrashRoute && (
          <ListBulkUploadButton
            collectionSlug={collectionConfig.slug}
            hasCreatePermission={hasCreatePermission}
            isBulkUploadEnabled={isBulkUploadEnabled}
            key="list-header-bulk-upload"
            onBulkUploadSuccess={onBulkUploadSuccess}
            openBulkUpload={openBulkUpload}
          />
        ),
        hasDeletePermission && isTrashEnabled && viewType === 'trash' && (
          <ListEmptyTrashButton
            collectionConfig={collectionConfig}
            hasDeletePermission={hasDeletePermission}
            key="list-header-empty-trash"
          />
        ),
      ].filter(Boolean)}
    />
  )
}
