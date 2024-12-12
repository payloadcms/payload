'use client'
import type { FormProps } from '@payloadcms/ui'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  ClientGlobalConfig,
  ClientUser,
  Data,
  LivePreviewConfig,
} from 'payload'

import {
  DocumentControls,
  DocumentFields,
  DocumentLocked,
  DocumentTakeOver,
  Form,
  LeaveWithoutSaving,
  OperationProvider,
  SetDocumentStepNav,
  SetDocumentTitle,
  useAuth,
  useConfig,
  useDocumentDrawerContext,
  useDocumentEvents,
  useDocumentInfo,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import {
  abortAndIgnore,
  handleBackToDashboard,
  handleGoBack,
  handleTakeOver,
} from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { useLivePreviewContext } from './Context/context.js'
import { LivePreviewProvider } from './Context/index.js'
import './index.scss'
import { LivePreview } from './Preview/index.js'
import { usePopupWindow } from './usePopupWindow.js'

const baseClass = 'live-preview'

type Props = {
  readonly apiRoute: string
  readonly collectionConfig?: ClientCollectionConfig
  readonly config: ClientConfig
  readonly fields: ClientField[]
  readonly globalConfig?: ClientGlobalConfig
  readonly schemaPath: string
  readonly serverURL: string
}

const PreviewView: React.FC<Props> = ({
  collectionConfig,
  config,
  fields,
  globalConfig,
  schemaPath,
}) => {
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
    disableLeaveWithoutSaving,
    docPermissions,
    documentIsLocked,
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData,
    initialState,
    isEditing,
    isInitializing,
    lastUpdateTime,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    updateDocumentEditor,
  } = useDocumentInfo()

  const { getFormState } = useServerFunctions()

  const { onSave: onSaveFromProps } = useDocumentDrawerContext()

  const operation = id ? 'update' : 'create'

  const {
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const router = useRouter()
  const { t } = useTranslation()
  const { previewWindowType } = useLivePreviewContext()
  const { refreshCookieAsync, user } = useAuth()
  const { reportUpdate } = useDocumentEvents()

  const docConfig = collectionConfig || globalConfig

  const lockDocumentsProp = docConfig?.lockDocuments !== undefined ? docConfig?.lockDocuments : true
  const isLockingEnabled = lockDocumentsProp !== false

  const lockDurationDefault = 300 // Default 5 minutes in seconds
  const lockDuration =
    typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
  const lockDurationInMilliseconds = lockDuration * 1000

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] = useState(false)
  const [showTakeOverModal, setShowTakeOverModal] = useState(false)

  const formStateAbortControllerRef = useRef(new AbortController())

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

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        id,
        entitySlug: collectionSlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      // Unlock the document after save
      if ((id || globalSlug) && isLockingEnabled) {
        setDocumentIsLocked(false)
      }

      if (typeof onSaveFromProps === 'function') {
        void onSaveFromProps({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [
      collectionSlug,
      globalSlug,
      id,
      isLockingEnabled,
      onSaveFromProps,
      refreshCookieAsync,
      reportUpdate,
      setDocumentIsLocked,
      user,
      userSlug,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      abortAndIgnore(formStateAbortControllerRef.current)

      const controller = new AbortController()
      formStateAbortControllerRef.current = controller

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
        returnLockStatus: isLockingEnabled ? true : false,
        schemaPath,
        signal: controller.signal,
        updateLastEdited,
      })

      setDocumentIsLocked(true)

      if (isLockingEnabled) {
        const previousOwnerId =
          typeof documentLockStateRef.current?.user === 'object'
            ? documentLockStateRef.current?.user?.id
            : documentLockStateRef.current?.user

        if (lockedState) {
          const lockedUserID =
            typeof lockedState.user === 'string' || typeof lockedState.user === 'number'
              ? lockedState.user
              : lockedState.user.id

          if (!documentLockStateRef.current || lockedUserID !== previousOwnerId) {
            if (previousOwnerId === user.id && lockedUserID !== user.id) {
              setShowTakeOverModal(true)
              documentLockStateRef.current.hasShownLockedModal = true
            }

            documentLockStateRef.current = documentLockStateRef.current = {
              hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal || false,
              isLocked: true,
              user: lockedState.user as ClientUser,
            }

            setCurrentEditor(lockedState.user as ClientUser)
          }
        }
      }

      return state
    },
    [
      editSessionStartTime,
      isLockingEnabled,
      getDocPreferences,
      getFormState,
      id,
      collectionSlug,
      docPermissions,
      globalSlug,
      operation,
      schemaPath,
      setDocumentIsLocked,
      user?.id,
      setCurrentEditor,
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
    return () => {
      abortAndIgnore(formStateAbortControllerRef.current)
    }
  })

  const shouldShowDocumentLockedModal =
    documentIsLocked &&
    currentEditor &&
    (typeof currentEditor === 'object'
      ? currentEditor.id !== user?.id
      : currentEditor !== user?.id) &&
    !isReadOnlyForIncomingUser &&
    !showTakeOverModal &&
    // eslint-disable-next-line react-compiler/react-compiler
    !documentLockStateRef.current?.hasShownLockedModal &&
    !isLockExpired

  return (
    <OperationProvider operation={operation}>
      <Form
        action={action}
        className={`${baseClass}__form`}
        disabled={isReadOnlyForIncomingUser || !hasSavePermission}
        initialState={initialState}
        isInitializing={isInitializing}
        method={id ? 'PATCH' : 'POST'}
        onChange={[onChange]}
        onSuccess={onSave}
      >
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
        {((collectionConfig &&
          !(collectionConfig.versions?.drafts && collectionConfig.versions?.drafts?.autosave)) ||
          (globalConfig &&
            !(globalConfig.versions?.drafts && globalConfig.versions?.drafts?.autosave))) &&
          !disableLeaveWithoutSaving &&
          !isReadOnlyForIncomingUser && <LeaveWithoutSaving />}
        <SetDocumentStepNav
          collectionSlug={collectionSlug}
          globalLabel={globalConfig?.label}
          globalSlug={globalSlug}
          id={id}
          pluralLabel={collectionConfig ? collectionConfig?.labels?.plural : undefined}
          useAsTitle={collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined}
          view={t('general:livePreview')}
        />
        <SetDocumentTitle
          collectionConfig={collectionConfig}
          config={config}
          fallback={id?.toString() || ''}
          globalConfig={globalConfig}
        />
        <DocumentControls
          apiURL={apiURL}
          data={initialData}
          disableActions={disableActions}
          hasPublishPermission={hasPublishPermission}
          hasSavePermission={hasSavePermission}
          id={id}
          isEditing={isEditing}
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
          slug={collectionConfig?.slug || globalConfig?.slug}
          user={currentEditor}
        />
        <div
          className={[baseClass, previewWindowType === 'popup' && `${baseClass}--detached`]
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
              BeforeFields={BeforeFields}
              docPermissions={docPermissions}
              fields={fields}
              forceSidebarWrap
              readOnly={isReadOnlyForIncomingUser || !hasSavePermission}
              schemaPathSegments={[collectionSlug || globalSlug]}
            />
            {AfterDocument}
          </div>
          <LivePreview collectionSlug={collectionSlug} globalSlug={globalSlug} />
        </div>
      </Form>
    </OperationProvider>
  )
}

export const LivePreviewClient: React.FC<{
  readonly breakpoints: LivePreviewConfig['breakpoints']
  readonly initialData: Data
  readonly url: string
}> = (props) => {
  const { breakpoints, url } = props
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const {
    config,
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const schemaPath = collectionSlug || globalSlug

  return (
    <Fragment>
      <LivePreviewProvider
        breakpoints={breakpoints}
        fieldSchema={collectionConfig?.fields || globalConfig?.fields}
        isPopupOpen={isPopupOpen}
        openPopupWindow={openPopupWindow}
        popupRef={popupRef}
        url={url}
      >
        <PreviewView
          apiRoute={apiRoute}
          collectionConfig={collectionConfig}
          config={config}
          fields={(collectionConfig || globalConfig)?.fields}
          globalConfig={globalConfig}
          schemaPath={schemaPath}
          serverURL={serverURL}
        />
      </LivePreviewProvider>
    </Fragment>
  )
}
