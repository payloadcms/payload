import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Button } from '../../../elements/Button/index.js'
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { ListFolderPills } from '../../../elements/ListFolderPills/index.js'
import { DrawerRelationshipSelect } from '../../../elements/ListHeader/DrawerRelationshipSelect/index.js'
import { DefaultDrawerTitleActions } from '../../../elements/ListHeader/DrawerTitleActions/index.js'
import { CollectionListHeader } from '../../../elements/ListHeader/index.js'
import { DefaultTitleActions } from '../../../elements/ListHeader/TitleActions/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import './index.scss'
import { ListSelection } from '../ListSelection/index.js'

const drawerBaseClass = 'list-drawer'
const baseClass = 'list-header'
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
  openBulkUpload,
  smallBreak,
  t,
  viewType,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { drawerSlug, isInDrawer, selectedOption } = useListDrawerContext()
  const { closeModal } = useModal()

  if (isInDrawer) {
    return (
      <CollectionListHeader
        Actions={[
          <button
            aria-label={t('general:close')}
            className={`${drawerBaseClass}__close-drawer-button`}
            key="close-button"
            onClick={() => {
              closeModal(drawerSlug)
            }}
            type="button"
          >
            <XIcon />
          </button>,
        ]}
        AfterListHeaderContent={
          <>
            {Description}
            {<DrawerRelationshipSelect />}
          </>
        }
        className={`${drawerBaseClass}__header`}
        collectionConfig={getEntityConfig({ collectionSlug: selectedOption.value })}
        TitleActions={DefaultDrawerTitleActions({
          hasCreatePermission,
          t,
        }).filter(Boolean)}
      />
    )
  }

  return (
    <CollectionListHeader
      Actions={[
        !smallBreak && (
          <ListSelection
            disableBulkDelete={disableBulkDelete}
            disableBulkEdit={disableBulkEdit}
            key="list-selection"
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
      TitleActions={DefaultTitleActions({
        collectionConfig,
        hasCreatePermission,
        i18n,
        isBulkUploadEnabled,
        newDocumentURL,
        openBulkUpload,
        t,
      }).filter(Boolean)}
    />
  )
}
