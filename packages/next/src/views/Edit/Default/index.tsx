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
    currentEditor,
    disableActions,
    disableLeaveWithoutSaving,
    docPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData: data,
    initialState,
    isDocumentLocked,
    isEditing,
    isInitializing,
    lastEditedAt,
    lockDocument,
    onSave: onSaveFromContext,
    setCurrentEditor,
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

  const lockWhenEditingProp = collectionConfig.lockWhenEditing

  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, (id || globalSlug) && `${baseClass}--is-editing`]

  if (globalSlug) classes.push(`global-edit--${globalSlug}`)
  if (collectionSlug) classes.push(`collection-edit--${collectionSlug}`)

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

  const lockTimer = useRef<NodeJS.Timeout | null>(null)

  const resetLockTimer = useCallback(() => {
    if (lockTimer.current) {
      clearTimeout(lockTimer.current)
    }

    const duration =
      typeof lockWhenEditingProp === 'object' && 'lockDuration' in lockWhenEditingProp
        ? lockWhenEditingProp.lockDuration
        : 300

    lockTimer.current = setTimeout(() => {
      if (id || globalSlug) {
        void unlockDocument(id, collectionSlug ?? globalSlug)
      }
    }, duration * 1000)
  }, [lockWhenEditingProp, id, globalSlug, collectionSlug, unlockDocument])

  // Closes Document Locked modal upon take over
  const handleTakeOver = useCallback(() => {
    setShowLockedModal(false)
    setIsLockedByAnotherUser(false)
    setShowTakeOverModal(false)
  }, [])

  const handleTakeOverWithinDoc = useCallback(() => {
    setShowLockedModal(false)
    setShowTakeOverModal(false)
    setIsReadOnlyForIncomingUser(false)
  }, [])

  useEffect(() => {
    if (documentLockStateRef.current && documentLockStateRef.current.user.id !== user.id) {
      setIsLockedByAnotherUser(true)
    } else {
      setIsLockedByAnotherUser(false)
    }
  }, [user.id])

  useEffect(() => {
    if (isDocumentLocked && currentEditor && currentEditor.id !== user.id && !showTakeOverModal) {
      // Show the DocumentLocked modal for the incoming user
      setShowLockedModal(true)
    } else {
      setShowLockedModal(false)
    }
  }, [currentEditor, isDocumentLocked, showTakeOverModal, user.id])

  const handleGoBack = useCallback(() => {
    const redirectRoute = formatAdminURL({
      adminRoute,
      path: collectionSlug ? `/collections/${collectionSlug}` : '/',
    })
    router.push(redirectRoute)
  }, [adminRoute, collectionSlug, router])

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

      // Unlock the document after save
      if (id || globalSlug) {
        void unlockDocument(id, collectionSlug ?? globalSlug)
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
      unlockDocument,
      globalSlug,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
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
          returnLockStatus: true,
          schemaPath,
        },
        serverURL,
      })

      console.log('Locked State user email: ', lockedState?.user?.email)
      console.log('Locked State user ID: ', lockedState?.user?.id)
      console.log('Document Lock state ref user ID: ', documentLockStateRef.current?.user?.id)
      console.log('USER ID: ', user?.id)

      const previousOwnerId = documentLockStateRef.current?.user?.id

      if (lockedState) {
        if (!documentLockStateRef.current || lockedState.user.id !== previousOwnerId) {
          if (previousOwnerId === user.id && lockedState.user.id !== user.id) {
            console.log("Triggering the takeover modal on the previous user's screen")
            setShowTakeOverModal(true)
          }

          console.log('Updating Document Lock State Ref to:', lockedState.user.id)
          documentLockStateRef.current = lockedState

          setCurrentEditor(lockedState.user)

          if (lockedState.user.id !== user.id) {
            console.log('The document is locked by another user')
            setIsLockedByAnotherUser(true)
          } else {
            setIsLockedByAnotherUser(false)
          }
        }
      }

      console.log('Is locked by another user: ', isLockedByAnotherUser)
      console.log('Show take over modal: ', showTakeOverModal)

      if (
        isLockedByAnotherUser &&
        documentLockStateRef.current?.user?.id !== user.id &&
        !showTakeOverModal
      ) {
        console.log('Taking over the document')
        documentLockStateRef.current = { isLocked: true, user }
        setCurrentEditor(user)

        await updateDocumentEditor(id, collectionSlug ?? globalSlug, user)
      }

      if ((id || globalSlug) && !isLockedByAnotherUser && !isDocumentLockedRef.current) {
        console.log('Locking the document')
        setShouldLockDocument(true)
        resetLockTimer()
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
      isLockedByAnotherUser,
      updateDocumentEditor,
      user,
      resetLockTimer,
      documentLockStateRef,
      showTakeOverModal,
      setCurrentEditor,
    ],
  )

  useEffect(() => {
    if ((id || globalSlug) && shouldLockDocument && !isDocumentLockedRef.current) {
      const lockDoc = async () => {
        try {
          await lockDocument(id, collectionSlug ?? globalSlug, user)
          isDocumentLockedRef.current = true

          resetLockTimer() // Start the lock timer
        } catch (error) {
          console.error('Failed to lock the document', error)
        } finally {
          setShouldLockDocument(false)
        }
      }

      void lockDoc()
    }
  }, [shouldLockDocument, lockDocument, id, user, resetLockTimer, globalSlug, collectionSlug])

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      if ((id || globalSlug) && isDocumentLockedRef.current) {
        if (documentLockStateRef.current?.user?.id === user.id) {
          void unlockDocument(id, collectionSlug ?? globalSlug)
        }

        isDocumentLockedRef.current = false

        if (lockTimer.current) {
          clearTimeout(lockTimer.current)
          lockTimer.current = null
        }
      }

      setShowTakeOverModal(false)
    }
  }, [collectionSlug, globalSlug, id, unlockDocument, user.id])

  console.log('Current Editor: ', currentEditor)

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
              onReadOnly={() => {
                setIsReadOnlyForIncomingUser(true)
                setShowTakeOverModal(false)
              }}
              onTakeOver={handleTakeOver}
              user={currentEditor}
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
            onTakeOver={handleTakeOverWithinDoc}
            permissions={docPermissions}
            readOnlyForIncomingUser={isReadOnlyForIncomingUser}
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
