import type { ClientCollectionConfig } from 'payload'

import { getTranslation, type I18nClient, type TFunction } from '@payloadcms/translations'
import LinkImport from 'next/link.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default
import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { Button } from '../../../elements/Button/index.js'
import { ListSelection } from '../../../elements/ListSelection/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { ReactSelect } from '../../../elements/ReactSelect/index.js'
import { ViewDescription } from '../../../elements/ViewDescription/index.js'
import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useListInfo } from '../../../providers/ListInfo/index.js'
import './index.scss'

const baseClass = 'list-header'
const drawerBaseClass = 'list-drawer-header'

type Props = {
  className?: string
  collectionConfig: ClientCollectionConfig
  Description?: React.ReactNode
  hasCreatePermission: boolean
  i18n: I18nClient
  isBulkUploadEnabled: boolean
  newDocumentURL: string
  openBulkUpload: () => void
  smallBreak: boolean
  t: TFunction
}

const DefaultListHeader: React.FC<Props> = ({
  className,
  collectionConfig,
  Description,
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
        <ListSelection label={getTranslation(collectionConfig?.labels?.plural, i18n)} />
      )}
      {collectionConfig?.admin?.description || Description ? (
        <div className={`${baseClass}__sub-header`}>
          {Description ?? <ViewDescription description={collectionConfig?.admin?.description} />}
        </div>
      ) : null}
    </header>
  )
}

const ListDrawerHeader: React.FC<Props> = ({ Description, hasCreatePermission, i18n, t }) => {
  const {
    config: { collections },
  } = useConfig()

  const { closeModal, openModal } = useModal()

  const { createNewDrawerSlug, drawerSlug, enabledCollections, selectedOption, setSelectedOption } =
    useListInfo()

  const collectionConfig = collections.find(({ slug }) => slug === selectedOption.value)

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
            <button
              className={`${drawerBaseClass}__create-new-button`}
              onClick={() => openModal(createNewDrawerSlug)}
              type="button"
            >
              <Pill>{t('general:createNew')}</Pill>
            </button>
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
      {collectionConfig?.admin?.description || Description ? (
        <div className={`${drawerBaseClass}__sub-header`}>
          {Description ?? <ViewDescription description={collectionConfig?.admin?.description} />}
        </div>
      ) : null}
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

export const ListHeader: React.FC<Props> = (props) => {
  const { isInDrawer } = useListInfo()

  if (isInDrawer) {
    return <ListDrawerHeader {...props} />
  }

  return <DefaultListHeader {...props} />
}
