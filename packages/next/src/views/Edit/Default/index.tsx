'use client'

import type { ClientCollectionConfig, ClientGlobalConfig, ClientUser } from 'payload'

import {
  DocumentControls,
  DocumentFields,
  Form,
  type FormProps,
  OperationProvider,
  RenderComponent,
  Upload,
  useAuth,
  useConfig,
  useDocumentEvents,
  useDocumentInfo,
  useEditDepth,
  useModal,
  useUploadEdits,
} from '@payloadcms/ui'
import { formatAdminURL, getFormState } from '@payloadcms/ui/shared'
import { useRouter, useSearchParams } from 'next/navigation.js'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { DocumentLocked } from '../../../elements/DocumentLocked/index.js'
import { DocumentTakeOver } from '../../../elements/DocumentTakeOver/index.js'
import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving/index.js'
import { Auth } from './Auth/index.js'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
  const {
    id,
    AfterDocument,
    AfterFields,
    BeforeDocument,
    BeforeFields,
    action,
    apiURL,
    collectionSlug,
    disableActions,
    disableLeaveWithoutSaving,
    docPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData: data,
    initialEditor,
    initialState,
    isDocumentLocked,
    isEditing,
    isInitializing,
    lastEditedAt,
    lockDocument,
    onSave: onSaveFromContext,
    unlockDocument,
    updateDocumentEditor,
  } = useDocumentInfo()

  const { refreshCookieAsync, user } = useAuth()
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)

  const [shouldLockDocument, setShouldLockDocument] = useState(false)

  const documentLockStateRef = useRef<{
    isLocked: boolean
    user: ClientUser
  } | null>(null)

  const isDocumentLockedRef = useRef(false)

  const [isLockedByAnotherUser, setIsLockedByAnotherUser] = useState(false)

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const router = useRouter()
  const depth = useEditDepth()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()

  const locale = params.get('locale')

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, id && `${baseClass}--is-editing`]

  if (globalSlug) classes.push(`global-edit--${globalSlug}`)
  if (collectionSlug) classes.push(`collection-edit--${collectionSlug}`)

  const [schemaPath, setSchemaPath] = React.useState(() => {
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

  const handleTakeOver = useCallback(() => {
    // Close the modal and mark that the user intends to edit
    setShowLockedModal(false)
    setIsLockedByAnotherUser(false)
    documentLockStateRef.current = { isLocked: true, user }
  }, [user])

  useEffect(() => {
    if (documentLockStateRef.current && documentLockStateRef.current.user.id !== user.id) {
      setIsLockedByAnotherUser(true)
    } else {
      setIsLockedByAnotherUser(false)
    }
  }, [user.id])

  // Handle modal display logic based on lock state
  useEffect(() => {
    if (isDocumentLocked && initialEditor && initialEditor.id !== user.id) {
      // Show the DocumentLocked modal for the incoming user
      setShowLockedModal(true)
    } else {
      setShowLockedModal(false)
    }
  }, [isDocumentLocked, initialEditor, user.id])

  useEffect(() => {
    let timeoutId

    if (isLockedByAnotherUser && documentLockStateRef.current?.user?.id !== user.id) {
      timeoutId = setTimeout(() => {
        setShowTakeOverModal(true)
      }, 200)
    } else {
      clearTimeout(timeoutId)
      setShowTakeOverModal(false)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLockedByAnotherUser, user.id])

  const handleGoBack = useCallback(() => {
    const redirectRoute = formatAdminURL({
      adminRoute,
      path: collectionSlug ? `/collections/${collectionSlug}` : `/globals/${globalSlug}`,
    })
    router.push(redirectRoute)
  }, [adminRoute, collectionSlug, globalSlug, router])

  const handleBackToDashboard = useCallback(() => {
    const redirectRoute = formatAdminURL({
      adminRoute,
      path: '/',
    })
    router.push(redirectRoute)
  }, [adminRoute, router])

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
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const docPreferences = await getDocPreferences()

      // Lock the document if it's not locked by another user and hasn't been locked by this user yet
      if (id && !isLockedByAnotherUser && !isDocumentLockedRef.current) {
        setShouldLockDocument(true)
      }

      if (id && isLockedByAnotherUser && documentLockStateRef.current?.user?.id !== user.id) {
        documentLockStateRef.current = { isLocked: true, user }
        setIsLockedByAnotherUser(false)

        await updateDocumentEditor(id, user)
      }

      // Fire the request immediately with returnLockStatus: true if the document is locked
      const { state } = await getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          docPreferences,
          formState: prevFormState,
          globalSlug,
          operation,
          returnLockStatus: shouldLockDocument,
          schemaPath,
        },
        serverURL,
      })

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
      isLockedByAnotherUser,
      shouldLockDocument,
      updateDocumentEditor,
      user,
    ],
  )

  const intervalRef = useRef(null)

  const checkLockStatus = useCallback(async () => {
    if (!isDocumentLockedRef.current) return

    const docPreferences = await getDocPreferences()

    const { lockedState } = await getFormState({
      apiRoute,
      body: {
        id,
        collectionSlug,
        docPreferences,
        formState: {},
        globalSlug,
        operation,
        returnLockStatus: true,
        schemaPath,
      },
      serverURL,
    })

    if (lockedState) {
      if (
        !documentLockStateRef.current ||
        lockedState.user.id !== documentLockStateRef.current.user.id
      ) {
        documentLockStateRef.current = lockedState

        if (lockedState.user.id !== user.id) {
          setIsLockedByAnotherUser(true)
        } else {
          setIsLockedByAnotherUser(false)
        }
      }
    }
  }, [
    apiRoute,
    collectionSlug,
    getDocPreferences,
    globalSlug,
    id,
    operation,
    schemaPath,
    serverURL,
    user.id,
  ])

  useEffect(() => {
    if (id && shouldLockDocument && !isDocumentLockedRef.current) {
      const lockDoc = async () => {
        try {
          await lockDocument(id, user)
          isDocumentLockedRef.current = true

          // Immediately check the lock status after locking
          await checkLockStatus()

          // Start the interval to check the lock status every 10 seconds
          if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
              void checkLockStatus()
            }, 10000) // 10 seconds
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to lock the document', error)
        } finally {
          setShouldLockDocument(false)
        }
      }

      void lockDoc()
    }
  }, [shouldLockDocument, lockDocument, id, user, checkLockStatus])

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      if (id && isDocumentLockedRef.current) {
        // Only unlock the document if the current user is the one who locked it
        if (documentLockStateRef.current?.user?.id === user.id) {
          void unlockDocument(id)
        }

        isDocumentLockedRef.current = false

        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [id, unlockDocument, user.id])

  return (
    <main className={classes.filter(Boolean).join(' ')}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disableValidationOnSubmit={!validateBeforeSubmit}
          disabled={isReadOnlyForIncomingUser || isInitializing || !hasSavePermission}
          initialState={!isInitializing && initialState}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {BeforeDocument}
          {showLockedModal && (
            <DocumentLocked
              editedAt={lastEditedAt}
              handleGoBack={handleGoBack}
              isActive={showLockedModal}
              onReadOnly={() => setIsReadOnlyForIncomingUser(true)}
              onTakeOver={handleTakeOver}
              user={initialEditor}
            />
          )}
          {showTakeOverModal && (
            <DocumentTakeOver
              handleBackToDashboard={handleBackToDashboard}
              isActive={showTakeOverModal}
              onReadOnly={() => setIsReadOnlyForIncomingUser(true)}
            />
          )}
          {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && <LeaveWithoutSaving />}
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
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            onTakeOver={handleTakeOver}
            permissions={docPermissions}
            readOnlyForIncomingUser={isReadOnlyForIncomingUser}
            slug={collectionConfig?.slug || globalConfig?.slug}
            user={initialEditor}
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
                      useAPIKey={auth.useAPIKey}
                      username={data?.username}
                      verify={auth.verify}
                    />
                  )}
                  {upload && (
                    <React.Fragment>
                      {collectionConfig?.admin?.components?.edit?.Upload ? (
                        <RenderComponent
                          mappedComponent={collectionConfig.admin.components.edit.Upload}
                        />
                      ) : (
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
            docPermissions={docPermissions}
            fields={(collectionConfig || globalConfig)?.fields}
            readOnly={isReadOnlyForIncomingUser || !hasSavePermission}
            schemaPath={schemaPath}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
