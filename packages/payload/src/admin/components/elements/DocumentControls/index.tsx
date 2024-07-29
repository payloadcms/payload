import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { CollectionPermission, GlobalPermission } from '../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { CollectionEditViewProps } from '../../views/types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { formatDate } from '../../../utilities/formatDate'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import Autosave from '../Autosave'
import DeleteDocument from '../DeleteDocument'
import DuplicateDocument from '../DuplicateDocument'
import { Gutter } from '../Gutter'
import Popup from '../Popup'
import * as PopupList from '../Popup/PopupButtonList'
import PreviewButton from '../PreviewButton'
import { Publish } from '../Publish'
import { Save } from '../Save'
import { SaveDraft } from '../SaveDraft'
import Status from '../Status'
import './index.scss'

const baseClass = 'doc-controls'

export const DocumentControls: React.FC<{
  apiURL: string
  collection?: SanitizedCollectionConfig
  data?: any
  disableActions?: boolean
  global?: SanitizedGlobalConfig
  hasSavePermission?: boolean
  id?: string
  isAccountView?: boolean
  isEditing?: boolean
  onSave?: CollectionEditViewProps['onSave']
  permissions?: CollectionPermission | GlobalPermission
}> = (props) => {
  const {
    id,
    collection,
    data,
    disableActions,
    global,
    hasSavePermission,
    isAccountView,
    isEditing,
    onSave,
    permissions,
  } = props

  const { slug, publishedDoc } = useDocumentInfo()

  const {
    admin: { dateFormat },
    collections,
    globals,
    routes: { admin: adminRoute },
  } = useConfig()

  const collectionConfig = collections.find((coll) => coll.slug === slug)
  const globalConfig = globals.find((global) => global.slug === slug)

  const { i18n, t } = useTranslation('general')

  const hasCreatePermission = 'create' in permissions && permissions.create?.permission
  const hasDeletePermission = 'delete' in permissions && permissions.delete?.permission

  const showDotMenu = Boolean(
    collection && id && !disableActions && (hasCreatePermission || hasDeletePermission),
  )

  const collectionLabel = () => {
    const label = collection?.labels?.singular
    if (!label) return t('document')
    return typeof label === 'string' ? label : getTranslation(label, i18n)
  }

  const unsavedDraftWithValidations =
    !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <ul className={`${baseClass}__meta`}>
            {collection && !isEditing && !isAccountView && (
              <li className={`${baseClass}__list-item`}>
                <p className={`${baseClass}__value`}>
                  {t('creatingNewLabel', { label: collectionLabel() })}
                </p>
              </li>
            )}
            {(collection?.versions?.drafts || global?.versions?.drafts) && (
              <Fragment>
                {(global || (collection && isEditing)) && (
                  <li
                    className={[`${baseClass}__status`, `${baseClass}__list-item`]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Status />
                  </li>
                )}
                {((collectionConfig?.versions?.drafts &&
                  collectionConfig?.versions?.drafts?.autosave &&
                  !unsavedDraftWithValidations) ||
                  (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
                  hasSavePermission && (
                    <li className={`${baseClass}__list-item`}>
                      <Autosave
                        collection={collection}
                        global={global}
                        id={id}
                        onSave={onSave}
                        publishedDocUpdatedAt={publishedDoc?.updatedAt || data?.createdAt}
                      />
                    </li>
                  )}
              </Fragment>
            )}
            {collection?.timestamps && (isEditing || isAccountView) && (
              <Fragment>
                <li
                  className={[`${baseClass}__list-item`, `${baseClass}__value-wrap`]
                    .filter(Boolean)
                    .join(' ')}
                  title={
                    data?.updatedAt ? formatDate(data?.updatedAt, dateFormat, i18n?.language) : ''
                  }
                >
                  <p className={`${baseClass}__label`}>{t('lastModified')}:&nbsp;</p>
                  {data?.updatedAt && (
                    <p className={`${baseClass}__value`}>
                      {formatDate(data.updatedAt, dateFormat, i18n?.language)}
                    </p>
                  )}
                </li>
                <li
                  className={[`${baseClass}__list-item`, `${baseClass}__value-wrap`]
                    .filter(Boolean)
                    .join(' ')}
                  title={
                    publishedDoc?.createdAt || data?.createdAt
                      ? formatDate(
                          publishedDoc?.createdAt || data?.createdAt,
                          dateFormat,
                          i18n?.language,
                        )
                      : ''
                  }
                >
                  <p className={`${baseClass}__label`}>{t('created')}:&nbsp;</p>
                  {(publishedDoc?.createdAt || data?.createdAt) && (
                    <p className={`${baseClass}__value`}>
                      {formatDate(
                        publishedDoc?.createdAt || data?.createdAt,
                        dateFormat,
                        i18n?.language,
                      )}
                    </p>
                  )}
                </li>
              </Fragment>
            )}
          </ul>
        </div>
        <div className={`${baseClass}__controls-wrapper`}>
          <div className={`${baseClass}__controls`}>
            {(collection?.admin?.preview || global?.admin?.preview) && (
              <PreviewButton
                CustomComponent={
                  collection?.admin?.components?.edit?.PreviewButton ||
                  global?.admin?.components?.elements?.PreviewButton
                }
                generatePreviewURL={collection?.admin?.preview || global?.admin?.preview}
              />
            )}
            {hasSavePermission && (
              <React.Fragment>
                {collection?.versions?.drafts || global?.versions?.drafts ? (
                  <React.Fragment>
                    {((collectionConfig?.versions?.drafts &&
                      !collectionConfig?.versions?.drafts?.autosave) ||
                      unsavedDraftWithValidations ||
                      (globalConfig?.versions?.drafts &&
                        !globalConfig?.versions?.drafts?.autosave)) && (
                      <SaveDraft
                        CustomComponent={
                          collection?.admin?.components?.edit?.SaveDraftButton ||
                          global?.admin?.components?.elements?.SaveDraftButton
                        }
                      />
                    )}
                    <Publish
                      CustomComponent={
                        collection?.admin?.components?.edit?.PublishButton ||
                        global?.admin?.components?.elements?.PublishButton
                      }
                    />
                  </React.Fragment>
                ) : (
                  <Save
                    CustomComponent={
                      collection?.admin?.components?.edit?.SaveButton ||
                      global?.admin?.components?.elements?.SaveButton
                    }
                  />
                )}
              </React.Fragment>
            )}
          </div>
          {showDotMenu && (
            <Popup
              button={
                <div className={`${baseClass}__dots`}>
                  <div />
                  <div />
                  <div />
                </div>
              }
              className={`${baseClass}__popup`}
              horizontalAlign="right"
              size="large"
              verticalAlign="bottom"
            >
              <PopupList.ButtonGroup>
                {hasCreatePermission && (
                  <React.Fragment>
                    <PopupList.Button
                      id="action-create"
                      to={`${adminRoute}/collections/${collection?.slug}/create`}
                    >
                      {t('createNew')}
                    </PopupList.Button>

                    {!collection?.admin?.disableDuplicate && isEditing && (
                      <DuplicateDocument collection={collection} id={id} slug={collection?.slug} />
                    )}
                  </React.Fragment>
                )}
                {hasDeletePermission && (
                  <DeleteDocument buttonId="action-delete" collection={collection} id={id} />
                )}
              </PopupList.ButtonGroup>
            </Popup>
          )}
        </div>
      </div>
      <div className={`${baseClass}__divider`} />
    </Gutter>
  )
}
