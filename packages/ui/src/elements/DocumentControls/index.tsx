'use client'
import type {
  ClientUser,
  Data,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'
import React, { Fragment, useEffect } from 'react'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLivePreviewContext } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js'
import { Autosave } from '../Autosave/index.js'
import { Button } from '../Button/index.js'
import { CopyLocaleData } from '../CopyLocaleData/index.js'
import { DeleteDocument } from '../DeleteDocument/index.js'
import { DuplicateDocument } from '../DuplicateDocument/index.js'
import { Gutter } from '../Gutter/index.js'
import { LivePreviewToggler } from '../LivePreview/Toggler/index.js'
import { Locked } from '../Locked/index.js'
import { PermanentlyDeleteButton } from '../PermanentlyDeleteButton/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { PreviewButton } from '../PreviewButton/index.js'
import { PublishButton } from '../PublishButton/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { RestoreButton } from '../RestoreButton/index.js'
import { SaveButton } from '../SaveButton/index.js'
import { SaveDraftButton } from '../SaveDraftButton/index.js'
import { Status } from '../Status/index.js'
import { UnpublishButton } from '../UnpublishButton/index.js'
import './index.scss'

const baseClass = 'doc-controls'

export const DocumentControls: React.FC<{
  readonly apiURL: string
  readonly BeforeDocumentControls?: React.ReactNode
  readonly BeforeDocumentMeta?: React.ReactNode
  readonly customComponents?: {
    readonly PreviewButton?: React.ReactNode
    readonly PublishButton?: React.ReactNode
    readonly SaveButton?: React.ReactNode
    readonly SaveDraftButton?: React.ReactNode
    readonly Status?: React.ReactNode
    readonly UnpublishButton?: React.ReactNode
  }
  readonly data?: Data
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly EditMenuItems?: React.ReactNode
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id?: number | string
  readonly isAccountView?: boolean
  readonly isEditing?: boolean
  readonly isInDrawer?: boolean
  readonly isTrashed?: boolean
  readonly onDelete?: DocumentDrawerContextType['onDelete']
  readonly onDrawerCreateNew?: () => void
  /* Only available if `redirectAfterDuplicate` is `false` */
  readonly onDuplicate?: DocumentDrawerContextType['onDuplicate']
  readonly onRestore?: DocumentDrawerContextType['onRestore']
  readonly onSave?: DocumentDrawerContextType['onSave']
  readonly onTakeOver?: () => void
  readonly permissions: null | SanitizedCollectionPermission | SanitizedGlobalPermission
  readonly readOnlyForIncomingUser?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly redirectAfterRestore?: boolean
  readonly slug: SanitizedCollectionConfig['slug']
  readonly user?: ClientUser
}> = (props) => {
  const {
    id,
    slug,
    BeforeDocumentControls,
    BeforeDocumentMeta,
    customComponents: {
      PreviewButton: CustomPreviewButton,
      PublishButton: CustomPublishButton,
      SaveButton: CustomSaveButton,
      SaveDraftButton: CustomSaveDraftButton,
      Status: CustomStatus,
      UnpublishButton: CustomUnpublishButton,
    } = {},
    data,
    disableActions,
    disableCreate,
    EditMenuItems,
    hasSavePermission,
    isAccountView,
    isEditing,
    isInDrawer,
    isTrashed,
    onDelete,
    onDrawerCreateNew,
    onDuplicate,
    onRestore,
    onTakeOver,
    permissions,
    readOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    user,
  } = props

  const { i18n, t } = useTranslation()

  const editDepth = useEditDepth()

  const { config, getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const globalConfig = getEntityConfig({ globalSlug: slug })

  const { isLivePreviewEnabled } = useLivePreviewContext()

  const { hasDeletePermission: docHasDeletePermission, hasTrashPermission: docHasTrashPermission } =
    useDocumentInfo()

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

  const collectionDeletePermission = permissions && 'delete' in permissions && permissions.delete

  const hasDeletePermission = collectionConfig?.trash
    ? docHasTrashPermission || docHasDeletePermission
    : collectionDeletePermission

  const showDotMenu = Boolean(
    collectionConfig && id && !disableActions && (hasCreatePermission || hasDeletePermission),
  )

  const unsavedDraftWithValidations =
    !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate

  const globalHasDraftsEnabled = hasDraftsEnabled(globalConfig)
  const collectionHasDraftsEnabled = hasDraftsEnabled(collectionConfig)
  const collectionAutosaveEnabled = hasAutosaveEnabled(collectionConfig)
  const globalAutosaveEnabled = hasAutosaveEnabled(globalConfig)
  const autosaveEnabled = collectionAutosaveEnabled || globalAutosaveEnabled

  const showSaveDraftButton =
    (collectionAutosaveEnabled &&
      collectionConfig.versions.drafts.autosave !== false &&
      collectionConfig.versions.drafts.autosave.showSaveDraftButton === true) ||
    (globalAutosaveEnabled &&
      globalConfig.versions.drafts.autosave !== false &&
      globalConfig.versions.drafts.autosave.showSaveDraftButton === true)
  const showCopyToLocale = localization && !collectionConfig?.admin?.disableCopyToLocale

  const showLockedMetaIcon = user && readOnlyForIncomingUser

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          {Boolean(showLockedMetaIcon || BeforeDocumentMeta) && (
            <div className={`${baseClass}__before-meta`}>
              {showLockedMetaIcon && (
                <Locked className={`${baseClass}__locked-controls`} user={user} />
              )}
              {BeforeDocumentMeta}
            </div>
          )}
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
            {(collectionHasDraftsEnabled || globalHasDraftsEnabled) && (
              <Fragment>
                {(globalConfig || (collectionConfig && isEditing)) && (
                  <li
                    className={[`${baseClass}__status`, `${baseClass}__list-item`]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <RenderCustomComponent CustomComponent={CustomStatus} Fallback={<Status />} />
                  </li>
                )}
                {hasSavePermission &&
                  autosaveEnabled &&
                  !unsavedDraftWithValidations &&
                  !isTrashed && (
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
                  <p className={`${baseClass}__label`}>
                    {i18n.t(isTrashed ? 'general:deleted' : 'general:lastModified')}:&nbsp;
                  </p>

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
            {BeforeDocumentControls}
            {isLivePreviewEnabled && !isInDrawer && <LivePreviewToggler />}
            {(collectionConfig?.admin.preview || globalConfig?.admin.preview) && (
              <RenderCustomComponent
                CustomComponent={CustomPreviewButton}
                Fallback={<PreviewButton />}
              />
            )}
            {hasSavePermission && !isTrashed && (
              <Fragment>
                {collectionHasDraftsEnabled || globalHasDraftsEnabled ? (
                  <Fragment>
                    {(unsavedDraftWithValidations ||
                      !autosaveEnabled ||
                      (autosaveEnabled && showSaveDraftButton)) && (
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
            {docHasDeletePermission && isTrashed && (
              <PermanentlyDeleteButton
                buttonId="action-permanently-delete"
                collectionSlug={collectionConfig?.slug}
                id={id.toString()}
                onDelete={onDelete}
                redirectAfterDelete={redirectAfterDelete}
                singularLabel={collectionConfig?.labels?.singular}
              />
            )}
            {hasSavePermission && isTrashed && (
              <RestoreButton
                buttonId="action-restore"
                collectionSlug={collectionConfig?.slug}
                id={id.toString()}
                onRestore={onRestore}
                redirectAfterRestore={redirectAfterRestore}
                singularLabel={collectionConfig?.labels?.singular}
              />
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
                      <>
                        <DuplicateDocument
                          id={id}
                          onDuplicate={onDuplicate}
                          redirectAfterDuplicate={redirectAfterDuplicate}
                          singularLabel={collectionConfig?.labels?.singular}
                          slug={collectionConfig?.slug}
                        />
                        {localization && (
                          <DuplicateDocument
                            id={id}
                            onDuplicate={onDuplicate}
                            redirectAfterDuplicate={redirectAfterDuplicate}
                            selectLocales={true}
                            singularLabel={collectionConfig?.labels?.singular}
                            slug={collectionConfig?.slug}
                          />
                        )}
                      </>
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
                <RenderCustomComponent
                  CustomComponent={CustomUnpublishButton}
                  Fallback={<UnpublishButton />}
                />
                {EditMenuItems}
              </PopupList.ButtonGroup>
            </Popup>
          )}
        </div>
      </div>
      <div className={`${baseClass}__divider`} />
    </Gutter>
  )
}
