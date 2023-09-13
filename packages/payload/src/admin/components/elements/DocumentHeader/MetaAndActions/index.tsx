import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { CollectionPermission } from '../../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../../exports/types'

import { formatDate } from '../../../../utilities/formatDate'
import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import Autosave from '../../Autosave'
import DeleteDocument from '../../DeleteDocument'
import DuplicateDocument from '../../DuplicateDocument'
import { Gutter } from '../../Gutter'
import Popup from '../../Popup'
import PreviewButton from '../../PreviewButton'
import { Publish } from '../../Publish'
import { Save } from '../../Save'
import { SaveDraft } from '../../SaveDraft'
import Status from '../../Status'
import './index.scss'

const baseClass = 'meta-and-actions'

export const MetaAndActions: React.FC<{
  apiURL: string
  collection: SanitizedCollectionConfig
  data?: any
  disableActions?: boolean
  hasSavePermission?: boolean
  id: string
  isEditing: boolean
  permissions?: CollectionPermission
}> = (props) => {
  const { collection, data, disableActions, hasSavePermission, id, isEditing, permissions } = props

  const {
    admin: { disableDuplicate, preview },
    slug,
    timestamps,
  } = collection

  const { publishedDoc } = useDocumentInfo()

  const {
    admin: { dateFormat },
    routes: { admin: adminRoute },
  } = useConfig()

  const { i18n, t } = useTranslation('general')

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        {collection.versions?.drafts && (
          <React.Fragment>
            <Status />
            {collection.versions?.drafts.autosave && hasSavePermission && (
              <Autosave
                collection={collection}
                id={id}
                publishedDocUpdatedAt={publishedDoc?.updatedAt || data?.createdAt}
              />
            )}
          </React.Fragment>
        )}
        {timestamps && (
          <ul className={`${baseClass}__timestamps`}>
            {data?.updatedAt && (
              <li className={`${baseClass}__timestamp`}>
                <div className={`${baseClass}__label`}>{t('lastModified')}:&nbsp;</div>
                <p
                  className={`${baseClass}__stamp`}
                  title={formatDate(data.updatedAt, dateFormat, i18n?.language)}
                >
                  {formatDate(data.updatedAt, dateFormat, i18n?.language)}
                </p>
              </li>
            )}
            {(publishedDoc?.createdAt || data?.createdAt) && (
              <li className={`${baseClass}__timestamp`}>
                <div className={`${baseClass}__label`}>{t('created')}:&nbsp;</div>
                <p
                  className={`${baseClass}__stamp`}
                  title={formatDate(
                    publishedDoc?.createdAt || data?.createdAt,
                    dateFormat,
                    i18n?.language,
                  )}
                >
                  {formatDate(
                    publishedDoc?.createdAt || data?.createdAt,
                    dateFormat,
                    i18n?.language,
                  )}
                </p>
              </li>
            )}
          </ul>
        )}
        <div className={`${baseClass}__controls-wrapper`}>
          <div className={`${baseClass}__controls`}>
            {isEditing &&
              preview &&
              collection.versions?.drafts &&
              !collection.versions?.drafts?.autosave && (
                <PreviewButton
                  CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                  generatePreviewURL={preview}
                />
              )}
            {hasSavePermission && (
              <React.Fragment>
                {collection.versions?.drafts ? (
                  <React.Fragment>
                    {!collection.versions.drafts.autosave && (
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
          {!disableActions && (
            <Popup
              button={
                <div className={`${baseClass}__dots`}>
                  <div />
                  <div />
                  <div />
                </div>
              }
              className={`${baseClass}__popup`}
              verticalAlign="bottom"
            >
              <ul className={`${baseClass}__popup-actions`}>
                {permissions?.create?.permission && (
                  <React.Fragment>
                    <li>
                      <Link id="action-create" to={`${adminRoute}/collections/${slug}/create`}>
                        {t('createNew')}
                      </Link>
                    </li>
                    {!disableDuplicate && isEditing && (
                      <li>
                        <DuplicateDocument collection={collection} id={id} slug={slug} />
                      </li>
                    )}
                  </React.Fragment>
                )}
                {permissions?.delete?.permission && (
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
