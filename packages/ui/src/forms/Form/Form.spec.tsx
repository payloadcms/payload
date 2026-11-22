import type { FormState } from 'payload'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Form, useForm } from './index.js'

const mocks = vi.hoisted(() => ({
  getFormState: vi.fn(),
}))

vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ refreshCookie: vi.fn(), user: { id: 'test-user' } }),
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    id: 'doc-1',
    collectionSlug: 'example-collection',
    docConfig: {},
    docPermissions: { fields: true },
    documentLockState: { current: null },
    getDocPermissions: async () => ({ fields: true }),
    getDocPreferences: async () => ({}),
    isTrashed: false,
    setDocumentIsLocked: vi.fn(),
    setCurrentEditor: vi.fn(),
    setIsStale: vi.fn(),
    setLastUpdateTime: vi.fn(),
  }),
}))

vi.mock('../../providers/FormErrorHandler/index.js', () => ({
  useFormErrorHandler: () => undefined,
}))

vi.mock('../../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: 'en' }),
}))

vi.mock('../../providers/Operation/index.js', () => ({
  useOperation: () => 'update',
}))

vi.mock('../../providers/RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: (fn: () => void) => fn() }),
}))

vi.mock('../../providers/RouterAdapter/index.js', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ getFormState: mocks.getFormState }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))

vi.mock('../../providers/UploadHandlers/index.js', () => ({
  useUploadHandlers: () => ({ getUploadHandler: () => undefined }),
}))

vi.mock('../../providers/UploadSessions/index.js', () => ({
  UploadContinuesInBackgroundError: class UploadContinuesInBackgroundError extends Error {},
  useOptionalUploadSessions: () => undefined,
}))

type FormControls = {
  dispatchFields: (action: any) => void
  setModified: (modified: boolean) => void
}

const controls: Partial<FormControls> = {}

const Harness = () => {
  const context = useForm()
  controls.dispatchFields = context.dispatchFields
  controls.setModified = context.setModified

  return null
}

const initialState: FormState = {
  distance: {
    initialValue: '',
    passesCondition: true,
    valid: true,
    value: '',
  },
  showKm: {
    initialValue: '',
    passesCondition: false,
    valid: true,
    value: '',
  },
  unit: {
    initialValue: null,
    passesCondition: true,
    valid: true,
    value: null,
  },
}

/** Mimics the server: conditions are evaluated from the form state sent by the client. */
const buildServerState = (formState: FormState): FormState => ({
  distance: {
    ...formState.distance,
    passesCondition: true,
  },
  showKm: {
    ...formState.showKm,
    passesCondition: formState.unit?.value === 'km',
  },
  unit: {
    ...formState.unit,
    passesCondition: true,
  },
})

/**
 * Every request stays pending until the test resolves it through the returned release functions.
 * Requests are handled one at a time by the form's queue, so releases resolve in call order.
 */
const holdResponses = (): Array<() => void> => {
  const releases: Array<() => void> = []

  mocks.getFormState.mockImplementation((args) => {
    const state = buildServerState(args.formState)

    return new Promise((resolve) => {
      releases.push(() => resolve({ state }))
    })
  })

  return releases
}

test('sends another refresh when a change is made while a refresh answer is pending', async () => {
  const releases = holdResponses()

  await render(
    <Form action={async () => {}} initialState={initialState} schemaPath="example-collection">
      <Harness />
    </Form>,
  )

  // First change: 250 ms later the debounced effect queues a refresh.
  controls.setModified!(true)
  controls.dispatchFields!({ type: 'UPDATE', path: 'distance', value: '1000' })

  await vi.waitFor(() => expect(mocks.getFormState).toHaveBeenCalledTimes(1))
  expect(mocks.getFormState.mock.calls[0][0].formState.unit.value).toBe(null)

  // Second change while the first answer is still pending.
  controls.dispatchFields!({ type: 'UPDATE', path: 'unit', value: 'km' })

  // The pending answer arrives within the 250 ms debounce window of the second change.
  releases[0]!()

  // The second change has not been sent yet, so the debounced effect must see a
  // difference between the merged state and the unsent change and queue one more refresh.
  await vi.waitFor(() => expect(mocks.getFormState).toHaveBeenCalledTimes(2), { timeout: 3000 })
  expect(mocks.getFormState.mock.calls[1][0].formState.unit.value).toBe('km')

  releases[1]!()

  // Once the follow-up answer is applied, no further refreshes are queued.
  await new Promise((resolve) => setTimeout(resolve, 700))
  expect(mocks.getFormState).toHaveBeenCalledTimes(2)
})

test('does not queue another refresh when no change races the pending answer', async () => {
  const releases = holdResponses()

  await render(
    <Form action={async () => {}} initialState={initialState} schemaPath="example-collection">
      <Harness />
    </Form>,
  )

  controls.setModified!(true)
  controls.dispatchFields!({ type: 'UPDATE', path: 'distance', value: '1000' })

  await vi.waitFor(() => expect(mocks.getFormState).toHaveBeenCalledTimes(1))

  // No local change was made while the request was pending, so applying the answer
  // must settle the form without another refresh.
  releases[0]!()

  await new Promise((resolve) => setTimeout(resolve, 700))
  expect(mocks.getFormState).toHaveBeenCalledTimes(1)
})
