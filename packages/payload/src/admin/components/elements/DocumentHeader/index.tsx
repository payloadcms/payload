import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { CollectionPermission } from '../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../exports/types'

import { formatDate } from '../../../utilities/formatDate'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import Autosave from '../Autosave'
import DeleteDocument from '../DeleteDocument'
import DuplicateDocument from '../DuplicateDocument'
import { Gutter } from '../Gutter'
import PreviewButton from '../PreviewButton'
import { Publish } from '../Publish'
import { Save } from '../Save'
import { SaveDraft } from '../SaveDraft'
import Status from '../Status'
import './index.scss'

const baseClass = 'document-header'

export const DocumentHeader: React.FC<{
  collection: SanitizedCollectionConfig
  data?: any
  disableActions?: boolean
  hasSavePermission: boolean
  id: string
  isEditing: boolean
  permissions: CollectionPermission
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
    <Gutter
      className={[
        baseClass,
        ((collection.versions?.drafts && !collection.versions?.drafts?.autosave) ||
          (isEditing && preview)) &&
          `${baseClass}--has-2`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
              <div className={`${baseClass}__label`}>{t('lastModified')}</div>
              <div>{formatDate(data.updatedAt, dateFormat, i18n?.language)}</div>
            </li>
          )}
          {(publishedDoc?.createdAt || data?.createdAt) && (
            <li className={`${baseClass}__timestamp`}>
              <div className={`${baseClass}__label`}>{t('created')}</div>
              <div>
                {formatDate(publishedDoc?.createdAt || data?.createdAt, dateFormat, i18n?.language)}
              </div>
            </li>
          )}
        </ul>
      )}
      {isEditing &&
        preview &&
        (!collection.versions?.drafts || collection.versions?.drafts?.autosave) && (
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
                <SaveDraft CustomComponent={collection?.admin?.components?.edit?.SaveDraftButton} />
              )}

              <Publish CustomComponent={collection?.admin?.components?.edit?.PublishButton} />
            </React.Fragment>
          ) : (
            <Save CustomComponent={collection?.admin?.components?.edit?.SaveButton} />
          )}
        </React.Fragment>
      )}
      {!disableActions && (
        <ul className={`${baseClass}__collection-actions`}>
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
      )}
    </Gutter>
  )
}
