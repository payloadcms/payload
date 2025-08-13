/* eslint-disable react-compiler/react-compiler -- TODO: fix */
'use client'

import type { ClientUser, DocumentViewClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FormProps } from '../../forms/Form/index.js'
import type { LockedState } from '../../utilities/buildFormState.js'

import { DocumentControls } from '../../elements/DocumentControls/index.js'
import { DocumentDrawerHeader } from '../../elements/DocumentDrawer/DrawerHeader/index.js'
import { useDocumentDrawerContext } from '../../elements/DocumentDrawer/Provider.js'
import { DocumentFields } from '../../elements/DocumentFields/index.js'
import { DocumentLocked } from '../../elements/DocumentLocked/index.js'
import { DocumentTakeOver } from '../../elements/DocumentTakeOver/index.js'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving/index.js'
import { LivePreviewWindow } from '../../elements/LivePreview/Window/index.js'
import { Upload } from '../../elements/Upload/index.js'
import { Form } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLivePreviewContext } from '../../providers/LivePreview/context.js'
import { OperationProvider } from '../../providers/Operation/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { UploadControlsProvider } from '../../providers/UploadControls/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { handleBackToDashboard } from '../../utilities/handleBackToDashboard.js'
import { handleGoBack } from '../../utilities/handleGoBack.js'
import { handleTakeOver } from '../../utilities/handleTakeOver.js'
import { Auth } from './Auth/index.js'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export function DefaultEditView({
  BeforeDocumentControls,
  Description,
  EditMenuItems,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
  Upload: CustomUpload,
  UploadControls,
}: DocumentViewClientProps) {
  const {
    id,
    action,
    AfterDocument,
    AfterFields,
    apiURL,
    BeforeFields,
    collectionSlug,
    currentEditor,
    data,
    disableActions,
    disableCreate,
    disableLeaveWithoutSaving,
    docPermissions,
    documentIsLocked,
    documentLockState,
    getDocPermissions,
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialState,
    isEditing,
    isInitializing,
    isTrashed,
    lastUpdateTime,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    setCurrentEditor,
    setData,
    setDocumentIsLocked,
    setLastUpdateTime,
    unlockDocument,
    updateDocumentEditor,
  } = useDocumentInfo()

  const {
    clearDoc,
    drawerSlug,
    onDelete,
    onDuplicate,
    onRestore,
    onSave: onSaveFromContext,
  } = useDocumentDrawerContext()

  const isInDrawer = Boolean(drawerSlug)

  const { refreshCookieAsync, user } = useAuth()

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const depth = useEditDepth()

  const router = useRouter()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()
  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { isLivePreviewEnabled, isLivePreviewing, previewWindowType } = useLivePreviewContext()

  const abortOnChangeRef = useRef<AbortController>(null)
  const abortOnSaveRef = useRef<AbortController>(null)

  const locale = params.get('locale')

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const docConfig = collectionConfig || globalConfig

  const lockDocumentsProp = docConfig?.lockDocuments !== undefined ? docConfig?.lockDocuments : true
  const isLockingEnabled = lockDocumentsProp !== false

  const lockDurationDefault = 300 // Default 5 minutes in seconds
  const lockDuration =
    typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
  const lockDurationInMilliseconds = lockDuration * 1000

  const autosaveEnabled = Boolean(
    (collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave),
  )

  const preventLeaveWithoutSaving =
    typeof disableLeaveWithoutSaving !== 'undefined' ? !disableLeaveWithoutSaving : !autosaveEnabled

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)

  const [editSessionStartTime, setEditSessionStartTime] = useState(Date.now())

  const lockExpiryTime = lastUpdateTime + lockDurationInMilliseconds

  const isLockExpired = Date.now() > lockExpiryTime

  const schemaPathSegments = useMemo(() => [entitySlug], [entitySlug])

  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return true
    }

    return false
  })

  const nextHrefRef = React.useRef<null | string>(null)

  const handleDocumentLocking = useCallback(
    (lockedState: LockedState) => {
      setDocumentIsLocked(true)
      const previousOwnerID =
        typeof documentLockState.current?.user === 'object'
          ? documentLockState.current?.user?.id
          : documentLockState.current?.user

      if (lockedState) {
        const lockedUserID =
          typeof lockedState.user === 'string' || typeof lockedState.user === 'number'
            ? lockedState.user
            : lockedState.user.id

        if (!documentLockState.current || lockedUserID !== previousOwnerID) {
          if (previousOwnerID === user.id && lockedUserID !== user.id) {
            setShowTakeOverModal(true)
            documentLockState.current.hasShownLockedModal = true
          }

          documentLockState.current = {
            hasShownLockedModal: documentLockState.current?.hasShownLockedModal || false,
            isLocked: true,
            user: lockedState.user as ClientUser,
          }
          setCurrentEditor(lockedState.user as ClientUser)
        }
      }
    },
    [documentLockState, setCurrentEditor, setDocumentIsLocked, user?.id],
  )

  const handlePrevent = useCallback((nextHref: null | string) => {
    nextHrefRef.current = nextHref
  }, [])

  const handleLeaveConfirm = useCallback(async () => {
    const lockUser = documentLockState.current?.user

    const isLockOwnedByCurrentUser =
      typeof lockUser === 'object' ? lockUser?.id === user?.id : lockUser === user?.id

    if (isLockingEnabled && documentIsLocked && (id || globalSlug)) {
      // Check where user is trying to go
      const nextPath = nextHrefRef.current ? new URL(nextHrefRef.current).pathname : ''
      const isInternalView = ['/preview', '/api', '/versions'].some((path) =>
        nextPath.includes(path),
      )

      // Only retain the lock if the user is still viewing the document
      if (!isInternalView) {
        if (isLockOwnedByCurrentUser) {
          try {
            await unlockDocument(id, collectionSlug ?? globalSlug)
            setDocumentIsLocked(false)
            setCurrentEditor(null)
          } catch (err) {
            console.error('Failed to unlock before leave', err) // eslint-disable-line no-console
          }
        }
      }
    }
  }, [
    collectionSlug,
    documentIsLocked,
    documentLockState,
    globalSlug,
    id,
    isLockingEnabled,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    user?.id,
  ])

  const onSave = useCallback<FormProps['onSuccess']>(
    async (json, options) => {
      const { context } = options || {}

      const controller = handleAbortRef(abortOnSaveRef)

      // @ts-expect-error can ignore
      const document = json?.doc || json?.result

      const updatedAt = document?.updatedAt || new Date().toISOString()

      reportUpdate({
        id,
        entitySlug,
        updatedAt,
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      setLastUpdateTime(updatedAt)

      if (context?.incrementVersionCount !== false) {
        incrementVersionCount()
      }

      if (typeof setData === 'function') {
        void setData(document || {})
      }

      if (typeof onSaveFromContext === 'function') {
        const operation = id ? 'update' : 'create'

        void onSaveFromContext({
          ...(json as Record<string, unknown>),
          context,
          operation,
          // @ts-expect-error todo: this is not right, should be under `doc`?
          updatedAt:
            operation === 'update'
              ? new Date().toISOString()
              : document?.updatedAt || new Date().toISOString(),
        })
      }

      if (!isEditing && depth < 2 && redirectAfterCreate !== false) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${document?.id}${locale ? `?locale=${locale}` : ''}`,
        })

        startRouteTransition(() => router.push(redirectRoute))
      } else {
        resetUploadEdits()
      }

      await getDocPermissions(json)

      if (id || globalSlug) {
        const docPreferences = await getDocPreferences()

        const { state } = await getFormState({
          id,
          collectionSlug,
          data: document,
          docPermissions,
          docPreferences,
          globalSlug,
          operation,
          renderAllFields: true,
          returnLockStatus: false,
          schemaPath: schemaPathSegments.join('.'),
          signal: controller.signal,
          skipValidation: true,
        })

        // Unlock the document after save
        if (isLockingEnabled) {
          setDocumentIsLocked(false)
        }

        abortOnSaveRef.current = null

        return state
      }
    },
    [
      reportUpdate,
      id,
      entitySlug,
      user,
      collectionSlug,
      userSlug,
      setLastUpdateTime,
      setData,
      onSaveFromContext,
      isEditing,
      depth,
      redirectAfterCreate,
      getDocPermissions,
      globalSlug,
      refreshCookieAsync,
      incrementVersionCount,
      adminRoute,
      locale,
      startRouteTransition,
      router,
      resetUploadEdits,
      getDocPreferences,
      getFormState,
      docPermissions,
      operation,
      schemaPathSegments,
      isLockingEnabled,
      setDocumentIsLocked,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      const currentTime = Date.now()
      const timeSinceLastUpdate = currentTime - editSessionStartTime

      const updateLastEdited = isLockingEnabled && timeSinceLastUpdate >= 10000 // 10 seconds

      if (updateLastEdited) {
        setEditSessionStartTime(currentTime)
      }

      const docPreferences = await getDocPreferences()

      const result = await getFormState({
        id,
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        globalSlug,
        operation,
        renderAllFields: false,
        returnLockStatus: isLockingEnabled,
        schemaPath: schemaPathSegments.join('.'),
        signal: controller.signal,
        skipValidation: !submitted,
        updateLastEdited,
      })

      if (!result) {
        return
      }

      const { lockedState, state } = result

      if (isLockingEnabled) {
        handleDocumentLocking(lockedState)
      }

      abortOnChangeRef.current = null

      return state
    },
    [
      id,
      collectionSlug,
      getDocPreferences,
      getFormState,
      globalSlug,
      handleDocumentLocking,
      isLockingEnabled,
      operation,
      schemaPathSegments,
      docPermissions,
      editSessionStartTime,
    ],
  )

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      setShowTakeOverModal(false)
    }
  }, [])

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current
    const abortOnSave = abortOnSaveRef.current

    return () => {
      abortAndIgnore(abortOnChange)
      abortAndIgnore(abortOnSave)
    }
  }, [])

  const shouldShowDocumentLockedModal =
    documentIsLocked &&
    currentEditor &&
    (typeof currentEditor === 'object'
      ? currentEditor.id !== user?.id
      : currentEditor !== user?.id) &&
    !isReadOnlyForIncomingUser &&
    !showTakeOverModal &&
    !documentLockState.current?.hasShownLockedModal &&
    !isLockExpired

  const isFolderCollection = config.folders && collectionSlug === config.folders?.slug

  return (
    <main
      className={[
        baseClass,
        (id || globalSlug) && `${baseClass}--is-editing`,
        globalSlug && `global-edit--${globalSlug}`,
        collectionSlug && `collection-edit--${collectionSlug}`,
        isLivePreviewing && previewWindowType === 'iframe' && `${baseClass}--is-live-previewing`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={isReadOnlyForIncomingUser || isInitializing || !hasSavePermission || isTrashed}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isDocumentForm={true}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {isInDrawer && (
            <DocumentDrawerHeader drawerSlug={drawerSlug} showDocumentID={!isFolderCollection} />
          )}
          {isLockingEnabled && shouldShowDocumentLockedModal && (
            <DocumentLocked
              handleGoBack={() => handleGoBack({ adminRoute, collectionSlug, router })}
              isActive={shouldShowDocumentLockedModal}
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
              onTakeOver={() =>
                handleTakeOver(
                  id,
                  collectionSlug,
                  globalSlug,
                  user,
                  false,
                  updateDocumentEditor,
                  setCurrentEditor,
                  documentLockState,
                  isLockingEnabled,
                )
              }
              updatedAt={lastUpdateTime}
              user={currentEditor}
            />
          )}
          {isLockingEnabled && showTakeOverModal && (
            <DocumentTakeOver
              handleBackToDashboard={() => handleBackToDashboard({ adminRoute, router })}
              isActive={showTakeOverModal}
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
            />
          )}
          {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && (
            <LeaveWithoutSaving onConfirm={handleLeaveConfirm} onPrevent={handlePrevent} />
          )}
          {!isInDrawer && (
            <SetDocumentStepNav
              collectionSlug={collectionConfig?.slug}
              globalSlug={globalConfig?.slug}
              id={id}
              isTrashed={isTrashed}
              pluralLabel={collectionConfig?.labels?.plural}
              useAsTitle={collectionConfig?.admin?.useAsTitle}
            />
          )}
          <SetDocumentTitle
            collectionConfig={collectionConfig}
            config={config}
            fallback={depth <= 1 ? id?.toString() : undefined}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            BeforeDocumentControls={BeforeDocumentControls}
            customComponents={{
              PreviewButton,
              PublishButton,
              SaveButton,
              SaveDraftButton,
            }}
            data={data}
            disableActions={disableActions || isFolderCollection || isTrashed}
            disableCreate={disableCreate}
            EditMenuItems={EditMenuItems}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            isInDrawer={isInDrawer}
            isTrashed={isTrashed}
            onDelete={onDelete}
            onDrawerCreateNew={clearDoc}
            onDuplicate={onDuplicate}
            onRestore={onRestore}
            onSave={onSave}
            onTakeOver={() =>
              handleTakeOver(
                id,
                collectionSlug,
                globalSlug,
                user,
                true,
                updateDocumentEditor,
                setCurrentEditor,
                documentLockState,
                isLockingEnabled,
                setIsReadOnlyForIncomingUser,
              )
            }
            permissions={docPermissions}
            readOnlyForIncomingUser={isReadOnlyForIncomingUser}
            redirectAfterDelete={redirectAfterDelete}
            redirectAfterDuplicate={redirectAfterDuplicate}
            redirectAfterRestore={redirectAfterRestore}
            slug={collectionConfig?.slug || globalConfig?.slug}
            user={currentEditor}
          />
          <div
            className={[
              `${baseClass}__main-wrapper`,
              previewWindowType === 'popup' && `${baseClass}--detached`,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={[
                `${baseClass}__main`,
                previewWindowType === 'popup' && `${baseClass}__main--popup-open`,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <DocumentFields
                AfterFields={AfterFields}
                BeforeFields={
                  BeforeFields || (
                    <Fragment>
                      {auth && (
                        <Auth
                          className={`${baseClass}__auth`}
                          collectionSlug={collectionConfig.slug}
                          disableLocalStrategy={collectionConfig.auth?.disableLocalStrategy}
                          email={data?.email}
                          loginWithUsername={auth?.loginWithUsername}
                          operation={operation}
                          readOnly={!hasSavePermission}
                          requirePassword={!id}
                          setValidateBeforeSubmit={setValidateBeforeSubmit}
                          useAPIKey={auth.useAPIKey}
                          username={data?.username}
                          verify={auth.verify}
                        />
                      )}
                      {upload && (
                        <React.Fragment>
                          <UploadControlsProvider>
                            {CustomUpload || (
                              <Upload
                                collectionSlug={collectionConfig.slug}
                                initialState={initialState}
                                uploadConfig={upload}
                                UploadControls={UploadControls}
                              />
                            )}
                          </UploadControlsProvider>
                        </React.Fragment>
                      )}
                    </Fragment>
                  )
                }
                Description={Description}
                docPermissions={docPermissions}
                fields={docConfig.fields}
                forceSidebarWrap={isLivePreviewing}
                isTrashed={isTrashed}
                readOnly={isReadOnlyForIncomingUser || !hasSavePermission || isTrashed}
                schemaPathSegments={schemaPathSegments}
              />
              {AfterDocument}
            </div>
            {isLivePreviewEnabled && !isInDrawer && (
              <LivePreviewWindow collectionSlug={collectionSlug} globalSlug={globalSlug} />
            )}
          </div>
        </Form>
      </OperationProvider>
    </main>
  )
}
