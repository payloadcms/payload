'use client'

import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  ClientSideEditViewProps,
  ClientUser,
} from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import type { FormProps } from '../../forms/Form/index.js'

import { DocumentControls } from '../../elements/DocumentControls/index.js'
import { DocumentFields } from '../../elements/DocumentFields/index.js'
// import { LoadingOverlay } from '../../elements/Loading/index.js'
// import { RenderComponent } from '../../elements/RenderComponent/index.js'
// import { DocumentLocked } from '../../../elements/DocumentLocked/index.js'
// import { Upload } from '../../elements/Upload/index.js'
import { Form } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
// import { DocumentTakeOver } from '../../../elements/DocumentTakeOver/index.js'
import { OperationProvider } from '../../providers/Operation/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { getFormState } from '../../utilities/getFormState.js'
import { handleTakeOver } from '../../utilities/handleTakeOver.js'
// import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving/index.js'
import { Auth } from './Auth/index.js'
import './index.scss'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC<ClientSideEditViewProps> = ({
  MainFields,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
  SidebarFields,
}) => {
  const {
    id,
    action,
    AfterDocument,
    AfterFields,
    apiURL,
    BeforeDocument,
    BeforeFields,
    collectionSlug,
    currentEditor,
    disableActions,
    disableCreate,
    disableLeaveWithoutSaving,
    docPermissions,
    documentIsLocked,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData: data,
    initialState,
    isEditing,
    isInitializing,
    onDelete,
    onDrawerCreate,
    onDuplicate,
    onSave: onSaveFromContext,
    redirectAfterDelete,
    redirectAfterDuplicate,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    updateDocumentEditor,
  } = useDocumentInfo()

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const depth = useEditDepth()

  const { refreshCookieAsync, user } = useAuth()

  const router = useRouter()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()

  const locale = params.get('locale')

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const docConfig = collectionConfig || globalConfig

  const lockDocumentsProp = docConfig?.lockDocuments !== undefined ? docConfig?.lockDocuments : true

  const isLockingEnabled = lockDocumentsProp !== false

  let preventLeaveWithoutSaving = true

  if (collectionConfig) {
    preventLeaveWithoutSaving = !(
      collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave
    )
  } else if (globalConfig) {
    preventLeaveWithoutSaving = !(
      globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave
    )
  } else if (typeof disableLeaveWithoutSaving !== 'undefined') {
    preventLeaveWithoutSaving = !disableLeaveWithoutSaving
  }

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)

  const documentLockStateRef = useRef<{
    hasShownLockedModal: boolean
    isLocked: boolean
    user: ClientUser
  } | null>({
    hasShownLockedModal: false,
    isLocked: false,
    user: null,
  })

  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  const classes = [baseClass, (id || globalSlug) && `${baseClass}--is-editing`]

  if (globalSlug) {
    classes.push(`global-edit--${globalSlug}`)
  }

  if (collectionSlug) {
    classes.push(`collection-edit--${collectionSlug}`)
  }

  const [schemaPath, setSchemaPath] = useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return `_${entitySlug}.auth`
    }

    return entitySlug
  })

  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return true
    }

    return false
  })

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        id,
        entitySlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      void getVersions()

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }

      // Unlock the document after save
      if ((id || globalSlug) && isLockingEnabled) {
        setDocumentIsLocked(false)
      }

      if (!isEditing && depth < 2) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`,
        })
        router.push(redirectRoute)
      } else {
        resetUploadEdits()
      }
    },
    [
      onSaveFromContext,
      userSlug,
      reportUpdate,
      id,
      entitySlug,
      user,
      depth,
      collectionSlug,
      getVersions,
      isEditing,
      refreshCookieAsync,
      adminRoute,
      router,
      locale,
      resetUploadEdits,
      globalSlug,
      isLockingEnabled,
      setDocumentIsLocked,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const currentTime = Date.now()
      const timeSinceLastUpdate = currentTime - lastUpdateTime

      const updateLastEdited = isLockingEnabled && timeSinceLastUpdate >= 10000 // 10 seconds

      if (updateLastEdited) {
        setLastUpdateTime(currentTime)
      }

      const docPreferences = await getDocPreferences()

      const { lockedState, state } = await getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          docPreferences,
          formState: prevFormState,
          globalSlug,
          operation,
          returnLockStatus: isLockingEnabled ? true : false,
          schemaPath,
          updateLastEdited,
        },
        serverURL,
      })

      setDocumentIsLocked(true)

      if (isLockingEnabled) {
        const previousOwnerId = documentLockStateRef.current?.user?.id

        if (lockedState) {
          if (!documentLockStateRef.current || lockedState.user.id !== previousOwnerId) {
            if (previousOwnerId === user.id && lockedState.user.id !== user.id) {
              setShowTakeOverModal(true)
              documentLockStateRef.current.hasShownLockedModal = true
            }

            documentLockStateRef.current = documentLockStateRef.current = {
              hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal || false,
              isLocked: true,
              user: lockedState.user,
            }
            setCurrentEditor(lockedState.user)
          }
        }
      }

      return state
    },
    [
      apiRoute,
      collectionSlug,
      schemaPath,
      getDocPreferences,
      globalSlug,
      id,
      operation,
      serverURL,
      user,
      documentLockStateRef,
      setCurrentEditor,
      isLockingEnabled,
      setDocumentIsLocked,
      lastUpdateTime,
    ],
  )

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      if (!isLockingEnabled) {
        return
      }

      const currentPath = window.location.pathname

      const documentId = id || globalSlug

      // Routes where we do NOT want to unlock the document
      const stayWithinDocumentPaths = ['preview', 'api', 'versions']

      const isStayingWithinDocument = stayWithinDocumentPaths.some((path) =>
        currentPath.includes(path),
      )

      // Unlock the document only if we're actually navigating away from the document
      if (documentId && documentIsLocked && !isStayingWithinDocument) {
        // Check if this user is still the current editor
        if (documentLockStateRef.current?.user?.id === user.id) {
          void unlockDocument(id, collectionSlug ?? globalSlug)
          setDocumentIsLocked(false)
          setCurrentEditor(null)
        }
      }

      setShowTakeOverModal(false)
    }
  }, [
    collectionSlug,
    globalSlug,
    id,
    unlockDocument,
    user.id,
    setCurrentEditor,
    isLockingEnabled,
    documentIsLocked,
    setDocumentIsLocked,
  ])

  const shouldShowDocumentLockedModal =
    documentIsLocked &&
    currentEditor &&
    currentEditor.id !== user.id &&
    !isReadOnlyForIncomingUser &&
    !showTakeOverModal &&
    !documentLockStateRef.current?.hasShownLockedModal

  return (
    <main className={classes.filter(Boolean).join(' ')}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={isReadOnlyForIncomingUser || isInitializing || !hasSavePermission}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {BeforeDocument}
          {/* {isLockingEnabled && shouldShowDocumentLockedModal && !isReadOnlyForIncomingUser && (
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
          )} */}
          {/* {isLockingEnabled && showTakeOverModal && (
            <DocumentTakeOver
              handleBackToDashboard={() => handleBackToDashboard({ adminRoute, router })}
              isActive={showTakeOverModal}
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
            />
          )} */}
          {/* {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && <LeaveWithoutSaving />} */}
          <SetDocumentStepNav
            collectionSlug={collectionConfig?.slug}
            globalSlug={globalConfig?.slug}
            id={id}
            pluralLabel={collectionConfig?.labels?.plural}
            useAsTitle={collectionConfig?.admin?.useAsTitle}
          />
          <SetDocumentTitle
            collectionConfig={collectionConfig}
            config={config}
            fallback={depth <= 1 ? id?.toString() : undefined}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            data={data}
            disableActions={disableActions}
            disableCreate={disableCreate}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            onDelete={onDelete}
            onDrawerCreate={onDrawerCreate}
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
            PreviewButton={PreviewButton}
            PublishButton={PublishButton}
            readOnlyForIncomingUser={isReadOnlyForIncomingUser}
            redirectAfterDelete={redirectAfterDelete}
            redirectAfterDuplicate={redirectAfterDuplicate}
            SaveButton={SaveButton}
            SaveDraftButton={SaveDraftButton}
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
                      email={data?.email}
                      loginWithUsername={auth?.loginWithUsername}
                      operation={operation}
                      readOnly={!hasSavePermission}
                      requirePassword={!id}
                      setSchemaPath={setSchemaPath}
                      setValidateBeforeSubmit={setValidateBeforeSubmit}
                      // eslint-disable-next-line react-compiler/react-compiler
                      useAPIKey={auth.useAPIKey}
                      username={data?.username}
                      verify={auth.verify}
                    />
                  )}
                  {upload && (
                    <React.Fragment>
                      TODO: Upload
                      {/* {collectionConfig?.admin?.components?.edit?.Upload ? (
                        <RenderComponent
                          mappedComponent={collectionConfig.admin.components.edit.Upload}
                        />
                      ) : (
                        <Upload
                          collectionSlug={collectionConfig.slug}
                          initialState={initialState}
                          uploadConfig={upload}
                        />
                      )} */}
                    </React.Fragment>
                  )}
                </Fragment>
              )
            }
            MainFields={MainFields}
            SidebarFields={SidebarFields}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
