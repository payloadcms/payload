'use client'

import type { ClientUser, DocumentViewClientProps, FormState } from 'payload'

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
import { Upload } from '../../elements/Upload/index.js'
import { Form } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { OperationProvider } from '../../providers/Operation/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
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
  Description,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
  Upload: CustomUpload,
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
    disableActions,
    disableCreate,
    disableLeaveWithoutSaving,
    docPermissions,
    documentIsLocked,
    getDocPermissions,
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialState,
    isEditing,
    isInitializing,
    lastUpdateTime,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    savedDocumentData,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    updateDocumentEditor,
    updateSavedDocumentData,
  } = useDocumentInfo()

  const {
    clearDoc,
    drawerSlug,
    onDelete,
    onDuplicate,
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

  const documentLockStateRef = useRef<{
    hasShownLockedModal: boolean
    isLocked: boolean
    user: ClientUser | number | string
  } | null>({
    hasShownLockedModal: false,
    isLocked: false,
    user: null,
  })

  const classes = [baseClass, (id || globalSlug) && `${baseClass}--is-editing`]

  if (globalSlug) {
    classes.push(`global-edit--${globalSlug}`)
  }

  if (collectionSlug) {
    classes.push(`collection-edit--${collectionSlug}`)
  }

  const schemaPathSegments = useMemo(() => [entitySlug], [entitySlug])

  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return true
    }

    return false
  })

  const handleDocumentLocking = useCallback(
    (lockedState: LockedState) => {
      setDocumentIsLocked(true)
      const previousOwnerID =
        typeof documentLockStateRef.current?.user === 'object'
          ? documentLockStateRef.current?.user?.id
          : documentLockStateRef.current?.user

      if (lockedState) {
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
            user: lockedState.user as ClientUser,
          }
          setCurrentEditor(lockedState.user as ClientUser)
        }
      }
    },
    [setCurrentEditor, setDocumentIsLocked, user?.id],
  )

  const onSave = useCallback(
    async (json): Promise<FormState> => {
      const controller = handleAbortRef(abortOnSaveRef)

      const document = json?.doc || json?.result

      reportUpdate({
        id,
        entitySlug,
        updatedAt: document?.updatedAt || new Date().toISOString(),
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      incrementVersionCount()

      if (typeof updateSavedDocumentData === 'function') {
        void updateSavedDocumentData(document || {})
      }

      if (typeof onSaveFromContext === 'function') {
        const operation = id ? 'update' : 'create'

        void onSaveFromContext({
          ...json,
          operation,
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

      if ((id || globalSlug) && !autosaveEnabled) {
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
      incrementVersionCount,
      updateSavedDocumentData,
      onSaveFromContext,
      isEditing,
      depth,
      getDocPermissions,
      globalSlug,
      autosaveEnabled,
      refreshCookieAsync,
      adminRoute,
      locale,
      router,
      resetUploadEdits,
      getDocPreferences,
      getFormState,
      docPermissions,
      operation,
      schemaPathSegments,
      isLockingEnabled,
      setDocumentIsLocked,
      startRouteTransition,
      redirectAfterCreate,
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

      const { lockedState, state } = await getFormState({
        id,
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        globalSlug,
        operation,
        skipValidation: !submitted,
        // Performance optimization: Setting it to false ensure that only fields that have explicit requireRender set in the form state will be rendered (e.g. new array rows).
        // We only want to render ALL fields on initial render, not in onChange.
        renderAllFields: false,
        returnLockStatus: isLockingEnabled,
        schemaPath: schemaPathSegments.join('.'),
        signal: controller.signal,
        updateLastEdited,
      })

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
      if (isLockingEnabled && documentIsLocked && (id || globalSlug)) {
        // Only retain the lock if the user is still viewing the document
        const shouldUnlockDocument = !['preview', 'api', 'versions'].some((path) =>
          window.location.pathname.includes(path),
        )
        if (shouldUnlockDocument) {
          // Check if this user is still the current editor
          if (
            typeof documentLockStateRef.current?.user === 'object'
              ? documentLockStateRef.current?.user?.id === user?.id
              : documentLockStateRef.current?.user === user?.id
          ) {
            void unlockDocument(id, collectionSlug ?? globalSlug)
            setDocumentIsLocked(false)
            setCurrentEditor(null)
          }
        }
      }

      setShowTakeOverModal(false)
    }
  }, [
    collectionSlug,
    globalSlug,
    id,
    unlockDocument,
    user,
    setCurrentEditor,
    isLockingEnabled,
    documentIsLocked,
    setDocumentIsLocked,
  ])

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
    !documentLockStateRef.current?.hasShownLockedModal &&
    !isLockExpired

  return (
    <main className={classes.filter(Boolean).join(' ')}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={isReadOnlyForIncomingUser || isInitializing || !hasSavePermission}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isDocumentForm={true}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {isInDrawer && <DocumentDrawerHeader drawerSlug={drawerSlug} />}
          {isLockingEnabled && shouldShowDocumentLockedModal && !isReadOnlyForIncomingUser && (
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
                  documentLockStateRef,
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
          {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && <LeaveWithoutSaving />}
          {!isInDrawer && (
            <SetDocumentStepNav
              collectionSlug={collectionConfig?.slug}
              globalSlug={globalConfig?.slug}
              id={id}
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
            customComponents={{
              PreviewButton,
              PublishButton,
              SaveButton,
              SaveDraftButton,
            }}
            data={savedDocumentData}
            disableActions={disableActions}
            disableCreate={disableCreate}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            onDelete={onDelete}
            onDrawerCreateNew={clearDoc}
            onDuplicate={onDuplicate}
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
                documentLockStateRef,
                isLockingEnabled,
                setIsReadOnlyForIncomingUser,
              )
            }
            permissions={docPermissions}
            readOnlyForIncomingUser={isReadOnlyForIncomingUser}
            redirectAfterDelete={redirectAfterDelete}
            redirectAfterDuplicate={redirectAfterDuplicate}
            slug={collectionConfig?.slug || globalConfig?.slug}
            user={currentEditor}
          />
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
                      email={savedDocumentData?.email}
                      loginWithUsername={auth?.loginWithUsername}
                      operation={operation}
                      readOnly={!hasSavePermission}
                      requirePassword={!id}
                      setValidateBeforeSubmit={setValidateBeforeSubmit}
                      useAPIKey={auth.useAPIKey}
                      username={savedDocumentData?.username}
                      verify={auth.verify}
                    />
                  )}
                  {upload && (
                    <React.Fragment>
                      {CustomUpload || (
                        <Upload
                          collectionSlug={collectionConfig.slug}
                          initialState={initialState}
                          uploadConfig={upload}
                        />
                      )}
                    </React.Fragment>
                  )}
                </Fragment>
              )
            }
            Description={Description}
            docPermissions={docPermissions}
            fields={docConfig.fields}
            readOnly={isReadOnlyForIncomingUser || !hasSavePermission}
            schemaPathSegments={schemaPathSegments}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
