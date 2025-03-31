'use client'
import type {
  ClientUser,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useEffect } from 'react'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js'
import { Autosave } from '../Autosave/index.js'
import { Button } from '../Button/index.js'
import { CopyLocaleData } from '../CopyLocaleData/index.js'
import { DeleteDocument } from '../DeleteDocument/index.js'
import { DuplicateDocument } from '../DuplicateDocument/index.js'
import { Gutter } from '../Gutter/index.js'
import { Locked } from '../Locked/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { PreviewButton } from '../PreviewButton/index.js'
import { PublishButton } from '../PublishButton/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { SaveButton } from '../SaveButton/index.js'
import { SaveDraftButton } from '../SaveDraftButton/index.js'
import { Status } from '../Status/index.js'
import './index.scss'

const baseClass = 'doc-controls'

export const DocumentControls: React.FC<{
  readonly apiURL: string
  readonly customComponents?: {
    readonly PreviewButton?: React.ReactNode
    readonly PublishButton?: React.ReactNode
    readonly SaveButton?: React.ReactNode
    readonly SaveDraftButton?: React.ReactNode
  }
  readonly data?: any
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id?: number | string
  readonly isAccountView?: boolean
  readonly isEditing?: boolean
  readonly onDelete?: DocumentDrawerContextType['onDelete']
  readonly onDrawerCreateNew?: () => void
  /* Only available if `redirectAfterDuplicate` is `false` */
  readonly onDuplicate?: DocumentDrawerContextType['onDuplicate']
  readonly onSave?: DocumentDrawerContextType['onSave']
  readonly onTakeOver?: () => void
  readonly permissions: null | SanitizedCollectionPermission | SanitizedGlobalPermission
  readonly readOnlyForIncomingUser?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly slug: SanitizedCollectionConfig['slug']
  readonly user?: ClientUser
}> = (props) => {
  const {
    id,
    slug,
    customComponents: {
      PreviewButton: CustomPreviewButton,
      PublishButton: CustomPublishButton,
      SaveButton: CustomSaveButton,
      SaveDraftButton: CustomSaveDraftButton,
    } = {},
    data,
    disableActions,
    disableCreate,
    hasSavePermission,
    isAccountView,
    isEditing,
    onDelete,
    onDrawerCreateNew,
    onDuplicate,
    onTakeOver,
    permissions,
    readOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    user,
  } = props

  const { i18n, t } = useTranslation()

  const editDepth = useEditDepth()

  const { config, getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const globalConfig = getEntityConfig({ globalSlug: slug })

  const {
    admin: { dateFormat },
    localization,
    routes: { admin: adminRoute },
  } = config

  // Settings these in state to avoid hydration issues if there is a mismatch between the server and client
  const [updatedAt, setUpdatedAt] = React.useState<string>('')
  const [createdAt, setCreatedAt] = React.useState<string>('')

  const processing = useFormProcessing()
  const initializing = useFormInitializing()

  useEffect(() => {
    if (data?.updatedAt) {
      setUpdatedAt(formatDate({ date: data.updatedAt, i18n, pattern: dateFormat }))
    }
    if (data?.createdAt) {
      setCreatedAt(formatDate({ date: data.createdAt, i18n, pattern: dateFormat }))
    }
  }, [data, i18n, dateFormat])

  const hasCreatePermission = permissions && 'create' in permissions && permissions.create

  const hasDeletePermission = permissions && 'delete' in permissions && permissions.delete

  const showDotMenu = Boolean(
    collectionConfig && id && !disableActions && (hasCreatePermission || hasDeletePermission),
  )

  const unsavedDraftWithValidations =
    !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate

  const autosaveEnabled =
    (collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
    (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)

  const showCopyToLocale = localization && !collectionConfig?.admin?.disableCopyToLocale

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <ul className={`${baseClass}__meta`}>
            {collectionConfig && !isEditing && !isAccountView && (
              <li className={`${baseClass}__list-item`}>
                <p className={`${baseClass}__value`}>
                  {i18n.t('general:creatingNewLabel', {
                    label: getTranslation(
                      collectionConfig?.labels?.singular ?? i18n.t('general:document'),
                      i18n,
                    ),
                  })}
                </p>
              </li>
            )}
            {user && readOnlyForIncomingUser && (
              <Locked className={`${baseClass}__locked-controls`} user={user} />
            )}
            {(collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) && (
              <Fragment>
                {(globalConfig || (collectionConfig && isEditing)) && (
                  <li
                    className={[`${baseClass}__status`, `${baseClass}__list-item`]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Status />
                  </li>
                )}
                {hasSavePermission && autosaveEnabled && !unsavedDraftWithValidations && (
                  <li className={`${baseClass}__list-item`}>
                    <Autosave
                      collection={collectionConfig}
                      global={globalConfig}
                      id={id}
                      publishedDocUpdatedAt={data?.createdAt}
                    />
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
                  title={data?.updatedAt ? updatedAt : ''}
                >
                  <p className={`${baseClass}__label`}>{i18n.t('general:lastModified')}:&nbsp;</p>
                  {data?.updatedAt && <p className={`${baseClass}__value`}>{updatedAt}</p>}
                </li>
                <li
                  className={[`${baseClass}__list-item`, `${baseClass}__value-wrap`]
                    .filter(Boolean)
                    .join(' ')}
                  title={data?.createdAt ? createdAt : ''}
                >
                  <p className={`${baseClass}__label`}>{i18n.t('general:created')}:&nbsp;</p>
                  {data?.createdAt && <p className={`${baseClass}__value`}>{createdAt}</p>}
                </li>
              </Fragment>
            )}
          </ul>
        </div>
        <div className={`${baseClass}__controls-wrapper`}>
          <div className={`${baseClass}__controls`}>
            {(collectionConfig?.admin.preview || globalConfig?.admin.preview) && (
              <RenderCustomComponent
                CustomComponent={CustomPreviewButton}
                Fallback={<PreviewButton />}
              />
            )}
            {hasSavePermission && (
              <Fragment>
                {collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts ? (
                  <Fragment>
                    {(unsavedDraftWithValidations || !autosaveEnabled) && (
                      <RenderCustomComponent
                        CustomComponent={CustomSaveDraftButton}
                        Fallback={<SaveDraftButton />}
                      />
                    )}
                    <RenderCustomComponent
                      CustomComponent={CustomPublishButton}
                      Fallback={<PublishButton />}
                    />
                  </Fragment>
                ) : (
                  <RenderCustomComponent
                    CustomComponent={CustomSaveButton}
                    Fallback={<SaveButton />}
                  />
                )}
              </Fragment>
            )}
            {user && readOnlyForIncomingUser && (
              <Button
                buttonStyle="secondary"
                id="take-over"
                onClick={onTakeOver}
                size="medium"
                type="button"
              >
                {t('general:takeOver')}
              </Button>
            )}
          </div>
          {showDotMenu && !readOnlyForIncomingUser && (
            <Popup
              button={
                <div className={`${baseClass}__dots`}>
                  <div />
                  <div />
                  <div />
                </div>
              }
              className={`${baseClass}__popup`}
              disabled={initializing || processing}
              horizontalAlign="right"
              size="large"
              verticalAlign="bottom"
            >
              <PopupList.ButtonGroup>
                {showCopyToLocale && <CopyLocaleData />}
                {hasCreatePermission && (
                  <React.Fragment>
                    {!disableCreate && (
                      <Fragment>
                        {editDepth > 1 ? (
                          <PopupList.Button id="action-create" onClick={onDrawerCreateNew}>
                            {i18n.t('general:createNew')}
                          </PopupList.Button>
                        ) : (
                          <PopupList.Button
                            href={formatAdminURL({
                              adminRoute,
                              path: `/collections/${collectionConfig?.slug}/create`,
                            })}
                            id="action-create"
                          >
                            {i18n.t('general:createNew')}
                          </PopupList.Button>
                        )}
                      </Fragment>
                    )}
                    {collectionConfig.disableDuplicate !== true && isEditing && (
                      <DuplicateDocument
                        id={id.toString()}
                        onDuplicate={onDuplicate}
                        redirectAfterDuplicate={redirectAfterDuplicate}
                        singularLabel={collectionConfig?.labels?.singular}
                        slug={collectionConfig?.slug}
                      />
                    )}
                  </React.Fragment>
                )}
                {hasDeletePermission && (
                  <DeleteDocument
                    buttonId="action-delete"
                    collectionSlug={collectionConfig?.slug}
                    id={id.toString()}
                    onDelete={onDelete}
                    redirectAfterDelete={redirectAfterDelete}
                    singularLabel={collectionConfig?.labels?.singular}
                    useAsTitle={collectionConfig?.admin?.useAsTitle}
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
