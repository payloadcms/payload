import type { PayloadRequest } from '../../../types/index.js'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { retryConcurrentShadowOperation } from '../../../branching/createShadowRow.js'
import {
  beginDeferredCleanupScope,
  deferredCleanupScopeContextKey,
  scheduleAfterTransactionCommit,
} from '../../../utilities/transactionCallbacks.js'
import {
  commitOperationRetryRequestContext,
  createOperationRetryRequest,
  shouldRetryOperationRequest,
} from './createOperationRetryRequest.js'

const temporaryDirectories: string[] = []

const createRequest = ({ tempFilePath }: { tempFilePath?: string } = {}): PayloadRequest => {
  const payload = {
    config: { i18n: { fallbackLanguage: 'en' } },
    db: { defaultIDType: 'text' },
    find: vi.fn(),
  }
  const file = {
    data: Buffer.from('primary file'),
    mimetype: 'text/plain',
    name: 'primary.txt',
    size: 12,
    tempFilePath,
  }

  return {
    context: { nested: { value: 'original' } },
    file,
    files: {
      multiple: [
        {
          data: Buffer.from('array file'),
          mimetype: 'text/plain',
          name: 'array.txt',
          size: 10,
        },
      ],
      single: {
        data: Buffer.from('single file'),
        mimetype: 'text/plain',
        name: 'single.txt',
        size: 11,
      },
    },
    headers: new Headers(),
    i18n: { t: vi.fn() },
    payload,
    payloadAPI: 'local',
    query: { nested: { value: 'original' } },
    routeParams: { nested: { value: 'original' } },
    t: vi.fn(),
    user: null,
  } as unknown as PayloadRequest
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { force: true, recursive: true })),
  )
})

describe('createOperationRetryRequest', () => {
  it('should not run a second attempt when request isolation is unsafe', async () => {
    const transientError = Object.assign(new Error('Transient transaction error'), {
      errorLabels: ['TransientTransactionError'],
    })
    let attempts = 0

    await expect(
      retryConcurrentShadowOperation({
        operation: () => {
          attempts += 1

          throw transientError
        },
        shouldRetry: ({ error }) =>
          shouldRetryOperationRequest({
            didOwnAttemptTransaction: true,
            didReachFinalCommit: true,
            error,
            hasCallerTransaction: false,
            isRetrySafe: false,
          }),
        waitForRetry: async () => undefined,
      }),
    ).rejects.toBe(transientError)

    expect(attempts).toBe(1)
  })

  it('should preserve a disabled fallback locale across retry attempts', async () => {
    const originalReq = createRequest()

    Object.assign(originalReq.payload.config, {
      localization: {
        defaultLocale: 'en',
        fallback: true,
        localeCodes: ['en', 'es'],
        locales: [],
      },
    })
    originalReq.fallbackLocale = false
    originalReq.locale = 'es'

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    expect(retryReq.locale).toBe('es')
    expect(retryReq.fallbackLocale).toBe(false)
  })

  it('should ignore an active deferred-cleanup scope when checking retry safety', async () => {
    const originalReq = createRequest()

    await beginDeferredCleanupScope({ req: originalReq })
    await scheduleAfterTransactionCommit({ callback: async () => undefined, req: originalReq })

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(true)
    expect(retryRequest.req).not.toBe(originalReq)
    expect(retryRequest.req.context[deferredCleanupScopeContextKey]).toBeUndefined()
  })

  it('should isolate failed attempt context and every accepted file container', async () => {
    const originalReq = createRequest()
    const attemptEvents: string[] = []
    const syncedDocsSet = new Set<string>()
    const originalNestedContext = originalReq.context.nested

    originalReq.context.attemptEvents = attemptEvents
    originalReq.context.syncedDocsSet = syncedDocsSet

    const firstAttempt = await createOperationRetryRequest({ req: originalReq })
    const firstAttemptReq = firstAttempt.req

    expect(firstAttempt.isRetrySafe).toBe(true)
    expect(firstAttemptReq).not.toBe(originalReq)
    ;(firstAttemptReq.context.nested as { value: string }).value = 'mutated'
    ;(firstAttemptReq.context.attemptEvents as string[]).push('failed attempt')
    ;(firstAttemptReq.context.syncedDocsSet as Set<string>).add('failed-document')
    ;(firstAttemptReq.query.nested as { value: string }).value = 'mutated'
    ;(firstAttemptReq.routeParams!.nested as { value: string }).value = 'mutated'
    firstAttemptReq.file!.data[0] = 0
    ;(firstAttemptReq.files!.single as NonNullable<PayloadRequest['file']>).data[0] = 0
    ;(firstAttemptReq.files!.multiple as NonNullable<PayloadRequest['file']>[])[0]!.data[0] = 0

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    expect(originalReq.context.nested).toEqual({ value: 'original' })
    expect(attemptEvents).toEqual([])
    expect(syncedDocsSet).toEqual(new Set())
    expect(secondAttemptReq.context.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.context.nested).not.toBe(originalReq.context.nested)
    expect(secondAttemptReq.context.attemptEvents).toEqual([])
    expect(secondAttemptReq.context.syncedDocsSet).toEqual(new Set())
    expect(secondAttemptReq.query.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.routeParams!.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.file!.data).toEqual(Buffer.from('primary file'))
    expect((secondAttemptReq.files!.single as NonNullable<PayloadRequest['file']>).data).toEqual(
      Buffer.from('single file'),
    )
    expect(
      (secondAttemptReq.files!.multiple as NonNullable<PayloadRequest['file']>[])[0]!.data,
    ).toEqual(Buffer.from('array file'))
    expect(secondAttemptReq.payloadDataLoader).not.toBe(firstAttemptReq.payloadDataLoader)
    ;(secondAttemptReq.context.nested as { value: string }).value = 'successful'
    ;(secondAttemptReq.context.attemptEvents as string[]).push('successful attempt')
    ;(secondAttemptReq.context.syncedDocsSet as Set<string>).add('successful-document')
    commitOperationRetryRequestContext({ req: secondAttemptReq })

    expect(originalReq.context.nested).toBe(originalNestedContext)
    expect(originalReq.context.nested).toEqual({ value: 'successful' })
    expect(originalReq.context.attemptEvents).toBe(attemptEvents)
    expect(attemptEvents).toEqual(['successful attempt'])
    expect(originalReq.context.syncedDocsSet).toBe(syncedDocsSet)
    expect(syncedDocsSet).toEqual(new Set(['successful-document']))
  })

  it('should give every attempt a separate temp file while preserving the original source', async () => {
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-retry-source-'))
    const sourcePath = path.join(temporaryDirectory, 'source.txt')

    temporaryDirectories.push(temporaryDirectory)
    await fs.writeFile(sourcePath, 'temp file contents')

    const originalReq = createRequest({ tempFilePath: sourcePath })
    const { req: firstAttemptReq } = await createOperationRetryRequest({
      copyFileTempPath: true,
      req: originalReq,
    })

    expect(firstAttemptReq.file!.tempFilePath).not.toBe(sourcePath)
    expect(await fs.readFile(firstAttemptReq.file!.tempFilePath!, 'utf8')).toBe(
      'temp file contents',
    )

    await fs.rm(firstAttemptReq.file!.tempFilePath!)

    const { req: secondAttemptReq } = await createOperationRetryRequest({
      copyFileTempPath: true,
      req: originalReq,
    })

    expect(secondAttemptReq.file!.tempFilePath).not.toBe(sourcePath)
    expect(secondAttemptReq.file!.tempFilePath).not.toBe(firstAttemptReq.file!.tempFilePath)
    expect(await fs.readFile(secondAttemptReq.file!.tempFilePath!, 'utf8')).toBe(
      'temp file contents',
    )
    expect(await fs.readFile(sourcePath, 'utf8')).toBe('temp file contents')
  })

  it('should preserve context aliases when a successful attempt changes a value type', async () => {
    const originalReq = createRequest()
    const originalContextValue = originalReq.context.nested

    originalReq.context.alias = originalContextValue

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })
    const replacementValue = ['successful attempt']

    retryReq.context.nested = replacementValue
    retryReq.context.alias = replacementValue
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.nested).toEqual(['successful attempt'])
    expect(originalReq.context.alias).toBe(originalReq.context.nested)
  })

  it('should preserve a successful same-type replacement without restoring its old alias', async () => {
    const originalReq = createRequest()
    const sharedValue = { value: 'original' }

    originalReq.context.first = sharedValue
    originalReq.context.second = sharedValue

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    retryReq.context.first = { value: 'replacement' }
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.first).toEqual({ value: 'replacement' })
    expect(originalReq.context.first).not.toBe(sharedValue)
    expect(originalReq.context.second).toBe(sharedValue)
    expect(sharedValue).toEqual({ value: 'original' })
  })

  it('should isolate authentication inputs from failed attempts', async () => {
    const originalReq = createRequest()

    originalReq.headers.set('x-access-scope', 'editor')
    originalReq.user = {
      id: 'user-id',
      collection: 'users',
      roles: ['editor'],
    } as NonNullable<PayloadRequest['user']>

    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    firstAttemptReq.headers.set('x-access-scope', 'admin')
    ;(firstAttemptReq.user as NonNullable<PayloadRequest['user']> & { roles: string[] }).roles.push(
      'admin',
    )

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    expect(originalReq.headers.get('x-access-scope')).toBe('editor')
    expect(secondAttemptReq.headers.get('x-access-scope')).toBe('editor')
    expect(
      (originalReq.user as NonNullable<PayloadRequest['user']> & { roles: string[] }).roles,
    ).toEqual(['editor'])
    expect(
      (secondAttemptReq.user as NonNullable<PayloadRequest['user']> & { roles: string[] }).roles,
    ).toEqual(['editor'])
  })

  it('should isolate failed response header mutations and commit the successful attempt', async () => {
    const originalReq = createRequest()
    const originalResponseHeaders = new Headers({ 'x-attempt': 'original' })

    originalReq.responseHeaders = originalResponseHeaders

    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    firstAttemptReq.responseHeaders!.set('x-attempt', 'failed')
    firstAttemptReq.responseHeaders!.set('x-failed-only', 'true')

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    expect(originalReq.responseHeaders).toBe(originalResponseHeaders)
    expect(originalResponseHeaders.get('x-attempt')).toBe('original')
    expect(originalResponseHeaders.has('x-failed-only')).toBe(false)
    expect(secondAttemptReq.responseHeaders?.get('x-attempt')).toBe('original')
    expect(secondAttemptReq.responseHeaders?.has('x-failed-only')).toBe(false)

    secondAttemptReq.responseHeaders!.set('x-attempt', 'successful')
    commitOperationRetryRequestContext({ req: secondAttemptReq })

    expect(originalReq.responseHeaders).toBe(originalResponseHeaders)
    expect(originalResponseHeaders.get('x-attempt')).toBe('successful')
  })

  it('should commit a new response header value with its cross-field alias', async () => {
    const originalReq = createRequest()
    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    firstAttemptReq.responseHeaders = new Headers({ 'x-attempt': 'failed' })

    expect(originalReq.responseHeaders).toBeUndefined()

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })
    const successfulResponseHeaders = new Headers({ 'x-attempt': 'successful' })

    secondAttemptReq.responseHeaders = successfulResponseHeaders
    secondAttemptReq.context.responseHeadersAlias = successfulResponseHeaders
    commitOperationRetryRequestContext({ req: secondAttemptReq })

    expect(originalReq.responseHeaders?.get('x-attempt')).toBe('successful')
    expect(originalReq.context.responseHeadersAlias).toBe(originalReq.responseHeaders)
  })

  it('should apply a successful response header deletion without leaking a failed deletion', async () => {
    const originalReq = createRequest()
    const originalResponseHeaders = new Headers({ 'x-attempt': 'original' })

    originalReq.responseHeaders = originalResponseHeaders

    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    delete firstAttemptReq.responseHeaders

    expect(originalReq.responseHeaders).toBe(originalResponseHeaders)

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    delete secondAttemptReq.responseHeaders
    commitOperationRetryRequestContext({ req: secondAttemptReq })

    expect(originalReq.responseHeaders).toBeUndefined()
  })

  it('should isolate mutable custom context values from failed attempts', async () => {
    class MutableContextValue {
      values: string[] = []
    }

    const originalReq = createRequest()
    const contextValue = new MutableContextValue()

    originalReq.context.custom = contextValue

    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    ;(firstAttemptReq.context.custom as MutableContextValue).values.push('failed attempt')

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })

    expect(contextValue.values).toEqual([])
    expect(secondAttemptReq.context.custom).toBeInstanceOf(MutableContextValue)
    expect((secondAttemptReq.context.custom as MutableContextValue).values).toEqual([])
  })

  it('should disable retries for custom context values with prototype methods', async () => {
    class MutableCounter {
      value = 0

      increment(): void {
        this.value += 1
      }
    }

    const originalReq = createRequest()
    const counter = new MutableCounter()

    originalReq.context.counter = counter

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for custom context values with own arrow methods', async () => {
    class MutableCounter {
      value = 0

      increment = (): void => {
        this.value += 1
      }
    }

    const originalReq = createRequest()
    const counter = new MutableCounter()

    originalReq.context.counter = counter

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for context values with own accessors', async () => {
    const originalReq = createRequest()
    const accessorState = { value: 'opaque' }
    const contextValue = {}

    Object.defineProperty(contextValue, 'value', {
      configurable: true,
      enumerable: true,
      get: () => accessorState.value,
      set: (value: string) => {
        accessorState.value = value
      },
    })
    originalReq.context.custom = contextValue

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries without invoking accessors on the request context', async () => {
    const originalReq = createRequest()
    const readOpaqueValue = vi.fn(() => 'opaque')

    Object.defineProperty(originalReq.context, 'opaqueValue', {
      configurable: true,
      enumerable: true,
      get: readOpaqueValue,
    })

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(readOpaqueValue).not.toHaveBeenCalled()
    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for private-field context instances', async () => {
    class OpaqueContextValue {
      #value = 'opaque'

      getValue(): string {
        return this.#value
      }
    }

    const originalReq = createRequest()
    const contextValue = new OpaqueContextValue()

    originalReq.context.custom = contextValue
    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for WeakMap-backed context instances', async () => {
    const privateValues = new WeakMap<object, string>()

    class WeakMapBackedContextValue {
      constructor() {
        privateValues.set(this, 'opaque')
      }

      getValue(): string | undefined {
        return privateValues.get(this)
      }
    }

    const originalReq = createRequest()
    const contextValue = new WeakMapBackedContextValue()

    originalReq.context.custom = contextValue

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for explicit SharedArrayBuffer context values', async () => {
    const originalReq = createRequest()
    const sharedBuffer = new SharedArrayBuffer(4)

    originalReq.context.sharedBuffer = sharedBuffer

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for overlapping SharedArrayBuffer-backed views', async () => {
    const originalReq = createRequest()
    const sharedBuffer = new SharedArrayBuffer(5)
    const firstView = new Uint8Array(sharedBuffer, 0, 3)
    const secondView = new Uint8Array(sharedBuffer, 1, 3)

    originalReq.context.firstView = firstView
    originalReq.context.secondView = secondView

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for subclasses of supported built-ins', async () => {
    class CustomMap extends Map<string, string> {
      getEntryCount(): number {
        return this.size
      }
    }

    const originalReq = createRequest()

    originalReq.context.customMap = new CustomMap([['key', 'value']])

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for supported built-ins with own function properties', async () => {
    const originalReq = createRequest()
    const contextMap = new Map() as Map<unknown, unknown> & { reset: () => void }

    contextMap.reset = () => contextMap.clear()
    originalReq.context.contextMap = contextMap

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries without invoking own accessors on supported built-ins', async () => {
    const originalReq = createRequest()
    const contextDate = new Date()
    const readOpaqueValue = vi.fn(() => 'opaque')

    Object.defineProperty(contextDate, 'opaqueValue', {
      configurable: true,
      enumerable: true,
      get: readOpaqueValue,
    })
    originalReq.context.contextDate = contextDate

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(readOpaqueValue).not.toHaveBeenCalled()
    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for supported built-ins with custom enumerable properties', async () => {
    const originalReq = createRequest()
    const contextSet = new Set() as Set<unknown> & { label: string }

    contextSet.label = 'custom state'
    originalReq.context.contextSet = contextSet

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should keep normal array entries and view indices retry-safe', async () => {
    const originalReq = createRequest()

    originalReq.context.values = ['first', 'second']
    originalReq.context.bytes = new Uint8Array([1, 2])

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(true)
    expect(retryRequest.req).not.toBe(originalReq)
    expect(retryRequest.req.context.values).toEqual(['first', 'second'])
    expect(retryRequest.req.context.bytes).toEqual(new Uint8Array([1, 2]))
  })

  it('should disable retries for arrays that are too large for a bounded property scan', async () => {
    const originalReq = createRequest()

    originalReq.context.values = new Array(65_537).fill('value')

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for views that are too large for a bounded property scan', async () => {
    const originalReq = createRequest()

    originalReq.context.bytes = new Uint8Array(65_537)

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for arrays with custom properties', async () => {
    const originalReq = createRequest()
    const values = ['value'] as string[] & { label: string }

    values.label = 'array state'
    originalReq.context.values = values

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should disable retries for views with custom properties', async () => {
    const originalReq = createRequest()
    const bytes = new Uint8Array([1, 2]) as Uint8Array & { label: string }

    bytes.label = 'view state'
    originalReq.context.bytes = bytes

    const retryRequest = await createOperationRetryRequest({ req: originalReq })

    expect(retryRequest.isRetrySafe).toBe(false)
    expect(retryRequest.req).toBe(originalReq)
  })

  it('should commit successful context without mutating frozen values', async () => {
    const originalReq = createRequest()
    const frozenValue = Object.freeze({ value: 'unchanged' })
    const frozenArray = Object.freeze(['unchanged'])

    originalReq.context.frozen = frozenValue
    originalReq.context.frozenArray = frozenArray

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    expect(() => commitOperationRetryRequestContext({ req: retryReq })).not.toThrow()
    expect(originalReq.context.frozen).toBe(frozenValue)
    expect(originalReq.context.frozenArray).toBe(frozenArray)
    expect(Object.isFrozen(originalReq.context.frozen)).toBe(true)
    expect(Object.isFrozen(originalReq.context.frozenArray)).toBe(true)
  })

  it('should apply successful nested frozen and sealed context changes', async () => {
    const originalReq = createRequest()
    const frozenNestedValue = { count: 0 }
    const frozenValue = Object.freeze({ nested: frozenNestedValue })
    const sealedValue = Object.seal({ count: 0 })

    originalReq.context.frozen = frozenValue
    originalReq.context.sealed = sealedValue

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    ;(retryReq.context.frozen as typeof frozenValue).nested.count = 1
    ;(retryReq.context.sealed as typeof sealedValue).count = 2
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.frozen).toBe(frozenValue)
    expect(frozenValue.nested).toBe(frozenNestedValue)
    expect(frozenNestedValue.count).toBe(1)
    expect(originalReq.context.sealed).toBe(sealedValue)
    expect(sealedValue.count).toBe(2)
  })

  it('should preserve typed-array identity and shared backing storage', async () => {
    const originalReq = createRequest()
    const buffer = new ArrayBuffer(4)
    const bytes = new Uint8Array(buffer)
    const viewsByIdentity = new Map([[bytes, 'current']])

    originalReq.context.buffer = buffer
    originalReq.context.bytes = bytes
    originalReq.context.viewsByIdentity = viewsByIdentity

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })
    const retryBuffer = retryReq.context.buffer as ArrayBuffer
    const retryBytes = retryReq.context.bytes as Uint8Array

    expect(retryBuffer).not.toBe(buffer)
    expect(retryBytes).not.toBe(bytes)
    expect(retryBytes.buffer).toBe(retryBuffer)

    retryBytes[0] = 7
    expect(bytes[0]).toBe(0)
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.buffer).toBe(buffer)
    expect(originalReq.context.bytes).toBe(bytes)
    expect(bytes.buffer).toBe(buffer)
    expect(bytes[0]).toBe(7)
    expect(originalReq.context.viewsByIdentity).toBe(viewsByIdentity)
    expect(viewsByIdentity.has(bytes)).toBe(true)
  })

  it('should synchronize an explicit ArrayBuffer after a view that shares it', async () => {
    const originalReq = createRequest()
    const buffer = new ArrayBuffer(4)
    const bytes = new Uint8Array(buffer, 0, 2)

    originalReq.context.bytes = bytes
    originalReq.context.buffer = buffer

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })
    const retryBytes = retryReq.context.bytes as Uint8Array
    const retryBuffer = retryReq.context.buffer as ArrayBuffer

    retryBytes[0] = 7
    new Uint8Array(retryBuffer)[3] = 9
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.bytes).toBe(bytes)
    expect(originalReq.context.buffer).toBe(buffer)
    expect([...new Uint8Array(buffer)]).toEqual([7, 0, 0, 9])
  })

  it('should preserve overlapping Buffer views while applying successful changes', async () => {
    const originalReq = createRequest()
    const backingBuffer = Buffer.from([0, 1, 2, 3, 4])
    const firstView = backingBuffer.subarray(0, 3)
    const secondView = backingBuffer.subarray(1, 4)

    originalReq.context.firstView = firstView
    originalReq.context.secondView = secondView

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })
    const retryFirstView = retryReq.context.firstView as Buffer
    const retrySecondView = retryReq.context.secondView as Buffer

    expect(retryFirstView).not.toBe(firstView)
    expect(retrySecondView).not.toBe(secondView)

    retryFirstView[1] = 9
    backingBuffer[4] = 8

    expect(retrySecondView[0]).toBe(9)
    expect(backingBuffer).toEqual(Buffer.from([0, 1, 2, 3, 8]))

    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.firstView).toBe(firstView)
    expect(originalReq.context.secondView).toBe(secondView)
    expect(firstView).toEqual(Buffer.from([0, 9, 2]))
    expect(secondView).toEqual(Buffer.from([9, 2, 3]))
    expect(backingBuffer).toEqual(Buffer.from([0, 9, 2, 3, 8]))
  })

  it('should preserve map and set member identity while applying successful changes', async () => {
    const originalReq = createRequest()
    const mapKey = { state: 'original' }
    const mapValue = { count: 0 }
    const setMember = { state: 'original' }
    const contextMap = new Map([[mapKey, mapValue]])
    const contextSet = new Set([setMember])

    originalReq.context.contextMap = contextMap
    originalReq.context.contextSet = contextSet
    originalReq.context.mapKeyAlias = mapKey
    originalReq.context.setMemberAlias = setMember

    const { req: firstAttemptReq } = await createOperationRetryRequest({ req: originalReq })
    const [[firstAttemptMapKey, firstAttemptMapValue]] = firstAttemptReq.context.contextMap as Map<
      typeof mapKey,
      typeof mapValue
    >
    const [firstAttemptSetMember] = firstAttemptReq.context.contextSet as Set<typeof setMember>

    firstAttemptMapKey.state = 'failed'
    firstAttemptMapValue.count = 1
    firstAttemptSetMember.state = 'failed'

    const { req: secondAttemptReq } = await createOperationRetryRequest({ req: originalReq })
    const [[secondAttemptMapKey, secondAttemptMapValue]] = secondAttemptReq.context
      .contextMap as Map<typeof mapKey, typeof mapValue>
    const [secondAttemptSetMember] = secondAttemptReq.context.contextSet as Set<typeof setMember>

    expect(mapKey.state).toBe('original')
    expect(mapValue.count).toBe(0)
    expect(setMember.state).toBe('original')

    secondAttemptMapKey.state = 'successful'
    secondAttemptMapValue.count = 2
    secondAttemptSetMember.state = 'successful'
    commitOperationRetryRequestContext({ req: secondAttemptReq })

    expect(originalReq.context.contextMap).toBe(contextMap)
    expect(contextMap.has(mapKey)).toBe(true)
    expect(contextMap.get(mapKey)).toBe(mapValue)
    expect(mapKey.state).toBe('successful')
    expect(mapValue.count).toBe(2)
    expect(originalReq.context.contextSet).toBe(contextSet)
    expect(contextSet.has(setMember)).toBe(true)
    expect(setMember.state).toBe('successful')
    expect(originalReq.context.mapKeyAlias).toBe(mapKey)
    expect(originalReq.context.setMemberAlias).toBe(setMember)
  })

  it('should preserve aliases across request fields and new context containers', async () => {
    const originalReq = createRequest()
    const user = {
      id: 'user-id',
      collection: 'users',
      roles: ['editor'],
    } as NonNullable<PayloadRequest['user']> & { roles: string[] }

    originalReq.user = user
    originalReq.context.currentUser = user
    originalReq.context.usersByIdentity = new Map([[user, 'current']])

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    expect(retryReq.context.currentUser).toBe(retryReq.user)
    expect(
      (retryReq.context.usersByIdentity as Map<PayloadRequest['user'], string>).has(retryReq.user),
    ).toBe(true)

    retryReq.context.newContainer = new Set([retryReq.user])
    commitOperationRetryRequestContext({ req: retryReq })

    expect(originalReq.context.currentUser).toBe(user)
    expect(
      (originalReq.context.usersByIdentity as Map<PayloadRequest['user'], string>).has(user),
    ).toBe(true)
    expect((originalReq.context.newContainer as Set<PayloadRequest['user']>).has(user)).toBe(true)
  })

  it('should apply successful user context deletions without removing internal state', async () => {
    const originalReq = createRequest()
    const internalState = { callbacks: [] }

    originalReq.context.flag = 'remove me'
    originalReq.context._payloadDeferredCleanupScope = internalState

    const { req: retryReq } = await createOperationRetryRequest({ req: originalReq })

    delete retryReq.context.flag
    commitOperationRetryRequestContext({ req: retryReq })

    expect(Object.hasOwn(originalReq.context, 'flag')).toBe(false)
    expect(originalReq.context._payloadDeferredCleanupScope).toBe(internalState)
  })
})
