import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { CollectionPermission, GlobalPermission } from '../../../../auth'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'

import { formatDate } from '../../../utilities/formatDate'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import Autosave from '../Autosave'
import DeleteDocument from '../DeleteDocument'
import DuplicateDocument from '../DuplicateDocument'
import { Gutter } from '../Gutter'
import Popup from '../Popup'
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
  isEditing?: boolean
  permissions?: CollectionPermission | GlobalPermission
}> = (props) => {
  const {
    id,
    collection,
    data,
    disableActions,
    global,
    hasSavePermission,
    isEditing,
    permissions,
  } = props

  const { publishedDoc } = useDocumentInfo()

  const {
    admin: { dateFormat },
    routes: { admin: adminRoute },
  } = useConfig()

  const { i18n, t } = useTranslation('general')

  let showPreviewButton = false

  if (collection) {
    showPreviewButton =
      isEditing &&
      collection?.admin?.preview &&
      collection?.versions?.drafts &&
      !collection?.versions?.drafts?.autosave
  }

  if (global) {
    showPreviewButton =
      isEditing &&
      global?.admin?.preview &&
      global?.versions?.drafts &&
      !global?.versions?.drafts?.autosave
  }

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          {collection?.timestamps && (
            <ul className={`${baseClass}__timestamps`}>
              <li
                className={`${baseClass}__timestamp`}
                title={
                  data?.updatedAt ? formatDate(data?.updatedAt, dateFormat, i18n?.language) : ''
                }
              >
                <div className={`${baseClass}__label`}>{t('lastModified')}:&nbsp;</div>
                {data?.updatedAt && (
                  <p className={`${baseClass}__stamp`}>
                    {formatDate(data.updatedAt, dateFormat, i18n?.language)}
                  </p>
                )}
              </li>
              <li
                className={`${baseClass}__timestamp`}
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
                <div className={`${baseClass}__label`}>{t('created')}:&nbsp;</div>
                {(publishedDoc?.createdAt || data?.createdAt) && (
                  <p className={`${baseClass}__stamp`}>
                    {formatDate(
                      publishedDoc?.createdAt || data?.createdAt,
                      dateFormat,
                      i18n?.language,
                    )}
                  </p>
                )}
              </li>
            </ul>
          )}
        </div>
        <div className={`${baseClass}__controls-wrapper`}>
          <div className={`${baseClass}__controls`}>
            {showPreviewButton && (
              <PreviewButton
                CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                generatePreviewURL={collection?.admin?.preview || global?.admin?.preview}
              />
            )}
            {hasSavePermission && (
              <React.Fragment>
                {collection?.versions?.drafts || global?.versions?.drafts ? (
                  <React.Fragment>
                    {((collection?.versions?.drafts && !collection?.versions?.drafts?.autosave) ||
                      (global?.versions?.drafts && !global?.versions?.drafts?.autosave)) && (
                      <SaveDraft
                        CustomComponent={collection?.admin?.components?.edit?.SaveDraftButton}
                      />
                    )}
                    <Publish CustomComponent={collection?.admin?.components?.edit?.PublishButton} />
                  </React.Fragment>
                ) : (
                  <Save CustomComponent={collection?.admin?.components?.edit?.SaveButton} />
                )}
              </React.Fragment>
            )}
          </div>
          {Boolean(collection && !disableActions) && (
            <Popup
              button={
                <div className={`${baseClass}__dots`}>
                  <div />
                  <div />
                  <div />
                </div>
              }
              caret={false}
              className={`${baseClass}__popup`}
              horizontalAlign="center"
              size="large"
              verticalAlign="bottom"
            >
              <ul className={`${baseClass}__popup-actions`}>
                {'create' in permissions && permissions?.create?.permission && (
                  <React.Fragment>
                    <li>
                      <Link
                        id="action-create"
                        to={`${adminRoute}/collections/${collection?.slug}/create`}
                      >
                        {t('createNew')}
                      </Link>
                    </li>
                    {!collection?.admin?.disableDuplicate && isEditing && (
                      <li>
                        <DuplicateDocument
                          collection={collection}
                          id={id}
                          slug={collection?.slug}
                        />
                      </li>
                    )}
                  </React.Fragment>
                )}
                {'delete' in permissions && permissions?.delete?.permission && id && (
                  <li>
                    <DeleteDocument buttonId="action-delete" collection={collection} id={id} />
                  </li>
                )}
              </ul>
            </Popup>
          )}
        </div>
      </div>
    </Gutter>
  )
}
