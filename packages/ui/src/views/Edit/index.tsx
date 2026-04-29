'use client'

import type { ClientUser, DocumentViewClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import {
  formatAdminURL,
  hasAutosaveEnabled,
  isReactClientComponent,
  parsePayloadComponent,
  reduceFieldsToValues,
} from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { DecideCallTarget } from '../../forms/decideCall.js'
import type { FormProps } from '../../forms/Form/index.js'
import type { FormOnSuccess, RenderedFieldsResult } from '../../forms/Form/types.js'
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
import { decideCall } from '../../forms/decideCall.js'
import { deriveRealizedFromFormState } from '../../forms/deriveRealized.js'
import { Form } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useOptionalClientImportRegistry } from '../../providers/ClientImportRegistry/index.js'
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
import { createComponentIndexFromRefs } from '../../utilities/createComponentIndexFromRefs.js'
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
      componentRefs,
      routes: { admin: adminRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const componentIndex = useMemo(
    () => createComponentIndexFromRefs(componentRefs ?? []),
    [componentRefs],
  )

  // Optional so non-admin embeds (and tests without a registry mounted) keep
  // working — when null we fall through to the existing server-render path
  // for every dispatch target.
  const importRegistry = useOptionalClientImportRegistry()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const depth = useEditDepth()

  const router = useRouter()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()
  const { getFormState, renderFields } = useServerFunctions()
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

  // Ref (not state) so the onChange closure sees fresh values synchronously.
  // useState would lag behind: a debounced onChange firing while a previous
  // server response is still in-flight captures the stale render's value,
  // making `timeSinceLastUpdate` look ≥10s and forcing the legacy heartbeat
  // path on every keystroke.
  const editSessionStartTimeRef = useRef(Date.now())

  const saveCounterRef = useRef(0)
  const isSavingRef = useRef(false)

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

      setLastUpdateTime(new Date(updatedAt).getTime())

      isSavingRef.current = false

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
    async ({
      formState: nextFormState,
      prevFormState: prevFormStateArg,
      prevVisibility,
      submitted,
      visibility,
    }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      const currentTime = Date.now()
      const timeSinceLastUpdate = currentTime - editSessionStartTimeRef.current

      const updateLastEdited = isLockingEnabled && timeSinceLastUpdate >= 10000 // 10 seconds

      if (updateLastEdited) {
        editSessionStartTimeRef.current = currentTime
      }

      // Lock heartbeat refreshes the document lock so other users see this
      // session as active; without it, idle locks would persist after tab
      // close and block other editors. Save-time concurrency in `Save`
      // catches actual stale-data overwrites — no per-edit stale check.
      const needsLegacyServerCall = Boolean(submitted) || updateLastEdited

      if (needsLegacyServerCall) {
        const docPreferences = await getDocPreferences()

        const result = await getFormState({
          id,
          collectionSlug,
          docPermissions,
          docPreferences,
          formState: nextFormState,
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
      }

      // Phase 6: client-side dispatch decision. `decideCall` inspects the
      // structural diff and the visibility flips to determine whether any
      // server work is needed. Per-keystroke typing collapses to a no-op,
      // visibility/structural reveals route to `renderFields` (component
      // payloads only — no value/validation work). Only invoked on the
      // non-legacy path: when needsLegacyServerCall is true the structural
      // diff is discarded anyway.
      const decision = decideCall({
        index: componentIndex,
        next: {
          values: reduceFieldsToValues(nextFormState, true) as Record<string, unknown>,
          visibility: visibility ?? new Map(),
        },
        prev: {
          // First dispatch has no prev state (Form is initializing); fall back
          // to the next state so the structural diff comes up empty rather than
          // treating every initial field as newly-realized.
          values: reduceFieldsToValues(prevFormStateArg ?? nextFormState, true) as Record<
            string,
            unknown
          >,
          visibility: prevVisibility ?? new Map(),
        },
        realized: deriveRealizedFromFormState(nextFormState),
      })

      if (!decision) {
        // Per-keystroke fast path: no targets, no heartbeat — skip the
        // server entirely. The form's current state is already up to date.
        abortOnChangeRef.current = null
        return undefined
      }

      // Phase 9: split targets by component kind. Client refs mount locally
      // from the in-bundle registry — no roundtrip needed. Only server refs
      // (and unresolvable targets, defensively) hit `renderFields`. When all
      // targets are client we skip the server call entirely.
      const clientMounted: RenderedFieldsResult['rendered'] = []
      const serverRender: DecideCallTarget[] = []

      if (importRegistry) {
        await Promise.all(
          decision.targets.map(async (target) => {
            const parsed = parsePayloadComponent(target.componentPath)
            if (!parsed) {
              serverRender.push(target)
              return
            }
            const key = `${parsed.path}#${parsed.exportName}`
            if (!importRegistry.has(key)) {
              serverRender.push(target)
              return
            }
            try {
              const mod = (await importRegistry.resolve(key)) as null | Record<string, unknown>
              if (!mod) {
                serverRender.push(target)
                return
              }
              const candidate = mod[parsed.exportName] ?? mod.default
              if (!isReactClientComponent(candidate)) {
                serverRender.push(target)
                return
              }
              const Component = candidate as React.ComponentType<{
                path: string
                schemaPath: string
              }>
              clientMounted.push({
                path: target.path,
                payload: <Component path={target.path} schemaPath={target.path} />,
                slot: target.slot,
              })
            } catch {
              serverRender.push(target)
            }
          }),
        )
      } else {
        // No registry available — fall back to original behaviour: server
        // renders every target.
        for (const target of decision.targets) {
          serverRender.push(target)
        }
      }

      let serverRendered: RenderedFieldsResult['rendered'] = []
      if (serverRender.length > 0) {
        const renderResult = await renderFields({
          collectionSlug,
          documentId: id,
          globalSlug,
          render: serverRender.map(({ path, slot }) => ({ path, slot })),
          signal: controller.signal,
        })

        if (renderResult?.rendered?.length) {
          serverRendered = renderResult.rendered.map((entry) => ({
            path: entry.path,
            payload: entry.payload as React.ReactNode,
            slot: entry.slot,
          }))
        }
      }

      abortOnChangeRef.current = null

      const merged = [...clientMounted, ...serverRendered]
      if (merged.length === 0) {
        return undefined
      }

      const envelope: RenderedFieldsResult = {
        type: 'rendered-fields',
        rendered: merged,
      }
      return envelope
    },
    [
      data?.updatedAt,
      isLockingEnabled,
      getDocPreferences,
      getFormState,
      renderFields,
      componentIndex,
      importRegistry,
      id,
      collectionSlug,
      docPermissions,
      globalSlug,
      operation,
      schemaPathSegments,
      handleDocumentLocking,
      autosaveEnabled,
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
          disableSuccessStatus={!isEditing && depth < 2 && redirectAfterCreate !== false}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isDocumentForm={true}
          isInitializing={isInitializing}
          key={`${isLocked}`}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSubmit={() => {
            saveCounterRef.current += 1
            isSavingRef.current = true
          }}
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
