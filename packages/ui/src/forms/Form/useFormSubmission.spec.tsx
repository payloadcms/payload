import { useEffect } from 'react'
import { toast } from 'sonner'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Context, FormProps } from './types.js'

import { useQueue } from '../../hooks/useQueue.js'
import { requests } from '../../utilities/api.js'
import { useFormSubmission } from './useFormSubmission.js'

const { error, success } = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))

vi.mock('sonner', () => ({
  toast: {
    dismiss: vi.fn(),
    promise: vi.fn((promise: Promise<unknown>) => {
      void promise.then(success, error)
      return 1
    }),
  },
}))
vi.mock('../../providers/DocumentInfo/index.js', () => ({ useDocumentInfo: () => ({}) }))
vi.mock('../../providers/FormErrorHandler/index.js', () => ({
  useFormErrorHandler: () => undefined,
}))
vi.mock('../../providers/RouterAdapter/index.js', () => ({ useRouter: () => ({}) }))
vi.mock('../../providers/RouteTransition/index.js', () => ({ useRouteTransition: () => ({}) }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))
vi.mock('../../utilities/api.js', () => ({ requests: { post: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

test('should preserve the success toast and completed response when onSuccess unmounts the form', async () => {
  const form = await mountSubmission({ onSuccess: async () => form.screen.unmount() })
  const result = form.submit()
  const response = Response.json({ message: 'Saved' }, { status: 201 })

  form.response.resolve(response)
  await expect(result).resolves.toEqual({ res: response })
  expect(success).toHaveBeenCalledWith('Saved')
  expect(toast.dismiss).not.toHaveBeenCalled()
})

test('should preserve a custom response toast after unmounting', async () => {
  const form = await mountSubmission({
    handleResponse: async (_response, successToast) => {
      successToast('Handled response')
      await form.screen.unmount()
    },
  })
  const result = form.submit()

  form.response.resolve(Response.json({}))
  await result
  expect(success).toHaveBeenCalledWith('Handled response')
  expect(toast.dismiss).not.toHaveBeenCalled()
})

test('should ignore a response when the form unmounts before it arrives', async () => {
  const onSuccess = vi.fn()
  const form = await mountSubmission({ onSuccess })
  const result = form.submit()

  await expect.poll(() => requests.post).toHaveBeenCalled()
  await form.screen.unmount()
  form.response.resolve(Response.json({ message: 'Canceled response' }))
  await expect(result).resolves.toBeUndefined()
  expect(onSuccess).not.toHaveBeenCalled()
  expect(success).not.toHaveBeenCalled()
  expect(error).not.toHaveBeenCalled()
  expect(toast.dismiss).toHaveBeenCalledWith(1)
})

test('should dismiss the submitting toast when onSuccess resets and unmounts the form', async () => {
  const form = await mountSubmission({
    onSuccess: async () => {
      form.reset()
      await form.screen.unmount()
    },
  })
  const result = form.submit()

  form.response.resolve(Response.json({ message: 'Canceled response' }))
  await expect(result).resolves.toBeUndefined()
  expect(success).not.toHaveBeenCalled()
  expect(toast.dismiss).toHaveBeenCalledWith(1)
})

async function mountSubmission(props: Pick<FormProps, 'handleResponse' | 'onSuccess'> = {}) {
  const response = Promise.withResolvers<Response>()
  const requestScopeRef = { current: {} }
  const contextRef = {
    current: {
      createFormData: async () => new FormData(),
      fields: { title: { value: 'Initial value' } },
      validateForm: async () => true,
    } as Context,
  }
  let queue: ReturnType<typeof useQueue>
  let submission: ReturnType<typeof useFormSubmission>
  const reset = () => {
    requestScopeRef.current = {}
    queue.resetQueue()
  }
  const args: Parameters<typeof useFormSubmission>[0] = {
    contextRef,
    dispatchFields: vi.fn(),
    formRef: { current: null },
    prevFormState: { current: contextRef.current.fields },
    props: { action: '/submit', method: 'POST', ...props },
    requestScopeRef,
    scheduleRequest: (task) => queue.scheduleTask(task),
    setIsValid: vi.fn(),
  }

  vi.mocked(requests.post).mockImplementation(() => response.promise)

  function Probe() {
    queue = useQueue()
    submission = useFormSubmission(args)
    useEffect(() => () => reset(), [])

    return null
  }

  const screen = await render(<Probe />)

  return { reset, response, screen, submit: () => submission.submit() }
}
