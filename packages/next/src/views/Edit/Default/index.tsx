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
import './index.scss'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
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

  const lockWhenEditingProp =
    collectionConfig.lockWhenEditing !== undefined ? collectionConfig.lockWhenEditing : true

  const isLockingEnabled = lockWhenEditingProp === true || typeof lockWhenEditingProp === 'object'

  const lockDuration =
    typeof lockWhenEditingProp === 'object' && 'lockDuration' in lockWhenEditingProp
      ? lockWhenEditingProp.lockDuration
      : 300 // default to 300 seconds if no lockDuration is provided

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

  const lockTimer = useRef<NodeJS.Timeout | null>(null)
  const isManualUnlockRef = useRef(false)

  const resetLockTimer = useCallback(() => {
    if (!isLockingEnabled) {
      return
    }

    if (lockTimer.current) {
      clearTimeout(lockTimer.current)
    }

    lockTimer.current = setTimeout(() => {
      if (id || globalSlug) {
        // Check if this user is still the current editor
        if (documentLockStateRef.current?.user.id !== user.id) {
          return // Stop execution if the user is no longer the owner
        }

        try {
          void unlockDocument(id, collectionSlug ?? globalSlug)

          // Reset the locked state
          isDocumentLockedRef.current = false
          documentLockStateRef.current = null
          setCurrentEditor(null)

          // Set manual unlock flag to prevent immediate relock
          isManualUnlockRef.current = true
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to unlock the document', error)
        }
      }
    }, lockDuration * 1000)
  }, [
    id,
    globalSlug,
    collectionSlug,
    unlockDocument,
    setCurrentEditor,
    user.id,
    lockDuration,
    isLockingEnabled,
  ])

  const handleTakeOver = useCallback(() => {
    if (!isLockingEnabled) {
      return
    }

    // Invalidate the previous user's timer
    if (lockTimer.current) {
      clearTimeout(lockTimer.current)
    }

    try {
      // Call updateDocumentEditor to update the document's owner to the current user
      void updateDocumentEditor(id, collectionSlug ?? globalSlug, user)

      // Update the locked state to reflect the current user as the owner
      documentLockStateRef.current = { isLocked: true, user }
      setCurrentEditor(user)
      setIsLockedByAnotherUser(false)

      // Reset the lock timer after takeover
      resetLockTimer()

      // Close modals if any were open
      setShowLockedModal(false)
      setShowTakeOverModal(false)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during document takeover:', error)
    }
  }, [
    updateDocumentEditor,
    id,
    collectionSlug,
    globalSlug,
    user,
    setCurrentEditor,
    setIsLockedByAnotherUser,
    resetLockTimer,
    isLockingEnabled,
  ])

  const handleTakeOverWithinDoc = useCallback(() => {
    if (!isLockingEnabled) {
      return
    }

    // Invalidate the previous user's timer
    if (lockTimer.current) {
      clearTimeout(lockTimer.current)
    }

    try {
      // Call updateDocumentEditor to update the document's owner to the current user
      void updateDocumentEditor(id, collectionSlug ?? globalSlug, user)

      // Update the locked state to reflect the current user as the owner
      documentLockStateRef.current = { isLocked: true, user }
      setCurrentEditor(user)
      setIsLockedByAnotherUser(false)

      // Reset the lock timer after takeover
      resetLockTimer()

      // Ensure the document is editable for the incoming user
      setIsReadOnlyForIncomingUser(false)

      // Close modals if any were open
      setShowLockedModal(false)
      setShowTakeOverModal(false)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during document takeover:', error)
    }
  }, [
    updateDocumentEditor,
    id,
    collectionSlug,
    globalSlug,
    user,
    setCurrentEditor,
    setIsLockedByAnotherUser,
    resetLockTimer,
    isLockingEnabled,
  ])

  useEffect(() => {
    if (!isLockingEnabled) {
      return
    }

    if (documentLockStateRef.current && documentLockStateRef.current.user.id !== user.id) {
      setIsLockedByAnotherUser(true)
    } else {
      setIsLockedByAnotherUser(false)
    }
  }, [user.id, isLockingEnabled])

  useEffect(() => {
    if (!isLockingEnabled) {
      return
    }

    if (isDocumentLocked && currentEditor && currentEditor.id !== user.id && !showTakeOverModal) {
      // Show the DocumentLocked modal for the incoming user
      setShowLockedModal(true)
    } else {
      setShowLockedModal(false)
    }
  }, [currentEditor, isDocumentLocked, showTakeOverModal, user.id, isLockingEnabled])

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

    // Clear the lock timer if they are still running
    if (lockTimer.current) {
      clearTimeout(lockTimer.current)
      lockTimer.current = null
    }

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
      if ((id || globalSlug) && isLockingEnabled) {
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
      isLockingEnabled,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      // If the document was manually unlocked, skip further processing
      if (isManualUnlockRef.current) {
        isManualUnlockRef.current = false
        return prevFormState // Return the previous form state unchanged
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
        },
        serverURL,
      })

      if (isLockingEnabled) {
        const previousOwnerId = documentLockStateRef.current?.user?.id

        if (lockedState) {
          if (!documentLockStateRef.current || lockedState.user.id !== previousOwnerId) {
            if (previousOwnerId === user.id && lockedState.user.id !== user.id) {
              setShowTakeOverModal(true)
            }

            documentLockStateRef.current = lockedState
            setCurrentEditor(lockedState.user)

            if (lockedState.user.id !== user.id) {
              setIsLockedByAnotherUser(true)
            } else {
              setIsLockedByAnotherUser(false)
            }
          }
        }

        if ((id || globalSlug) && !isLockedByAnotherUser) {
          resetLockTimer() // Reset the timer on every change
        }

        // Lock the document if it's not locked and this user is the current editor
        if ((id || globalSlug) && !isLockedByAnotherUser && !isDocumentLockedRef.current) {
          setShouldLockDocument(true)
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
      isLockedByAnotherUser,
      user,
      resetLockTimer,
      documentLockStateRef,
      setCurrentEditor,
      isLockingEnabled,
    ],
  )

  useEffect(() => {
    if (!isLockingEnabled) {
      return
    }

    if ((id || globalSlug) && shouldLockDocument && !isDocumentLockedRef.current) {
      const lockDoc = async () => {
        try {
          await lockDocument(id, collectionSlug ?? globalSlug, user)
          isDocumentLockedRef.current = true
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to lock the document', error)
        } finally {
          setShouldLockDocument(false)
        }
      }

      void lockDoc()
    }
  }, [shouldLockDocument, lockDocument, id, user, globalSlug, collectionSlug, isLockingEnabled])

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      if (!isLockingEnabled) {
        return
      }

      if ((id || globalSlug) && isDocumentLockedRef.current) {
        // Check if this user is still the current editor
        if (documentLockStateRef.current?.user?.id === user.id) {
          void unlockDocument(id, collectionSlug ?? globalSlug)

          // Reset the locked state
          isDocumentLockedRef.current = false
          documentLockStateRef.current = null
          setCurrentEditor(null)

          // Clear the lock timer
          if (lockTimer.current) {
            clearTimeout(lockTimer.current)
            lockTimer.current = null
          }
        }
      }

      setShowTakeOverModal(false)
    }
  }, [collectionSlug, globalSlug, id, unlockDocument, user.id, setCurrentEditor, isLockingEnabled])

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
          {isLockingEnabled && showLockedModal && (
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
          {isLockingEnabled && showTakeOverModal && (
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
