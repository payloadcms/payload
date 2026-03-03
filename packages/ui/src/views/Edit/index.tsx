'use client'

import type { ClientUser, DocumentViewClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL, hasAutosaveEnabled } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { FormProps } from '../../forms/Form/index.js'
import type { FormOnSuccess } from '../../forms/Form/types.js'
import type { LockedState } from '../../utilities/buildFormState.js'

import { DocumentControls } from '../../elements/DocumentControls/index.js'
import { DocumentDrawerHeader } from '../../elements/DocumentDrawer/DrawerHeader/index.js'
import { useDocumentDrawerContext } from '../../elements/DocumentDrawer/Provider.js'
import { DocumentFields } from '../../elements/DocumentFields/index.js'
import { DocumentLocked } from '../../elements/DocumentLocked/index.js'
import { DocumentStaleData } from '../../elements/DocumentStaleData/index.js'
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
import { useLivePreviewContext, usePreviewURL } from '../../providers/LivePreview/context.js'
import { OperationProvider } from '../../providers/Operation/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
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
  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()
  const {
    isLivePreviewEnabled,
    isLivePreviewing,
    previewWindowType,
    setURL: setLivePreviewURL,
    typeofLivePreviewURL,
    url: livePreviewURL,
  } = useLivePreviewContext()
  const { isPreviewEnabled, setPreviewURL } = usePreviewURL()

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

  const autosaveEnabled = hasAutosaveEnabled(docConfig)

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)
  const [showStaleDataModal, setShowStaleDataModal] = useState(false)

  const [editSessionStartTime, setEditSessionStartTime] = useState(Date.now())

  const hasCheckedForStaleDataRef = useRef(false)
  const originalUpdatedAtRef = useRef(data?.updatedAt)

  const lockExpiryTime = lastUpdateTime + lockDurationInMilliseconds
  const isLockExpired = Date.now() > lockExpiryTime

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
        typeof documentLockState.current?.user === 'object'
          ? documentLockState.current?.user?.id
          : documentLockState.current?.user

      if (lockedState && lockedState.user) {
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

        // Update lastUpdateTime when lock state changes
        if (lockedState.lastEditedAt) {
          setLastUpdateTime(new Date(lockedState.lastEditedAt).getTime())
        }
      }
    },
    [documentLockState, setCurrentEditor, setDocumentIsLocked, setLastUpdateTime, user?.id],
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
    const lockUser = documentLockState.current?.user

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
    documentLockState,
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
      const { context, formState } = ctx || {}

      const controller = handleAbortRef(abortOnSaveRef)

      const document = json?.doc || json?.result

      const updatedAt = document?.updatedAt || new Date().toISOString()

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      setLastUpdateTime(updatedAt)

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

        startRouteTransition(() => router.push(redirectRoute))
      } else {
        resetUploadEdits()
      }

      if (context?.getDocPermissions !== false) {
        await getDocPermissions(json)
      }

      if (id || globalSlug) {
        const docPreferences = await getDocPreferences()

        const { livePreviewURL, previewURL, state } = await getFormState({
          id,
          collectionSlug,
          data: document,
          docPermissions,
          docPreferences,
          formState,
          globalSlug,
          operation,
          renderAllFields: false,
          returnLivePreviewURL: isLivePreviewEnabled && typeofLivePreviewURL === 'function',
          returnLockStatus: false,
          returnPreviewURL: isPreviewEnabled,
          schemaPath: schemaPathSegments.join('.'),
          signal: controller.signal,
          skipValidation: true,
        })

        // For upload collections, clear the file field from the returned state
        // to prevent the File object from persisting in form state after save
        if (upload && state) {
          delete state.file
        }

        // Unlock the document after save
        if (isLockingEnabled) {
          setDocumentIsLocked(false)
        }

        if (isLivePreviewEnabled && typeofLivePreviewURL === 'function') {
          setLivePreviewURL(livePreviewURL)
        }

        if (isPreviewEnabled) {
          setPreviewURL(previewURL)
        }

        reportUpdate({
          id,
          doc: document,
          drawerSlug,
          entitySlug,
          operation: 'update',
          updatedAt,
        })

        abortOnSaveRef.current = null

        return state
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
      getDocPreferences,
      getFormState,
      docPermissions,
      operation,
      isLivePreviewEnabled,
      typeofLivePreviewURL,
      isPreviewEnabled,
      schemaPathSegments,
      upload,
      isLockingEnabled,
      reportUpdate,
      drawerSlug,
      entitySlug,
      setDocumentIsLocked,
      setLivePreviewURL,
      setPreviewURL,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      // Sync originalUpdatedAt with current data if it's NEWER (e.g., after router.refresh())
      if (data?.updatedAt && data.updatedAt > originalUpdatedAtRef.current) {
        originalUpdatedAtRef.current = data.updatedAt
        // Reset check flag so we can detect new stale data
        hasCheckedForStaleDataRef.current = false
      }

      const currentTime = Date.now()
      const timeSinceLastUpdate = currentTime - editSessionStartTime

      const updateLastEdited = isLockingEnabled && timeSinceLastUpdate >= 10000 // 10 seconds

      if (updateLastEdited) {
        setEditSessionStartTime(currentTime)
      }

      // Check for stale data on first edit only
      const checkForStaleData =
        !hasCheckedForStaleDataRef.current && originalUpdatedAtRef.current && operation === 'update'

      if (checkForStaleData) {
        hasCheckedForStaleDataRef.current = true
      }

      const docPreferences = await getDocPreferences()

      const result = await getFormState({
        id,
        checkForStaleData,
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        globalSlug,
        operation,
        originalUpdatedAt: checkForStaleData ? originalUpdatedAtRef.current : undefined,
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

      const { lockedState, staleDataState, state } = result

      if (isLockingEnabled) {
        handleDocumentLocking(lockedState)
      }

      // Handle stale data detection
      if (staleDataState?.isStale) {
        setShowStaleDataModal(true)
      }

      abortOnChangeRef.current = null

      return state
    },
    [
      data?.updatedAt,
      editSessionStartTime,
      isLockingEnabled,
      getDocPreferences,
      getFormState,
      id,
      collectionSlug,
      docPermissions,
      globalSlug,
      operation,
      schemaPathSegments,
      handleDocumentLocking,
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
    !documentLockState.current?.hasShownLockedModal &&
    !isLockExpired

  const isFolderCollection = Boolean(
    collectionConfig?.hierarchy &&
      typeof collectionConfig.hierarchy === 'object' &&
      collectionConfig.hierarchy.allowHasMany === false,
  )

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
          disableSuccessStatus={!isEditing && depth < 2 && redirectAfterCreate !== false}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isDocumentForm={true}
          isInitializing={isInitializing}
          key={`${isLocked}`}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {isInDrawer && (
            <DocumentDrawerHeader
              AfterHeader={Description}
              drawerSlug={drawerSlug}
              showDocumentID={!isFolderCollection}
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
                  documentLockStateRef: documentLockState,
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
            BeforeDocumentMeta={BeforeDocumentMeta}
            customComponents={{
              PreviewButton,
              PublishButton,
              SaveButton,
              SaveDraftButton,
              Status,
              UnpublishButton,
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
              handleTakeOver({
                id,
                clearRouteCache,
                collectionSlug,
                documentLockStateRef: documentLockState,
                globalSlug,
                isLockingEnabled,
                isWithinDoc: true,
                setCurrentEditor,
                setIsReadOnlyForIncomingUser,
                updateDocumentEditor,
                user,
              })
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
                          // eslint-disable-next-line react-compiler/react-compiler
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
