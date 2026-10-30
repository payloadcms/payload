'use client'

import type { SanitizedDocumentPermissions } from 'payload'

import {
  DocumentInfoProvider,
  useAuth,
  useConfig,
  useDocumentInfo,
  useLocale,
  useRouter,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import { StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { autosavePostsSlug, draftPostsSlug, permissionSettingsSlug } from '../../slugs.js'

type Refresh = ReturnType<typeof useDocumentInfo>['getDocPermissions']
const initialPermissions: SanitizedDocumentPermissions = { fields: true }
const initialData = { title: 'Permission lifecycle' }
const initialState = {}

export function PermissionRequests() {
  const [scope, setScope] = useState('initial')
  const [isMounted, setIsMounted] = useState(true)
  const [completed, setCompleted] = useState<string[]>([])
  const [instance, setInstance] = useState('')
  const retainedRefresh = useRef<Refresh>(null)
  const router = useRouter()
  const { user } = useAuth()
  const locale = useLocale()
  const { config } = useConfig()
  const onComplete = useCallback(({ title }: { title: string }) => {
    setCompleted((previous) => [...previous, title])
  }, [])
  const onRetain = useCallback(({ refresh }: { refresh: Refresh }) => {
    retainedRefresh.current = refresh
  }, [])

  useEffect(() => {
    setInstance(crypto.randomUUID())
  }, [])

  return (
    <>
      <button onClick={() => setScope('document')} type="button">
        Change document
      </button>
      <button onClick={() => setScope('collection')} type="button">
        Change collection
      </button>
      <button onClick={() => setScope('global')} type="button">
        Change global
      </button>
      <button
        onClick={() =>
          router.replace(
            formatAdminURL({
              adminRoute: config.routes.admin,
              path: `/permission-requests${qs.stringify({ locale: 'fr' }, { addQueryPrefix: true })}`,
            }),
          )
        }
        type="button"
      >
        Change locale
      </button>
      <button onClick={() => setIsMounted((mounted) => !mounted)} type="button">
        {isMounted ? 'Unmount document' : 'Mount document'}
      </button>
      <button
        onClick={() =>
          void retainedRefresh
            .current?.({ doc: { title: 'retained' } })
            .then(() => onComplete({ title: 'retained' }))
        }
        type="button"
      >
        Refresh previous document
      </button>
      <output aria-label="Completed permission refreshes">{completed.join(', ')}</output>
      <output aria-label="Provider instance">{instance}</output>
      <output aria-label="Document scope">{`${scope}:${locale?.code}`}</output>
      {isMounted && (
        <StrictMode>
          <DocumentInfoProvider
            collectionSlug={
              scope === 'global'
                ? undefined
                : scope === 'collection'
                  ? autosavePostsSlug
                  : draftPostsSlug
            }
            currentEditor={user!}
            docPermissions={initialPermissions}
            globalSlug={scope === 'global' ? permissionSettingsSlug : undefined}
            hasPublishedDoc={false}
            hasPublishPermission={false}
            hasSavePermission={false}
            id={scope === 'document' ? 'document-2' : scope === 'global' ? undefined : 'document-1'}
            initialData={initialData}
            initialState={initialState}
            isLocked={false}
            lastUpdateTime={0}
            mostRecentVersionIsAutosaved={false}
            unpublishedVersionCount={0}
            versionCount={0}
          >
            <PermissionControls
              key={`${scope}:${locale?.code}`}
              onComplete={onComplete}
              onRetain={onRetain}
              scope={`${scope}:${locale?.code}`}
            />
          </DocumentInfoProvider>
        </StrictMode>
      )}
    </>
  )
}

function PermissionControls({
  onComplete,
  onRetain,
  scope,
}: {
  onComplete: (args: { title: string }) => void
  onRetain: (args: { refresh: Refresh }) => void
  scope: string
}) {
  const { getDocPermissions, hasPublishPermission, hasSavePermission } = useDocumentInfo()
  const isCurrent = useRef(true)
  const sequence = useRef(0)

  useLayoutEffect(() => {
    const title = `mounted-${scope}`

    void getDocPermissions({ doc: { title } }).then(() => onComplete({ title }))
  }, [getDocPermissions, onComplete, scope])

  return (
    <>
      <button
        onClick={() => {
          const title = `refresh-${++sequence.current}`

          void getDocPermissions({ doc: { title } }, () => isCurrent.current).then(() =>
            onComplete({ title }),
          )
        }}
        type="button"
      >
        Refresh permissions
      </button>
      <button
        onClick={() => {
          isCurrent.current = false
        }}
        type="button"
      >
        Invalidate refresh
      </button>
      <button onClick={() => onRetain({ refresh: getDocPermissions })} type="button">
        Retain refresh callback
      </button>
      <button disabled={!hasSavePermission} type="button">
        Save document
      </button>
      <button disabled={!hasPublishPermission} type="button">
        Publish document
      </button>
    </>
  )
}
