import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { Button } from '../../../elements/Button/index.js'
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { ListSelection } from '../../../elements/ListSelection/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { ReactSelect } from '../../../elements/ReactSelect/index.js'
import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import './index.scss'

const baseClass = 'list-header'
const drawerBaseClass = 'list-drawer'

export type ListHeaderProps = {
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
}

const DefaultListHeader: React.FC<ListHeaderProps> = ({
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
}) => {
  return (
    <header className={[baseClass, className].filter(Boolean).join(' ')}>
      <h1>{getTranslation(collectionConfig?.labels?.plural, i18n)}</h1>
      {hasCreatePermission && (
        <>
          <Button
            aria-label={i18n.t('general:createNewLabel', {
              label: getTranslation(collectionConfig?.labels?.singular, i18n),
            })}
            buttonStyle="pill"
            el={'link'}
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
        <ListSelection
          collectionConfig={collectionConfig}
          disableBulkDelete={disableBulkDelete}
          disableBulkEdit={disableBulkEdit}
          label={getTranslation(collectionConfig?.labels?.plural, i18n)}
        />
      )}
      {Description}
    </header>
  )
}

const ListDrawerHeader: React.FC<ListHeaderProps> = ({
  Description,
  hasCreatePermission,
  i18n,
  t,
}) => {
  const {
    config: { collections },
    getEntityConfig,
  } = useConfig()

  const { closeModal } = useModal()

  const {
    DocumentDrawerToggler,
    drawerSlug,
    enabledCollections,
    selectedOption,
    setSelectedOption,
  } = useListDrawerContext()

  const collectionConfig = getEntityConfig({ collectionSlug: selectedOption.value })

  const enabledCollectionConfigs = collections.filter(({ slug }) =>
    enabledCollections.includes(slug),
  )

  const moreThanOneAvailableCollection = enabledCollections.length > 1

  return (
    <header className={`${drawerBaseClass}__header`}>
      <div className={`${drawerBaseClass}__header-wrap`}>
        <div className={`${drawerBaseClass}__header-content`}>
          <h2 className={`${drawerBaseClass}__header-text`}>
            {getTranslation(collectionConfig?.labels?.plural, i18n)}
          </h2>
          {hasCreatePermission && (
            <DocumentDrawerToggler className={`${drawerBaseClass}__create-new-button`}>
              <Pill>{t('general:createNew')}</Pill>
            </DocumentDrawerToggler>
          )}
        </div>
        <button
          aria-label={t('general:close')}
          className={`${drawerBaseClass}__header-close`}
          onClick={() => {
            closeModal(drawerSlug)
          }}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      {Description}
      {moreThanOneAvailableCollection && (
        <div className={`${drawerBaseClass}__select-collection-wrap`}>
          <FieldLabel label={t('upload:selectCollectionToBrowse')} />
          <ReactSelect
            className={`${baseClass}__select-collection`}
            onChange={setSelectedOption}
            options={enabledCollectionConfigs.map((coll) => ({
              label: getTranslation(coll.labels.singular, i18n),
              value: coll.slug,
            }))}
            value={{
              label: getTranslation(collectionConfig?.labels.singular, i18n),
              value: collectionConfig?.slug,
            }}
          />
        </div>
      )}
    </header>
  )
}

export const ListHeader: React.FC<ListHeaderProps> = (props) => {
  const { isInDrawer } = useListDrawerContext()

  if (isInDrawer) {
    return <ListDrawerHeader {...props} />
  }

  return <DefaultListHeader {...props} />
}
