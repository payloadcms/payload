import type { SanitizedDocumentPermissions } from 'payload'

import { useLayoutEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'
import { configure } from 'vitest-browser-react/pure'

import type { GetDocPermissions } from './useGetDocPermissions.js'

import { useGetDocPermissions } from './useGetDocPermissions.js'

configure({ reactStrictMode: true })

const initialPermissions: SanitizedDocumentPermissions = { fields: true }
const grantedPermissions: SanitizedDocumentPermissions = { fields: true, update: true }
const entityPermissions = {}
const i18n = { language: 'en' }

type FixtureProps = {
  collectionSlug?: string
  editedTitle?: string
  globalSlug?: string
  id?: string
  locale?: string
}

beforeEach(() => {
  vi.stubGlobal('process', { env: {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useGetDocPermissions', () => {
  test('should refresh from a descendant layout effect during Strict Mode replay', async () => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'document-1', draftPermissions: grantedPermissions })

    response.resolve({ permissions: grantedPermissions })

    const screen = await render(<DescendantLayoutFixture />)

    await expect.element(screen.getByRole('status')).toHaveTextContent('true:true')
  })

  test('should refresh from a newly mounted descendant after the document changes', async () => {
    const createResponse = mockAccessResponses()
    const first = createResponse({ title: 'document-1', draftPermissions: initialPermissions })
    const second = createResponse({ title: 'document-2', draftPermissions: grantedPermissions })

    first.resolve({ permissions: initialPermissions })
    second.resolve({ permissions: grantedPermissions })

    const screen = await render(<DescendantLayoutFixture />)

    await expect.element(screen.getByRole('status')).toHaveTextContent('false:undefined')
    await screen.rerender(<DescendantLayoutFixture id="document-2" />)
    await expect.element(screen.getByRole('status')).toHaveTextContent('true:true')
  })

  test('should apply saved document permissions after another field edit', async () => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'saved', draftPermissions: grantedPermissions })
    const hook = await renderHook(usePermissionsFixture)
    const refresh = hook.result.current.getDocPermissions({ doc: { title: 'saved' } })

    await waitForPublishedRequest({ refresh, requested: response.requested })
    await hook.rerender({ editedTitle: 'unsaved' })
    await hook.act(async () => {
      response.resolve({ permissions: grantedPermissions })
      await refresh
    })

    expect(hook.result.current.docPermissions).toEqual({ fields: true, update: true })
    expect(hook.result.current.hasSavePermission).toBe(true)
    expect(hook.result.current.hasPublishPermission).toBe(true)
  })

  test('should keep the latest permissions when an older refresh finishes last', async () => {
    const createResponse = mockAccessResponses()
    const older = createResponse({ title: 'older', draftPermissions: initialPermissions })
    const newer = createResponse({ title: 'newer', draftPermissions: grantedPermissions })
    const hook = await renderHook(usePermissionsFixture)
    const olderRefresh = hook.result.current.getDocPermissions({ doc: { title: 'older' } })

    await waitForPublishedRequest({ refresh: olderRefresh, requested: older.requested })

    const newerRefresh = hook.result.current.getDocPermissions({ doc: { title: 'newer' } })

    await waitForPublishedRequest({ refresh: newerRefresh, requested: newer.requested })
    await hook.act(async () => {
      newer.resolve({ permissions: grantedPermissions })
      await newerRefresh
      older.resolve({ permissions: initialPermissions })
      await olderRefresh
    })

    expect(hook.result.current.docPermissions).toEqual({ fields: true, update: true })
    expect(hook.result.current.hasSavePermission).toBe(true)
    expect(hook.result.current.hasPublishPermission).toBe(true)
  })

  test.each<FixtureProps>([
    { id: 'document-2' },
    { collectionSlug: 'pages' },
    { collectionSlug: '', globalSlug: 'settings' },
    { locale: 'fr' },
  ])('should discard pending permissions after the document scope changes to %o', async (props) => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'saved', draftPermissions: grantedPermissions })
    const hook = await renderHook(usePermissionsFixture)
    const refresh = hook.result.current.getDocPermissions({ doc: { title: 'saved' } })

    await waitForPublishedRequest({ refresh, requested: response.requested })
    await hook.rerender(props)
    await hook.act(async () => {
      response.resolve({ permissions: grantedPermissions })
      await refresh
    })

    expect(hook.result.current.docPermissions).toEqual({ fields: true })
    expect(hook.result.current.hasSavePermission).toBe(false)
    expect(hook.result.current.hasPublishPermission).toBe(false)
  })

  test('should ignore a retained permissions callback from a previous document', async () => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'saved', draftPermissions: grantedPermissions })
    const hook = await renderHook(usePermissionsFixture)
    const getPreviousPermissions = hook.result.current.getDocPermissions

    response.resolve({ permissions: grantedPermissions })
    await hook.rerender({ id: 'document-2' })
    await hook.act(() => getPreviousPermissions({ doc: { title: 'saved' } }))

    expect(hook.result.current.docPermissions).toEqual({ fields: true })
    expect(hook.result.current.hasSavePermission).toBe(false)
    expect(hook.result.current.hasPublishPermission).toBe(false)
  })

  test('should avoid updating permissions after unmount', async () => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'saved', draftPermissions: grantedPermissions })
    const setDocPermissions = vi.fn()
    const setHasSavePermission = vi.fn()
    const setHasPublishPermission = vi.fn()
    const hook = await renderHook(() =>
      useGetDocPermissions({
        id: 'document-1',
        api: '/api',
        collectionSlug: 'posts',
        globalSlug: undefined,
        i18n,
        locale: 'en',
        permissions: entityPermissions,
        setDocPermissions,
        setHasPublishPermission,
        setHasSavePermission,
      }),
    )
    const refresh = hook.result.current({ doc: { title: 'saved' } })

    await waitForPublishedRequest({ refresh, requested: response.requested })
    await hook.unmount()
    response.resolve({ permissions: grantedPermissions })
    await refresh
    await hook.result.current({ doc: { title: 'saved' } })

    expect(setDocPermissions).not.toHaveBeenCalled()
    expect(setHasSavePermission).not.toHaveBeenCalled()
    expect(setHasPublishPermission).not.toHaveBeenCalled()
  })

  test('should preserve an explicit request validity predicate', async () => {
    const createResponse = mockAccessResponses()
    const response = createResponse({ title: 'saved', draftPermissions: grantedPermissions })
    const hook = await renderHook(usePermissionsFixture)
    let isCurrentRequest = true
    const refresh = hook.result.current.getDocPermissions(
      { doc: { title: 'saved' } },
      () => isCurrentRequest,
    )

    await waitForPublishedRequest({ refresh, requested: response.requested })
    isCurrentRequest = false
    await hook.act(async () => {
      response.resolve({ permissions: grantedPermissions })
      await refresh
    })

    expect(hook.result.current.docPermissions).toEqual({ fields: true })
    expect(hook.result.current.hasSavePermission).toBe(false)
    expect(hook.result.current.hasPublishPermission).toBe(false)
  })
})

function usePermissionsFixture({
  id = 'document-1',
  collectionSlug = 'posts',
  globalSlug,
  locale = 'en',
}: FixtureProps = {}) {
  const [docPermissions, setDocPermissions] = useState(initialPermissions)
  const [hasSavePermission, setHasSavePermission] = useState(false)
  const [hasPublishPermission, setHasPublishPermission] = useState(false)
  const getDocPermissions = useGetDocPermissions({
    id,
    api: '/api',
    collectionSlug,
    globalSlug,
    i18n,
    locale,
    permissions: entityPermissions,
    setDocPermissions,
    setHasPublishPermission,
    setHasSavePermission,
  })

  return { docPermissions, getDocPermissions, hasPublishPermission, hasSavePermission }
}

function mockAccessResponses() {
  const responses = new Map<
    string,
    {
      draftPermissions: SanitizedDocumentPermissions
      published: PromiseWithResolvers<Response>
      requested: PromiseWithResolvers<void>
    }
  >()

  vi.stubGlobal('fetch', async (_url: string, options: RequestInit) => {
    const data = JSON.parse(options.body as string)
    const response = responses.get(data.title)

    if (!response) {
      throw new Error(`Unexpected access request for ${data.title}`)
    }

    if (data._status === 'published') {
      response.requested.resolve()
      return response.published.promise.then((res) => res.clone())
    }

    return Response.json(response.draftPermissions)
  })

  return ({
    title,
    draftPermissions,
  }: {
    draftPermissions: SanitizedDocumentPermissions
    title: string
  }) => {
    const published = Promise.withResolvers<Response>()
    const requested = Promise.withResolvers<void>()

    responses.set(title, { draftPermissions, published, requested })

    return {
      requested: requested.promise,
      resolve: ({ permissions }: { permissions: SanitizedDocumentPermissions }) =>
        published.resolve(Response.json(permissions)),
    }
  }
}

async function waitForPublishedRequest({
  refresh,
  requested,
}: {
  refresh: Promise<void>
  requested: Promise<void>
}) {
  await Promise.race([
    requested,
    refresh.then(() => {
      throw new Error('Permissions refresh completed before requesting published access')
    }),
  ])
}

function DescendantLayoutFixture({ id = 'document-1' }: { id?: string }) {
  const { getDocPermissions, hasPublishPermission, hasSavePermission } = usePermissionsFixture({
    id,
  })

  return (
    <>
      <RefreshPermissionsOnMount getDocPermissions={getDocPermissions} key={id} title={id} />
      <output>{`${hasSavePermission}:${hasPublishPermission}`}</output>
    </>
  )
}

function RefreshPermissionsOnMount({
  getDocPermissions,
  title,
}: {
  getDocPermissions: GetDocPermissions
  title: string
}) {
  useLayoutEffect(() => {
    void getDocPermissions({ doc: { title } })
  }, [getDocPermissions, title])

  return null
}
