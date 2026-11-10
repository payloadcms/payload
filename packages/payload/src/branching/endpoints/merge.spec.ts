import type { PayloadRequest } from '../../types/index.js'

import { initI18n } from '@payloadcms/translations'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { expect, test, vi } from 'vitest'

import { Forbidden, ValidationError } from '../../errors/index.js'
import { mergeBranch } from '../merge.js'
import { setMergeValidationErrorContext } from '../merge/validationErrors.js'
import { mergeBranchHandler } from './merge.js'

vi.mock('../merge.js', () => ({ getBranchesLocalAPI: vi.fn(), mergeBranch: vi.fn() }))
vi.mock('../resolveBranch.js', () => ({
  isolateBranchState: ({ req }: { req: PayloadRequest }) => req,
}))

test('should finish a streamed merge after consumer cancellation without mutating caller transaction', async () => {
  let resume!: () => void
  const paused = new Promise<void>((resolve) => {
    resume = resolve
  })
  let complete!: () => void
  const completed = new Promise<void>((resolve) => {
    complete = resolve
  })
  const result = {
    blocked: [],
    canMerge: true,
    mergeable: [],
    merged: [],
    validationErrors: [],
    warnings: [],
  }
  const logger = { error: vi.fn() }
  const req = {
    data: { stream: true },
    headers: new Headers(),
    routeParams: { id: 'branch-id' },
    payload: { config: { cors: [] }, findByID: vi.fn(async () => ({ name: 'campaign' })), logger },
    transactionID: 'caller',
    user: { id: 'user' },
  } as unknown as PayloadRequest

  vi.mocked(mergeBranch).mockImplementation(async (_payload, options) => {
    expect(options.req?.transactionID).toBeUndefined()
    await paused
    await options.onProgress?.({ index: 1 } as never, options.req!)
    complete()
    return result
  })

  const response = await mergeBranchHandler(req)

  await response.body!.cancel()
  resume()
  await completed
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(req.transactionID).toBe('caller')
  expect(logger.error).not.toHaveBeenCalled()
})

const createRequest = async ({ isStream }: { isStream: boolean }): Promise<PayloadRequest> => {
  const i18n = await initI18n({
    config: { fallbackLanguage: 'en', supportedLanguages: { en, fr } },
    context: 'api',
    language: 'fr',
  })

  return {
    context: {},
    data: { stream: isStream },
    headers: new Headers(),
    i18n,
    payload: {
      config: { cors: [], debug: true, hooks: {}, loggingLevels: {} },
      findByID: vi.fn(async () => ({ name: 'campaign' })),
      logger: { error: vi.fn() },
    },
    routeParams: { id: 'branch-id' },
    t: i18n.t,
    user: { id: 'user' },
  } as unknown as PayloadRequest
}

const readFailure = async ({ response, isStream }: { response: Response; isStream: boolean }) => {
  if (!isStream) {
    return response.json()
  }

  const events = (await response.text())
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  return events.at(-1)
}

test.each([true, false])(
  'should retain write-time field errors and source context (stream: %s)',
  async (isStream) => {
    const req = await createRequest({ isStream })
    const error = new ValidationError({
      collection: 'posts',
      errors: [
        {
          label: { en: 'Slug', fr: 'Identifiant' },
          locale: 'de',
          message: 'Value must be unique',
          path: 'slug',
        },
      ],
    })

    setMergeValidationErrorContext({
      change: {
        changeID: 'change',
        collectionSlug: 'posts',
        docID: 12,
      },
      error,
    })
    vi.mocked(mergeBranch).mockRejectedValueOnce(error)

    const response = await mergeBranchHandler(req)
    const failure = await readFailure({ isStream, response })

    expect(failure).toMatchObject({
      type: 'error',
      message: req.t('error:correctInvalidFields'),
      validationErrors: [
        {
          changeID: 'change',
          collectionSlug: 'posts',
          docID: 12,
          locale: 'de',
          message: 'Value must be unique',
          path: 'slug',
        },
      ],
    })
    if (!isStream) {
      expect(response.status).toBe(400)
      expect(failure.errors[0].data.errors[0].message).toBe('Value must be unique')
    }
  },
)

test.each([true, false])(
  'should hide unexpected errors even with debug enabled (stream: %s)',
  async (isStream) => {
    const req = await createRequest({ isStream })
    const error = new Error('SQL failure containing private query parameters')

    vi.mocked(mergeBranch).mockRejectedValueOnce(error)

    const response = await mergeBranchHandler(req)
    const failure = await readFailure({ isStream, response })

    expect(failure).toMatchObject({ type: 'error', message: req.t('error:unknown') })
    expect(JSON.stringify(failure)).not.toContain(error.message)
    expect(failure).not.toHaveProperty('stack')
    expect(req.payload.logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: error }))
    if (!isStream) {
      expect(response.status).toBe(500)
    }
  },
)

test.each([true, false])('should preserve public access errors (stream: %s)', async (isStream) => {
  const req = await createRequest({ isStream })
  const error = new Forbidden(req.t)

  vi.mocked(mergeBranch).mockRejectedValueOnce(error)

  const response = await mergeBranchHandler(req)
  const failure = await readFailure({ isStream, response })

  expect(failure).toMatchObject({ type: 'error', message: error.message })
  expect(failure.validationErrors).toBeUndefined()
  if (!isStream) {
    expect(response.status).toBe(403)
  }
})

test('should not attribute errors from a nested operation to the source document', async () => {
  const req = await createRequest({ isStream: true })
  const error = new ValidationError({
    collection: 'audit',
    errors: [{ message: 'Required', path: 'title' }],
  })

  setMergeValidationErrorContext({
    change: {
      changeID: 'change',
      collectionSlug: 'posts',
      docID: 12,
    },
    error,
  })
  vi.mocked(mergeBranch).mockRejectedValueOnce(error)

  const response = await mergeBranchHandler(req)
  const failure = await readFailure({ isStream: true, response })

  expect(failure.validationErrors).toEqual([
    { collectionSlug: 'audit', message: 'Required', path: 'title' },
  ])
})

test('should retain a nested document ID rather than the source document ID', async () => {
  const req = await createRequest({ isStream: true })
  const error = new ValidationError({
    id: 99,
    collection: 'posts',
    errors: [{ message: 'Required', path: 'title' }],
  })

  setMergeValidationErrorContext({
    change: { changeID: 'change', collectionSlug: 'posts', docID: 12 },
    error,
  })
  vi.mocked(mergeBranch).mockRejectedValueOnce(error)

  const response = await mergeBranchHandler(req)
  const failure = await readFailure({ isStream: true, response })

  expect(failure.validationErrors).toEqual([
    { collectionSlug: 'posts', docID: 99, message: 'Required', path: 'title' },
  ])
})
