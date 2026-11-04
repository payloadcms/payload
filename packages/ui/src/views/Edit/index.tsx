'use client'

import type { DocumentViewClientProps, User } from 'payload'

import { formatAdminURL, hasAutosaveEnabled } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { FormOnSuccess, FormStateRequest } from '../../forms/Form/types.js'
import type { LockedState } from '../../utilities/buildFormState.js'

import { DocumentControls } from '../../elements/DocumentControls/index.js'
import { DocumentDrawerHeader } from '../../elements/DocumentDrawer/DrawerHeader/index.js'
import { useDocumentDrawerContext } from '../../elements/DocumentDrawer/Provider.js'
import { DocumentFields } from '../../elements/DocumentFields/index.js'
import { DocumentLocked } from '../../elements/DocumentLocked/index.js'
import { DocumentStaleData } from '../../elements/DocumentStaleData/index.js'
import { DocumentTakeOver } from '../../elements/DocumentTakeOver/index.js'
import { FileManager } from '../../elements/FileManager/index.js'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving/index.js'
import { LivePreviewWindow } from '../../elements/LivePreview/Window/index.js'
import { Form } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLivePreviewContext, usePreviewURL } from '../../providers/LivePreview/context.js'
import { OperationProvider } from '../../providers/Operation/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouter, useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { UploadControlsProvider } from '../../providers/UploadControls/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { handleBackToDashboard } from '../../utilities/handleBackToDashboard.js'
import { handleGoBack } from '../../utilities/handleGoBack.js'
import { handleTakeOver } from '../../utilities/handleTakeOver.js'
import { Auth } from './Auth/index.js'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'
import './index.css'

const baseClass = 'collection-edit'
const PENDING_SUCCESS_TOAST_KEY = 'payload-pending-success-toast'

export type OnSaveContext = {
  getDocPermissions?: boolean
  incrementVersionCount?: boolean
}

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export function DefaultEditView({
  BeforeDocumentControls,
  BeforeDocumentMeta,
  Description,
  EditMenuItems,
  LivePreview: CustomLivePreview,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
  Status,
  UnpublishButton,
  Upload: CustomUpload,
  UploadControls,
  UploadFilePreview,
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
    documentLockState: documentLockStateRef,
    getDocPermissions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialState,
    isEditing,
    isInitializing,
    isLocked,
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
      serverURL,
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
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()
  const {
    isLivePreviewEnabled,
    isLivePreviewing,
    isPopupOpen,
    setURL: setLivePreviewURL,
    typeofLivePreviewURL,
    url: livePreviewURL,
  } = useLivePreviewContext()
  const { isPreviewEnabled, setPreviewURL } = usePreviewURL()

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

  const autosaveEnabled = hasAutosaveEnabled(docConfig)

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)
  const [showStaleDataModal, setShowStaleDataModal] = useState(false)

  const [editSessionStartTime, setEditSessionStartTime] = useState(() => Date.now())

  const hasCheckedForStaleDataRef = useRef(false)
  const originalUpdatedAtRef = useRef(data?.updatedAt)

  const lockExpiryTime = lastUpdateTime + lockDurationInMilliseconds
  // Render can't read the current time, so check for expiry when the lock changes and expires
  const [isLockExpired, setIsLockExpired] = useState(() => Date.now() > lockExpiryTime)

  useEffect(() => {
    const msUntilExpiry = lockExpiryTime - Date.now()
    setIsLockExpired(msUntilExpiry < 0)

    // Start a timer that marks the lock as expired at the moment it expires, which
    // hides the "document locked" modal
    if (msUntilExpiry >= 0 && msUntilExpiry <= 2_147_483_647) {
      const timeout = setTimeout(() => setIsLockExpired(true), msUntilExpiry)
      return () => clearTimeout(timeout)
    }
  }, [lockExpiryTime])

  const preventLeaveWithoutSaving =
    !isReadOnlyForIncomingUser &&
    (typeof disableLeaveWithoutSaving !== 'undefined'
      ? !disableLeaveWithoutSaving
      : !autosaveEnabled)

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
        typeof documentLockStateRef.current?.user === 'object'
          ? documentLockStateRef.current?.user?.id
          : documentLockStateRef.current?.user

      if (lockedState && lockedState.user) {
        const lockedUserID =
          typeof lockedState.user === 'string' || typeof lockedState.user === 'number'
            ? lockedState.user
            : lockedState.user.id

        if (!documentLockStateRef.current || lockedUserID !== previousOwnerID) {
          if (previousOwnerID === user.id && lockedUserID !== user.id) {
            setShowTakeOverModal(true)
            documentLockStateRef.current.hasShownLockedModal = true
          }

          documentLockStateRef.current = {
            hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal || false,
            isLocked: true,
            user: lockedState.user,
          }
          setCurrentEditor(lockedState.user as User)
        }

        // Update lastUpdateTime when lock state changes
        if (lockedState.lastEditedAt) {
          setLastUpdateTime(new Date(lockedState.lastEditedAt).getTime())
        }
      }
    },
    [documentLockStateRef, setCurrentEditor, setDocumentIsLocked, setLastUpdateTime, user?.id],
  )

  const handleStaleDataReload = useCallback(() => {
    // Reset modal state so it can appear again if needed
    setShowStaleDataModal(false)

    // Refresh to get the latest data
    router.refresh()
  }, [router])

  const handlePrevent = useCallback((nextHref: null | string) => {
    nextHrefRef.current = nextHref
  }, [])

  const handleLeaveConfirm = useCallback(async () => {
    const lockUser = documentLockStateRef.current?.user

    const isLockOwnedByCurrentUser =
      typeof lockUser === 'object' ? lockUser?.id === user?.id : lockUser === user?.id

    if (isLockingEnabled && documentIsLocked && (id || globalSlug)) {
      // Check where user is trying to go
      const nextPath = nextHrefRef.current ? new URL(nextHrefRef.current).pathname : ''
      const isInternalView = ['/preview', '/api', '/versions'].some((path) =>
        nextPath.includes(path),
      )

      // Remove the lock if the user is navigating away from the document view they have locked
      if (isLockOwnedByCurrentUser && !isInternalView) {
        try {
          await unlockDocument(id, collectionSlug ?? globalSlug)
          setDocumentIsLocked(false)
          setCurrentEditor(null)
        } catch (err) {
          console.error('Failed to unlock before leave', err) // eslint-disable-line no-console
        }
      }
    }
  }, [
    collectionSlug,
    documentIsLocked,
    documentLockStateRef,
    globalSlug,
    id,
    isLockingEnabled,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    user?.id,
  ])

  const onSave: FormOnSuccess<any, OnSaveContext> = useCallback(
    async (json, ctx) => {
      const { context } = ctx || {}

      const document = json?.doc || json?.result

      const updatedAt = document?.updatedAt || new Date().toISOString()

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      setLastUpdateTime(new Date(updatedAt).getTime())

      // Update stale data check refs after successful save
      // This allows detecting if another user modifies the document after this save
      originalUpdatedAtRef.current = updatedAt
      hasCheckedForStaleDataRef.current = false

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
        // Store success message to show after redirect
        if (json.message && typeof window !== 'undefined') {
          window.sessionStorage.setItem(PENDING_SUCCESS_TOAST_KEY, json.message)
        }

        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${document?.id}${locale ? `?locale=${locale}` : ''}`,
        })

        void startRouteTransition(() => router.push(redirectRoute))
      } else {
        resetUploadEdits()
      }

      if (context?.getDocPermissions !== false) {
        await getDocPermissions(json)
      }

      if (id || globalSlug) {
        // Unlock the document after save
        if (isLockingEnabled) {
          setDocumentIsLocked(false)
        }

        reportUpdate({
          id,
          doc: document,
          drawerSlug,
          entitySlug,
          operation: 'update',
          updatedAt,
        })
      } else {
        reportUpdate({
          id,
          doc: document,
          drawerSlug,
          entitySlug,
          operation: 'create',
          updatedAt,
        })
      }
    },
    [
      user,
      collectionSlug,
      userSlug,
      id,
      setLastUpdateTime,
      setData,
      onSaveFromContext,
      isEditing,
      depth,
      redirectAfterCreate,
      globalSlug,
      refreshCookieAsync,
      incrementVersionCount,
      adminRoute,
      locale,
      startRouteTransition,
      router,
      resetUploadEdits,
      getDocPermissions,
      isLockingEnabled,
      reportUpdate,
      drawerSlug,
      entitySlug,
      setDocumentIsLocked,
    ],
  )

  const formStateRequest = useMemo<FormStateRequest>(
    () => ({
      args: ({ savedDocument }) => {
        const isAfterSave = Boolean(savedDocument)

        // Sync originalUpdatedAt with current data if it's NEWER (e.g., after router.refresh())
        if (data?.updatedAt && data.updatedAt > originalUpdatedAtRef.current) {
          originalUpdatedAtRef.current = data.updatedAt
          // Reset check flag so we can detect new stale data
          hasCheckedForStaleDataRef.current = false
        }

        const currentTime = Date.now()
        const timeSinceLastUpdate = currentTime - editSessionStartTime

        const updateLastEdited = isLockingEnabled && !isAfterSave && timeSinceLastUpdate >= 10000 // 10 seconds

        if (updateLastEdited) {
          setEditSessionStartTime(currentTime)
        }

        // Check for stale data on first edit only
        // Skip this check entirely for autosave-enabled collections/globals to prevent
        // false positives from the user's own autosaves
        const checkForStaleData =
          !isAfterSave &&
          !hasCheckedForStaleDataRef.current &&
          originalUpdatedAtRef.current &&
          operation === 'update' &&
          !isTrashed &&
          !autosaveEnabled

        if (checkForStaleData) {
          hasCheckedForStaleDataRef.current = true
        }

        return {
          checkForStaleData,
          operation,
          originalUpdatedAt: checkForStaleData ? originalUpdatedAtRef.current : undefined,
          readOnly: isTrashed || isReadOnlyForIncomingUser,
          returnLivePreviewURL:
            isAfterSave && isLivePreviewEnabled && typeofLivePreviewURL === 'function',
          returnLockStatus: isLockingEnabled && !isAfterSave,
          returnPreviewURL: isAfterSave && isPreviewEnabled,
          schemaPath: schemaPathSegments.join('.'),
          updateLastEdited,
        }
      },
      onResponse: (
        { livePreviewURL, lockedState, previewURL, staleDataState, state },
        { overlappedSubmit, savedDocument },
      ) => {
        if (savedDocument) {
          // Clear the file field so the uploaded File object doesn't persist in form state after save
          if (upload) {
            delete state.file
          }

          if (isLivePreviewEnabled && typeofLivePreviewURL === 'function') {
            setLivePreviewURL(livePreviewURL)
          }

          if (isPreviewEnabled) {
            setPreviewURL(previewURL)
          }

          return
        }

        if (isLockingEnabled) {
          handleDocumentLocking(lockedState)
        }

        // A save that overlapped this request makes the newer updatedAt our OWN, not stale data.
        if (staleDataState?.isStale && !overlappedSubmit) {
          setShowStaleDataModal(true)
        }
      },
    }),
    [
      data?.updatedAt,
      editSessionStartTime,
      isLockingEnabled,
      operation,
      schemaPathSegments,
      handleDocumentLocking,
      autosaveEnabled,
      isTrashed,
      isReadOnlyForIncomingUser,
      isLivePreviewEnabled,
      typeofLivePreviewURL,
      isPreviewEnabled,
      upload,
      setLivePreviewURL,
      setPreviewURL,
    ],
  )

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      setShowTakeOverModal(false)
    }
  }, [])

  // Show pending success toast after redirect from create
  useEffect(() => {
    if (!isInitializing && typeof window !== 'undefined') {
      const pendingMessage = window.sessionStorage.getItem(PENDING_SUCCESS_TOAST_KEY)

      if (pendingMessage) {
        window.sessionStorage.removeItem(PENDING_SUCCESS_TOAST_KEY)
        toast.success(pendingMessage)
      }
    }
  }, [isInitializing])

  const shouldShowDocumentLockedModal =
    documentIsLocked &&
    currentEditor &&
    (typeof currentEditor === 'object'
      ? currentEditor.id !== user?.id
      : currentEditor !== user?.id) &&
    !isReadOnlyForIncomingUser &&
    !showTakeOverModal &&
    !documentLockStateRef.current?.hasShownLockedModal &&
    !isLockExpired

  const isFolderCollection = Boolean(
    collectionConfig?.hierarchy &&
    typeof collectionConfig.hierarchy === 'object' &&
    collectionConfig.hierarchy.allowHasMany === false,
  )

  const documentControlsProps: Omit<React.ComponentProps<typeof DocumentControls>, 'variant'> = {
    id,
    slug: collectionConfig?.slug || globalConfig?.slug,
    apiURL,
    BeforeDocumentControls,
    BeforeDocumentMeta,
    customComponents: {
      PreviewButton,
      PublishButton,
      SaveButton,
      SaveDraftButton,
      Status,
      UnpublishButton,
    },
    data,
    disableActions: disableActions || isTrashed,
    disableCreate,
    EditMenuItems,
    hasPublishPermission,
    hasSavePermission,
    isEditing,
    isInDrawer,
    isTrashed,
    onDelete,
    onDrawerCreateNew: clearDoc,
    onDuplicate,
    onRestore,
    onSave,
    onTakeOver: () => {
      void handleTakeOver({
        id,
        clearRouteCache,
        collectionSlug,
        documentLockStateRef,
        globalSlug,
        isLockingEnabled,
        isWithinDoc: true,
        setCurrentEditor,
        setIsReadOnlyForIncomingUser,
        updateDocumentEditor,
        user,
      })
    },
    permissions: docPermissions,
    readOnlyForIncomingUser: isReadOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    user: currentEditor,
  }

  const renderAuth = auth ? (
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
      // eslint-disable-next-line react-hooks/hooks
      useAPIKey={auth.useAPIKey}
      username={data?.username}
      verify={auth.verify}
    />
  ) : undefined

  const shouldRenderUploadPanel =
    Boolean(upload) && !(operation === 'create' && upload.hideFileInputOnCreate)
  const shouldScrollFieldsOnly = shouldRenderUploadPanel

  return (
    <main
      className={[
        baseClass,
        config.admin.constrainWidth && `${baseClass}--constrain-document-width`,
        (id || globalSlug) && `${baseClass}--is-editing`,
        globalSlug && `global-edit--${globalSlug}`,
        collectionSlug && `collection-edit--${collectionSlug}`,
        isLivePreviewing && `${baseClass}--is-live-previewing`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={isReadOnlyForIncomingUser || isInitializing || !hasSavePermission || isTrashed}
          disableSuccessStatus={!isEditing && depth < 2 && redirectAfterCreate !== false}
          disableValidationOnSubmit={!validateBeforeSubmit}
          formStateRequest={formStateRequest}
          initialState={!isInitializing && initialState}
          isDocumentForm={true}
          isInitializing={isInitializing}
          key={`${isLocked}`}
          method={id ? 'PATCH' : 'POST'}
          onSuccess={onSave}
        >
          {isInDrawer && (
            <DocumentDrawerHeader
              actions={
                <DocumentControls {...documentControlsProps} variant="drawerHeaderActions" />
              }
              AfterHeader={Description}
              BeforeDocumentMeta={BeforeDocumentMeta}
              drawerSlug={drawerSlug}
              readOnlyForIncomingUser={isReadOnlyForIncomingUser}
              renderTitleAsLink={!isFolderCollection}
              Status={Status}
              user={currentEditor}
            />
          )}
          {isLockingEnabled && shouldShowDocumentLockedModal && (
            <DocumentLocked
              handleGoBack={() => handleGoBack({ adminRoute, collectionSlug, router, serverURL })}
              isActive={shouldShowDocumentLockedModal}
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
              onTakeOver={() =>
                handleTakeOver({
                  id,
                  clearRouteCache,
                  collectionSlug,
                  documentLockStateRef,
                  globalSlug,
                  isLockingEnabled,
                  isWithinDoc: false,
                  setCurrentEditor,
                  updateDocumentEditor,
                  user,
                })
              }
              updatedAt={lastUpdateTime}
              user={currentEditor}
            />
          )}
          {isLockingEnabled && showTakeOverModal && (
            <DocumentTakeOver
              handleBackToDashboard={() => handleBackToDashboard({ adminRoute, router, serverURL })}
              isActive={showTakeOverModal}
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
            />
          )}
          {showStaleDataModal && (
            <DocumentStaleData isActive={showStaleDataModal} onReload={handleStaleDataReload} />
          )}
          {preventLeaveWithoutSaving && (
            <LeaveWithoutSaving
              modalSlug={drawerSlug ? `leave-without-saving-${drawerSlug}` : undefined}
              onConfirm={handleLeaveConfirm}
              onPrevent={handlePrevent}
            />
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
          {!isInDrawer && <DocumentControls {...documentControlsProps} variant="default" />}
          <div
            className={[
              `${baseClass}__main-wrapper`,
              shouldRenderUploadPanel && `${baseClass}__main-wrapper--has-upload-panel`,
              shouldScrollFieldsOnly && `${baseClass}__main-wrapper--scroll-fields-only`,
              isPopupOpen && `${baseClass}--detached`,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={[`${baseClass}__main`, isPopupOpen && `${baseClass}__main--popup-open`]
                .filter(Boolean)
                .join(' ')}
            >
              <DocumentFields
                AfterFields={AfterFields}
                BeforeFields={
                  renderAuth || BeforeFields ? (
                    <>
                      {renderAuth}
                      {BeforeFields}
                    </>
                  ) : null
                }
                Description={Description}
                docPermissions={docPermissions}
                fields={docConfig.fields}
                forceSidebarWrap={shouldRenderUploadPanel || isLivePreviewing}
                isTrashed={isTrashed}
                readOnly={isReadOnlyForIncomingUser || !hasSavePermission || isTrashed}
                schemaPathSegments={schemaPathSegments}
              />
              {AfterDocument}
            </div>
            {shouldRenderUploadPanel && (
              <UploadControlsProvider>
                {CustomUpload || (
                  <FileManager
                    collectionSlug={collectionConfig.slug}
                    initialState={initialState}
                    uploadConfig={upload}
                    UploadControls={UploadControls}
                    UploadFilePreview={UploadFilePreview}
                  />
                )}
              </UploadControlsProvider>
            )}
            {isLivePreviewEnabled && !isInDrawer && livePreviewURL && (
              <>
                {CustomLivePreview || (
                  <LivePreviewWindow collectionSlug={collectionSlug} globalSlug={globalSlug} />
                )}
              </>
            )}
          </div>
        </Form>
      </OperationProvider>
    </main>
  )
}
