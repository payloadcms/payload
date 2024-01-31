'use client'
import React, { Fragment } from 'react'

import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import { formatDate } from '../../utilities/formatDate'
import { useDocumentInfo } from '../../providers/DocumentInfo'
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
import { useConfig } from '../../providers/Config'
import { useTranslation } from '../../providers/Translation'

import './index.scss'

const baseClass = 'doc-controls'

export const DocumentControls: React.FC<{
  apiURL: string
  data?: any
  disableActions?: boolean
  hasSavePermission?: boolean
  id?: number | string
  isAccountView?: boolean
  isEditing?: boolean
  permissions: CollectionPermission | GlobalPermission | null
  slug: SanitizedCollectionConfig['slug'] | SanitizedGlobalConfig['slug']
}> = (props) => {
  const {
    id,
    data,
    disableActions,
    hasSavePermission,
    isAccountView,
    isEditing,
    permissions,
    slug,
  } = props

  const { i18n } = useTranslation()

  const config = useConfig()

  const collectionConfig = config.collections.find((coll) => coll.slug === slug)

  const {
    admin: { dateFormat },
    routes: { admin: adminRoute },
  } = config

  const hasCreatePermission =
    permissions && 'create' in permissions && permissions.create?.permission

  const hasDeletePermission =
    permissions && 'delete' in permissions && permissions.delete?.permission

  const showDotMenu = Boolean(
    collectionConfig && id && !disableActions && (hasCreatePermission || hasDeletePermission),
  )

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <ul className={`${baseClass}__meta`}>
            {collectionConfig && !isEditing && !isAccountView && (
              <li className={`${baseClass}__list-item`}>
                <p className={`${baseClass}__value`}>
                  {i18n.t('general:creatingNewLabel', {
                    label:
                      typeof collectionConfig?.labels?.singular === 'string'
                        ? collectionConfig.labels.singular
                        : 'document',
                  })}
                </p>
              </li>
            )}
            {(collectionConfig?.versions?.drafts || global?.versions?.drafts) && (
              <Fragment>
                {(global || (collectionConfig && isEditing)) && (
                  <li
                    className={[`${baseClass}__status`, `${baseClass}__list-item`]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Status />
                  </li>
                )}
                {((collectionConfig?.versions?.drafts &&
                  collectionConfig?.versions?.drafts?.autosave) ||
                  (global?.versions?.drafts && global?.versions?.drafts?.autosave)) &&
                  hasSavePermission && (
                    <li className={`${baseClass}__list-item`}>
                      {/* <Autosave
                        collection={collectionConfig}
                        global={global}
                        id={id}
                        publishedDocUpdatedAt={data?.createdAt}
                      /> */}
                    </li>
                  )}
              </Fragment>
            )}
            {collectionConfig?.timestamps && (isEditing || isAccountView) && (
              <Fragment>
                <li
                  className={[`${baseClass}__list-item`, `${baseClass}__value-wrap`]
                    .filter(Boolean)
                    .join(' ')}
                  title={
                    data?.updatedAt ? formatDate(data?.updatedAt, dateFormat, i18n.language) : ''
                  }
                >
                  <p className={`${baseClass}__label`}>{i18n.t('general:lastModified')}:&nbsp;</p>
                  {data?.updatedAt && (
                    <p className={`${baseClass}__value`}>
                      {formatDate(data.updatedAt, dateFormat, i18n.language)}
                    </p>
                  )}
                </li>
                <li
                  className={[`${baseClass}__list-item`, `${baseClass}__value-wrap`]
                    .filter(Boolean)
                    .join(' ')}
                  title={
                    data?.createdAt ? formatDate(data?.createdAt, dateFormat, i18n.language) : ''
                  }
                >
                  <p className={`${baseClass}__label`}>{i18n.t('general:created')}:&nbsp;</p>
                  {data?.createdAt && (
                    <p className={`${baseClass}__value`}>
                      {formatDate(data?.createdAt, dateFormat, i18n.language)}
                    </p>
                  )}
                </li>
              </Fragment>
            )}
          </ul>
        </div>
        <div className={`${baseClass}__controls-wrapper`}>
          <div className={`${baseClass}__controls`}>
            {/* {(collectionConfig?.admin?.preview || global?.admin?.preview) && (
              <PreviewButton
                CustomComponent={
                  collectionConfig?.admin?.components?.edit?.PreviewButton ||
                  global?.admin?.components?.elements?.PreviewButton
                }
                generatePreviewURL={collectionConfig?.admin?.preview || global?.admin?.preview}
              />
            )} */}
            {hasSavePermission && (
              <React.Fragment>
                {collectionConfig?.versions?.drafts || global?.versions?.drafts ? (
                  <React.Fragment>
                    {((collectionConfig?.versions?.drafts &&
                      !collectionConfig?.versions?.drafts?.autosave) ||
                      (global?.versions?.drafts && !global?.versions?.drafts?.autosave)) && (
                      <SaveDraft
                        CustomComponent={
                          collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
                          global?.admin?.components?.elements?.SaveDraftButton
                        }
                      />
                    )}
                    <Publish
                      CustomComponent={
                        collectionConfig?.admin?.components?.edit?.PublishButton ||
                        global?.admin?.components?.elements?.PublishButton
                      }
                    />
                  </React.Fragment>
                ) : (
                  <Save
                    CustomComponent={
                      collectionConfig?.admin?.components?.edit?.SaveButton ||
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
                      to={`${adminRoute}/collections/${collectionConfig?.slug}/create`}
                    >
                      {i18n.t('general:createNew')}
                    </PopupList.Button>
                    {!collectionConfig?.admin?.disableDuplicate && isEditing && (
                      <DuplicateDocument
                        singularLabel={collectionConfig?.labels?.singular}
                        id={id.toString()}
                        slug={collectionConfig?.slug}
                      />
                    )}
                  </React.Fragment>
                )}
                {hasDeletePermission && (
                  <DeleteDocument
                    buttonId="action-delete"
                    collectionSlug={collectionConfig?.slug}
                    useAsTitle={collectionConfig?.admin?.useAsTitle}
                    singularLabel={collectionConfig?.labels?.singular}
                    id={id.toString()}
                  />
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
