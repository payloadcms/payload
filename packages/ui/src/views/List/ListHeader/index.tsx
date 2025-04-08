import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { CloseModalButton } from '../../../elements/CloseModalButton/index.js'
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { ListFolderPills } from '../../../elements/ListFolderPills/index.js'
import { DrawerRelationshipSelect } from '../../../elements/ListHeader/DrawerRelationshipSelect/index.js'
import { ListDrawerCreateNewDocButton } from '../../../elements/ListHeader/DrawerTitleActions/index.js'
import { CollectionListHeader } from '../../../elements/ListHeader/index.js'
import {
  ListBulkUploadButton,
  ListCreateNewButton,
} from '../../../elements/ListHeader/TitleActions/index.js'
import { useConfig } from '../../../providers/Config/index.js'
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
  i18n: I18nClient
  isBulkUploadEnabled: boolean
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
  t: TFunction
  TitleActions?: React.ReactNode[]
  viewType?: 'folders' | 'list'
}

export const ListHeader: React.FC<ListHeaderProps> = ({
  className,
  collectionConfig,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  hasCreatePermission,
  i18n,
  isBulkUploadEnabled,
  newDocumentURL,
  onBulkUploadSuccess,
  openBulkUpload,
  smallBreak,
  t,
  viewType,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { drawerSlug, isInDrawer, selectedOption } = useListDrawerContext()

  if (isInDrawer) {
    return (
      <CollectionListHeader
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
        collectionConfig={getEntityConfig({ collectionSlug: selectedOption.value })}
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
    <CollectionListHeader
      Actions={[
        !smallBreak && (
          <ListSelection
            collectionConfig={collectionConfig}
            disableBulkDelete={disableBulkDelete}
            disableBulkEdit={disableBulkEdit}
            key="list-selection"
            label={getTranslation(collectionConfig?.labels?.plural, i18n)}
          />
        ),
        Object.keys(config.folders.collections).includes(collectionConfig.slug) && (
          <ListFolderPills
            collectionConfig={collectionConfig}
            key="list-header-buttons"
            viewType={viewType}
          />
        ),
      ].filter(Boolean)}
      AfterListHeaderContent={Description}
      className={className}
      collectionConfig={collectionConfig}
      TitleActions={[
        hasCreatePermission && (
          <ListCreateNewButton
            collectionConfig={collectionConfig}
            hasCreatePermission={hasCreatePermission}
            key="list-header-create-new-doc"
            newDocumentURL={newDocumentURL}
          />
        ),
        hasCreatePermission && isBulkUploadEnabled && (
          <ListBulkUploadButton
            collectionSlug={collectionConfig.slug}
            hasCreatePermission={hasCreatePermission}
            isBulkUploadEnabled={isBulkUploadEnabled}
            key="list-header-bulk-upload"
            onBulkUploadSuccess={onBulkUploadSuccess}
            openBulkUpload={openBulkUpload}
          />
        ),
      ].filter(Boolean)}
    />
  )
}
