'use client'
import type { FormProps } from '@payloadcms/ui'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  ClientGlobalConfig,
  ClientUser,
  Data,
  DocumentSlots,
  FormState,
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
  useEditDepth,
  useRouteTransition,
  useServerFunctions,
  useTranslation,
  useUploadEdits,
} from '@payloadcms/ui'
import {
  abortAndIgnore,
  handleAbortRef,
  handleBackToDashboard,
  handleGoBack,
  handleTakeOver,
} from '@payloadcms/ui/shared'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { useLivePreviewContext } from './Context/context.js'
import './index.scss'
import { LivePreviewProvider } from './Context/index.js'
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
} & DocumentSlots

const getAbsoluteUrl = (url) => {
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

const PreviewView: React.FC<Props> = ({
  collectionConfig,
  config,
  Description,
  fields,
  globalConfig,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
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
    getDocPermissions,
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialData,
    initialState,
    isEditing,
    isInitializing,
    lastUpdateTime,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    updateDocumentEditor,
    updateSavedDocumentData,
  } = useDocumentInfo()

  const { onSave: onSaveFromContext } = useDocumentDrawerContext()

  const operation = id ? 'update' : 'create'

  const {
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const router = useRouter()
  const params = useSearchParams()
  const locale = params.get('locale')
  const { t } = useTranslation()
  const { previewWindowType } = useLivePreviewContext()
  const { refreshCookieAsync, user } = useAuth()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()
  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()

  const docConfig = collectionConfig || globalConfig

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const depth = useEditDepth()

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

  const abortOnChangeRef = useRef<AbortController>(null)
  const abortOnSaveRef = useRef<AbortController>(null)

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
    async (json): Promise<FormState> => {
      const controller = handleAbortRef(abortOnSaveRef)

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

      incrementVersionCount()

      if (typeof updateSavedDocumentData === 'function') {
        void updateSavedDocumentData(json?.doc || {})
      }

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
          data: json?.doc || json?.result,
          docPermissions,
          docPreferences,
          globalSlug,
          operation,
          renderAllFields: true,
          returnLockStatus: false,
          schemaPath: entitySlug,
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
      adminRoute,
      collectionSlug,
      depth,
      docPermissions,
      entitySlug,
      getDocPermissions,
      getDocPreferences,
      getFormState,
      globalSlug,
      id,
      incrementVersionCount,
      isEditing,
      isLockingEnabled,
      locale,
      onSaveFromContext,
      operation,
      refreshCookieAsync,
      reportUpdate,
      resetUploadEdits,
      router,
      setDocumentIsLocked,
      updateSavedDocumentData,
      startRouteTransition,
      user,
      userSlug,
      autosaveEnabled,
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
        returnLockStatus: isLockingEnabled ? true : false,
        schemaPath,
        signal: controller.signal,
        skipValidation: !submitted,
        updateLastEdited,
      })

      setDocumentIsLocked(true)

      if (isLockingEnabled) {
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

            documentLockStateRef.current = documentLockStateRef.current = {
              hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal || false,
              isLocked: true,
              user: lockedState.user as ClientUser,
            }

            setCurrentEditor(lockedState.user as ClientUser)
          }
        }
      }

      abortOnChangeRef.current = null

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

      const documentID = id || globalSlug

      // Routes where we do NOT want to unlock the document
      const stayWithinDocumentPaths = ['preview', 'api', 'versions']

      const isStayingWithinDocument = stayWithinDocumentPaths.some((path) =>
        currentPath.includes(path),
      )

      // Unlock the document only if we're actually navigating away from the document
      if (documentID && documentIsLocked && !isStayingWithinDocument) {
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
    const abortOnChange = abortOnChangeRef.current
    const abortOnSave = abortOnSaveRef.current

    return () => {
      abortAndIgnore(abortOnChange)
      abortAndIgnore(abortOnSave)
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
        {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && <LeaveWithoutSaving />}
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
          customComponents={{
            PreviewButton,
            PublishButton,
            SaveButton,
            SaveDraftButton,
          }}
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
              Description={Description}
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

export const LivePreviewClient: React.FC<
  {
    readonly breakpoints: LivePreviewConfig['breakpoints']
    readonly initialData: Data
    readonly url: string
  } & DocumentSlots
> = (props) => {
  const { breakpoints, url: incomingUrl } = props
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const {
    config,
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const url =
    incomingUrl.startsWith('http://') || incomingUrl.startsWith('https://')
      ? incomingUrl
      : getAbsoluteUrl(incomingUrl)

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  const collectionConfig = getEntityConfig({ collectionSlug })

  const globalConfig = getEntityConfig({ globalSlug })

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
          Description={props.Description}
          fields={(collectionConfig || globalConfig)?.fields}
          globalConfig={globalConfig}
          PreviewButton={props.PreviewButton}
          PublishButton={props.PublishButton}
          SaveButton={props.SaveButton}
          SaveDraftButton={props.SaveDraftButton}
          schemaPath={schemaPath}
          serverURL={serverURL}
          Upload={props.Upload}
        />
      </LivePreviewProvider>
    </Fragment>
  )
}
