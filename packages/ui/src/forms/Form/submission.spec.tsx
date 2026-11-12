import type {
  ClientConfig,
  FormState,
  LinkAdapterProps,
  SelectType,
  ServerFunctionClient,
} from 'payload'
import type { ReactNode } from 'react'

import { en } from '@payloadcms/translations/languages/en'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { FormProps } from './types.js'

import { ConfigProvider } from '../../providers/Config/index.js'
import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { ServerFunctionsProvider } from '../../providers/ServerFunctions/index.js'
import { TranslationProvider } from '../../providers/Translation/index.js'
import { UploadHandlersProvider } from '../../providers/UploadHandlers/index.js'
import { useForm, useFormFields, useFormInitializing } from './context.js'
import { Form } from './index.js'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ refreshCookie: () => undefined, user: null }),
}))

vi.mock('../../utilities/api.js', () => ({ requests: { post } }))

const config = {
  admin: { routes: {}, user: 'users' },
  collections: [{ slug: 'posts', fields: [] }],
  globals: [],
  routes: { admin: '/admin', api: '/api' },
} as unknown as ClientConfig

const firstSelect = { first: true }
const secondSelect = { second: true }
const releaseRequests: (() => void)[] = []
const Link = ({ children, href }: LinkAdapterProps) => <a href={href}>{children}</a>
const routerContext = {
  Link,
  params: {},
  pathname: '/admin',
  router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
}

const TestProviders = ({
  children,
  serverFunction,
}: {
  children: ReactNode
  serverFunction: ServerFunctionClient
}) => (
  <RouterAdapterContext value={routerContext}>
    <ConfigProvider config={config}>
      <ServerFunctionsProvider serverFunction={serverFunction}>
        <TranslationProvider
          dateFNSKey="en-US"
          fallbackLang="en"
          language="en"
          languageOptions={[]}
          translations={en.translations}
        >
          <UploadHandlersProvider>{children}</UploadHandlersProvider>
        </TranslationProvider>
      </ServerFunctionsProvider>
    </ConfigProvider>
  </RouterAdapterContext>
)

const ResetControl = () => {
  const { replaceState } = useForm()

  return (
    <button
      onClick={() => replaceState({ second: { valid: true, value: 'Reset value' } })}
      type="button"
    >
      Reset form
    </button>
  )
}

const Controls = ({ skipValidation }: { skipValidation: boolean }) => {
  const { submit } = useForm()
  const isInitializing = useFormInitializing()
  const second = useFormFields(([fields]) => fields.second)
  const [isComplete, setIsComplete] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          void submit({ skipValidation }).then(() => setIsComplete(true))
        }}
        type="button"
      >
        Submit programmatically
      </button>
      <output aria-label="Initialization">{isInitializing ? 'initializing' : 'ready'}</output>
      <output aria-label="Submission">{isComplete ? 'complete' : 'waiting'}</output>
      <output aria-label="Selected field">{second?.value ?? 'missing'}</output>
      <output aria-label="Selected field error">{second?.errorMessage ?? 'none'}</output>
    </>
  )
}

const SelectForm = ({
  formProps,
  skipValidation,
}: {
  formProps: FormProps
  skipValidation: boolean
}) => {
  const [select, setSelect] = useState<FormProps['select']>(firstSelect)

  return (
    <>
      <button onClick={() => setSelect(secondSelect)} type="button">
        Select second field
      </button>
      <Form {...formProps} schemaPath="posts" select={select}>
        <Controls skipValidation={skipValidation} />
      </Form>
    </>
  )
}

afterEach(() => {
  releaseRequests.splice(0).forEach((release) => release())
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

test.each([
  ['a custom response handler', 'custom'],
  ['a local submission that skips validation', 'skip'],
  ['a rejected local beforeSubmit callback', 'reject'],
  ['a local submission that already refreshed during validation', 'validate'],
] as const)('should rebuild superseded selected fields for %s', async (_, mode) => {
  vi.stubGlobal('process', { env: { NEXT_BASE_PATH: '' } })

  const firstRequest = Promise.withResolvers<void>()
  const onChange = vi.fn()
  const onSubmit = vi.fn()
  const handleResponse = vi.fn(async (response: Response) => response.json())
  const serverFunction = vi.fn<ServerFunctionClient>(async ({ args, name }) => {
    if (name !== 'form-state') {
      throw new Error(`Unexpected server function: ${name}`)
    }

    const { formState, select } = args as { formState: FormState; select: SelectType }

    if (select.first) {
      await firstRequest.promise

      return { state: { first: { addedByServer: true, valid: true, value: 'Old selection' } } }
    }

    return {
      state: {
        second: {
          addedByServer: formState.second ? undefined : true,
          valid: true,
          value: formState.second?.value ?? 'Current selection',
        },
      },
    }
  })
  const formProps: FormProps = {
    disableSuccessStatus: true,
    onChange: [onChange],
    ...(mode === 'custom'
      ? { action: '/api/posts', handleResponse, method: 'POST' }
      : { onSubmit }),
    ...(mode === 'reject'
      ? {
          beforeSubmit: [
            async () => ({
              second: { errorMessage: 'Rejected value', valid: false, value: 'Rejected' },
            }),
          ],
        }
      : {}),
  }

  releaseRequests.push(() => firstRequest.resolve())
  post.mockImplementation(async () => Response.json({ result: 'saved' }))

  const screen = await render(
    <TestProviders serverFunction={serverFunction}>
      <SelectForm formProps={formProps} skipValidation={mode === 'skip'} />
    </TestProviders>,
  )

  await expect.poll(() => serverFunction.mock.calls.length).toBe(1)
  await screen.getByRole('button', { name: 'Select second field' }).click()
  await expect
    .element(screen.getByRole('status', { name: 'Initialization' }))
    .toHaveTextContent('initializing')
  await screen.getByRole('button', { name: 'Submit programmatically' }).click()

  firstRequest.resolve()

  await expect
    .element(screen.getByRole('status', { name: 'Submission' }))
    .toHaveTextContent('complete')
  await expect
    .element(screen.getByRole('status', { name: 'Initialization' }))
    .toHaveTextContent('ready')
  await expect
    .element(screen.getByRole('status', { name: 'Selected field' }))
    .toHaveTextContent(mode === 'reject' ? 'Rejected' : 'Current selection')
  expect(serverFunction).toHaveBeenCalledTimes(2)
  expect(serverFunction.mock.calls[1]?.[0].args.select).toEqual(secondSelect)
  expect(onChange).toHaveBeenCalledOnce()

  if (mode === 'custom') {
    expect(handleResponse).toHaveResolvedWith({ result: 'saved' })
  } else if (mode === 'reject') {
    await expect
      .element(screen.getByRole('status', { name: 'Selected field error' }))
      .toHaveTextContent('Rejected value')
    expect(onSubmit).not.toHaveBeenCalled()
  } else {
    expect(onSubmit).toHaveBeenCalledOnce()
  }
})

test('should discard a custom response when the form resets during its completion refresh', async () => {
  vi.stubGlobal('process', { env: { NEXT_BASE_PATH: '' } })

  const refresh = Promise.withResolvers<void>()
  const handleResponse = vi.fn(async (response: Response) => response.json())
  const serverFunction = vi.fn<ServerFunctionClient>(async () => {
    await refresh.promise

    return { state: { second: { addedByServer: true, valid: true, value: 'Stale value' } } }
  })

  releaseRequests.push(() => refresh.resolve())
  post.mockImplementation(async () => Response.json({ result: 'saved' }))

  const screen = await render(
    <TestProviders serverFunction={serverFunction}>
      <Form
        action="/api/posts"
        disableSuccessStatus
        handleResponse={handleResponse}
        method="POST"
        schemaPath="posts"
      >
        <Controls skipValidation={false} />
        <ResetControl />
      </Form>
    </TestProviders>,
  )

  await screen.getByRole('button', { name: 'Submit programmatically' }).click()
  await expect.poll(() => serverFunction.mock.calls.length).toBe(1)
  await screen.getByRole('button', { name: 'Reset form' }).click()

  refresh.resolve()

  await expect
    .element(screen.getByRole('status', { name: 'Submission' }))
    .toHaveTextContent('complete')
  await expect
    .element(screen.getByRole('status', { name: 'Selected field' }))
    .toHaveTextContent('Reset value')
  expect(handleResponse).not.toHaveBeenCalled()
})
