import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { PreferencesProvider, usePreferences } from './index.js'

vi.stubGlobal('process', { env: {} })

const mocks = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('../Auth/index.js', () => ({ useAuth: () => ({ user: { id: 'user' } }) }))
vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
}))
vi.mock('../Translation/index.js', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }))
vi.mock('../../utilities/api.js', () => ({ requests: { post: mocks.post } }))

test('should keep all merged callers pending until the shared write completes', async () => {
  let preferences: ReturnType<typeof usePreferences>
  let finishWrite: (response: Response) => void
  const persisted = new Promise<Response>((resolve) => {
    finishWrite = resolve
  })

  mocks.post.mockReset().mockReturnValue(persisted)

  function Consumer() {
    preferences = usePreferences()
    return null
  }

  await render(
    <PreferencesProvider>
      <Consumer />
    </PreferencesProvider>,
  )
  preferences!.syncPreference('view', {})

  const settled = vi.fn()
  const first = preferences!.setPreference('view', { first: true }, true).then(settled)
  const second = preferences!.setPreference('view', { second: true }, true).then(settled)

  await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce())
  expect(settled).not.toHaveBeenCalled()
  expect(JSON.parse(mocks.post.mock.calls[0][1].body).value).toEqual({ first: true, second: true })

  finishWrite!(new Response(null, { status: 200 }))
  await Promise.all([first, second])
  expect(settled).toHaveBeenCalledTimes(2)
})

test('should reject all merged callers when persistence fails', async () => {
  let preferences: ReturnType<typeof usePreferences>
  let rejectWrite: (error: Error) => void
  const persisted = new Promise<Response>((_resolve, reject) => {
    rejectWrite = reject
  })

  mocks.post.mockReset().mockReturnValue(persisted)

  function Consumer() {
    preferences = usePreferences()
    return null
  }

  await render(
    <PreferencesProvider>
      <Consumer />
    </PreferencesProvider>,
  )
  preferences!.syncPreference('view', {})

  const first = preferences!.setPreference('view', { first: true }, true)
  const second = preferences!.setPreference('view', { second: true }, true)
  const results = Promise.allSettled([first, second])

  await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce())
  const error = new Error('write failed')

  rejectWrite!(error)
  expect(await results).toEqual([
    { status: 'rejected', reason: error },
    { status: 'rejected', reason: error },
  ])
})

test('should await an identical value while its write is in progress', async () => {
  let preferences: ReturnType<typeof usePreferences>
  let finishWrite: (response: Response) => void
  const persisted = new Promise<Response>((resolve) => {
    finishWrite = resolve
  })

  mocks.post.mockReset().mockReturnValue(persisted)

  function Consumer() {
    preferences = usePreferences()
    return null
  }

  await render(
    <PreferencesProvider>
      <Consumer />
    </PreferencesProvider>,
  )
  preferences!.syncPreference('view', {})

  const first = preferences!.setPreference('view', { selected: true }, true)

  await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce())
  const settled = vi.fn()
  const second = preferences!.setPreference('view', { selected: true }, true).then(settled)

  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(settled).not.toHaveBeenCalled()
  finishWrite!(new Response(null, { status: 200 }))
  await Promise.all([first, second])
  expect(mocks.post).toHaveBeenCalledOnce()
})

test.each([{ selected: true }, true])(
  'should reject an identical-value caller when its in-flight write fails (%j)',
  async (value) => {
    let preferences: ReturnType<typeof usePreferences>
    let rejectWrite: (error: Error) => void
    const persisted = new Promise<Response>((_resolve, reject) => {
      rejectWrite = reject
    })

    mocks.post.mockReset().mockReturnValue(persisted)

    function Consumer() {
      preferences = usePreferences()
      return null
    }

    await render(
      <PreferencesProvider>
        <Consumer />
      </PreferencesProvider>,
    )
    preferences!.syncPreference('view', null)

    const first = preferences!.setPreference('view', value, true)

    await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce())
    const second = preferences!.setPreference('view', value, true)
    const results = Promise.allSettled([first, second])
    const error = new Error('write failed')

    rejectWrite!(error)
    expect(await results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error },
    ])
    expect(mocks.post).toHaveBeenCalledOnce()

    preferences!.syncPreference('view', { refreshed: true })
    expect(await preferences!.getPreference('view')).toEqual({ refreshed: true })
  },
)

test.each([{ selected: true }, 'grid'])(
  'should await an identical merged value while a non-merged write is pending (%j)',
  async (value) => {
    let preferences: ReturnType<typeof usePreferences>
    let finishWrite: (response: Response) => void
    const persisted = new Promise<Response>((resolve) => {
      finishWrite = resolve
    })

    mocks.post.mockReset().mockReturnValue(persisted)

    function Consumer() {
      preferences = usePreferences()
      return null
    }

    await render(
      <PreferencesProvider>
        <Consumer />
      </PreferencesProvider>,
    )

    const first = preferences!.setPreference('view', value)
    const settled = vi.fn()
    const second = preferences!.setPreference('view', value, true).then(settled)

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(settled).not.toHaveBeenCalled()

    finishWrite!(new Response(null, { status: 200 }))
    await Promise.all([first, second])
    expect(settled).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledOnce()
  },
)

test.each([{ selected: true }, 'grid'])(
  'should reject an identical merged value when a non-merged write fails (%j)',
  async (value) => {
    let preferences: ReturnType<typeof usePreferences>
    let rejectWrite: (error: Error) => void
    const persisted = new Promise<Response>((_resolve, reject) => {
      rejectWrite = reject
    })

    mocks.post.mockReset().mockReturnValue(persisted)

    function Consumer() {
      preferences = usePreferences()
      return null
    }

    await render(
      <PreferencesProvider>
        <Consumer />
      </PreferencesProvider>,
    )

    const first = preferences!.setPreference('view', value)
    const second = preferences!.setPreference('view', value, true)
    const results = Promise.allSettled([first, second])
    const error = new Error('write failed')

    rejectWrite!(error)
    expect(await results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error },
    ])
    expect(mocks.post).toHaveBeenCalledOnce()

    preferences!.syncPreference('view', { refreshed: true })
    expect(await preferences!.getPreference('view')).toEqual({ refreshed: true })
  },
)

test('should ignore stale hydration until all queued merged writes finish', async () => {
  let preferences: ReturnType<typeof usePreferences>
  let finishFirstWrite: (response: Response) => void
  let finishSecondWrite: (response: Response) => void
  const firstWrite = new Promise<Response>((resolve) => {
    finishFirstWrite = resolve
  })
  const secondWrite = new Promise<Response>((resolve) => {
    finishSecondWrite = resolve
  })

  mocks.post.mockReset().mockReturnValueOnce(firstWrite).mockReturnValueOnce(secondWrite)

  function Consumer() {
    preferences = usePreferences()
    return null
  }

  await render(
    <PreferencesProvider>
      <Consumer />
    </PreferencesProvider>,
  )
  preferences!.syncPreference('view', {})

  const first = preferences!.setPreference('view', { first: true }, true)

  await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce())
  preferences!.syncPreference('view', {})

  const second = preferences!.setPreference('view', { second: true }, true)

  await vi.waitFor(async () =>
    expect(await preferences!.getPreference('view')).toEqual({ first: true, second: true }),
  )
  finishFirstWrite!(new Response(null, { status: 200 }))
  await first
  await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2))
  expect(JSON.parse(mocks.post.mock.calls[1][1].body).value).toEqual({ first: true, second: true })

  preferences!.syncPreference('view', {})
  expect(await preferences!.getPreference('view')).toEqual({ first: true, second: true })

  finishSecondWrite!(new Response(null, { status: 200 }))
  await second
  preferences!.syncPreference('view', { refreshed: true })
  expect(await preferences!.getPreference('view')).toEqual({ refreshed: true })
})

test('should reject an HTTP failure and retry the same preference value', async () => {
  let preferences: ReturnType<typeof usePreferences>
  mocks.post
    .mockReset()
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))

  function Consumer() {
    preferences = usePreferences()
    return null
  }

  await render(
    <PreferencesProvider>
      <Consumer />
    </PreferencesProvider>,
  )
  preferences!.syncPreference('view', {})

  await expect(preferences!.setPreference('view', { branch: 'feature' }, true)).rejects.toThrow(
    '500',
  )
  preferences!.syncPreference('view', {})
  await preferences!.setPreference('view', { branch: 'feature' }, true)

  expect(mocks.post).toHaveBeenCalledTimes(2)
})
