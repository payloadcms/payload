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
  let finishWrite: () => void
  const persisted = new Promise<void>((resolve) => {
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

  finishWrite!()
  await Promise.all([first, second])
  expect(settled).toHaveBeenCalledTimes(2)
})

test('should reject all merged callers when persistence fails', async () => {
  let preferences: ReturnType<typeof usePreferences>
  let rejectWrite: (error: Error) => void
  const persisted = new Promise<void>((_resolve, reject) => {
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
  let finishWrite: () => void
  const persisted = new Promise<void>((resolve) => {
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
  finishWrite!()
  await Promise.all([first, second])
  expect(mocks.post).toHaveBeenCalledOnce()
})
