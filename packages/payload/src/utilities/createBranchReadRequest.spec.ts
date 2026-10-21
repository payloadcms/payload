import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { assertNoBranchReadMutation, createBranchReadRequest } from './createBranchReadRequest.js'
import { createPayloadRequest } from './createPayloadRequest.js'

const makePayload = () =>
  ({
    config: { admin: { user: 'users' }, i18n: { fallbackLanguage: 'en' }, localization: false },
    db: {},
  }) as Payload
const makeI18n = () => ({ t: vi.fn(), language: 'en' })

describe('trusted branch request views', () => {
  it('should forward real Request brands without consuming or cloning its body', async () => {
    const original = Object.assign(
      new Request('https://payload.test/api/posts?locale=en', {
        method: 'POST',
        headers: { authorization: 'Bearer test' },
        body: 'body',
      }),
      {
        payload: makePayload(),
        i18n: makeI18n(),
        context: { test: true },
        payloadDataLoader: { prior: true },
      },
    ) as unknown as PayloadRequest
    const payload = Object.assign(Object.create(original.payload), { db: { scoped: true } })
    const req = createBranchReadRequest({ payload, req: original, transactionID: 'snapshot' })

    expect(req).toBeInstanceOf(Request)
    Object.defineProperty(req, 'custom', { configurable: true, value: 'scoped' })
    expect(Reflect.get(req, 'custom')).toBe('scoped')
    expect(Reflect.deleteProperty(req, 'custom')).toBe(true)
    expect(Reflect.get(req, 'custom')).toBeUndefined()
    expect(req.url).toBe(original.url)
    expect(req.method).toBe('POST')
    expect(req.headers.get('authorization')).toBe('Bearer test')
    expect(req.bodyUsed).toBe(false)
    expect(original.bodyUsed).toBe(false)
    expect(req.payloadDataLoader).toBeUndefined()
    await createPayloadRequest({ payload: original.payload, req })
    expect(req.payload.db).toBe(payload.db)
    expect(req.payloadDataLoader).not.toBe(original.payloadDataLoader)
    expect(original.payloadDataLoader).toEqual({ prior: true })
    expect(original.transactionID).toBeUndefined()
    expect(await req.text()).toBe('body')
  })

  it('should keep captured original Payload arrow entrypoints in the private scoped view', async () => {
    const payload = makePayload()
    payload.find = (async ({ req }) => {
      const normalized = await createPayloadRequest({ payload, req })

      return normalized.payload.db
    }) as Payload['find']
    const original = {
      payload,
      i18n: makeI18n(),
      context: {},
      transactionID: 'caller',
      payloadDataLoader: { old: true },
    } as unknown as PayloadRequest
    const scoped = Object.assign(Object.create(payload), { db: { marker: 'scoped' } })
    const req = createBranchReadRequest({
      payload: scoped,
      req: original,
      transactionID: 'snapshot',
    })

    expect(await payload.find({ collection: 'posts', req })).toBe(scoped.db)
    expect(await req.payload.find({ collection: 'posts', req })).toBe(scoped.db)
    expect(req.payload.db).toBe(scoped.db)
    expect(Reflect.get(req.payload, '__proto__')).toBeUndefined()
    expect(Reflect.get(req.payload, 'constructor')).toBeUndefined()
    expect(Object.getPrototypeOf(req.payload)).toBeNull()
    expect(req.payload.valueOf()).toBe(req.payload)
    expect(Object.getPrototypeOf(req.payload.valueOf())).toBeNull()
    expect(original.payload).toBe(payload)
    expect(original.transactionID).toBe('caller')
    await expect(createPayloadRequest({ payload: makePayload(), req })).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
  })
  it('should isolate nested locale normalization and preserve the ultimate original Payload', async () => {
    const payload = makePayload()
    payload.config.localization = {
      defaultLocale: 'en',
      localeCodes: ['en', 'fr'],
      locales: [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'French' },
      ],
      fallback: true,
    } as never
    payload.find = (async ({ req, locale, context }) => {
      const normalized = await createPayloadRequest({ payload, req, locale, context })

      return normalized
    }) as Payload['find']
    const original = {
      payload,
      i18n: makeI18n(),
      context: { outer: true },
      locale: 'fr',
      fallbackLocale: false,
      query: { locale: 'fr' },
      transactionID: 'caller',
    } as unknown as PayloadRequest
    const scopedPayload = Object.create(payload, { db: { value: { marker: 'snapshot' } } })
    const scoped = createBranchReadRequest({
      payload: scopedPayload,
      req: original,
      transactionID: 'snapshot',
    })
    const first = (await scoped.payload.find({
      collection: 'posts',
      locale: 'en',
      context: { nested: true },
    })) as unknown as PayloadRequest
    const second = (await payload.find({
      collection: 'posts',
      req: first,
      locale: 'fr',
    })) as unknown as PayloadRequest

    expect(first.locale).toBe('en')
    expect(second.locale).toBe('fr')
    expect(first.payload.db).toBe(scopedPayload.db)
    expect(second.payload.db).toBe(scopedPayload.db)
    expect(scoped.locale).toBe('fr')
    expect(scoped.fallbackLocale).toBe(false)
    expect(scoped.context).toEqual({ outer: true })
    expect(scoped.query).toEqual({ locale: 'fr' })
    expect(scoped.payloadDataLoader).toBeUndefined()
    expect(first.payloadDataLoader).not.toBe(second.payloadDataLoader)
    expect(original.transactionID).toBe('caller')
  })
  it('should reject copied or stashed scoped capabilities instead of detaching original Payload operations', async () => {
    const payload = makePayload()
    const original = { payload, context: {}, i18n: makeI18n() } as unknown as PayloadRequest
    let isActive = true
    const assertActive = () => {
      if (!isActive)
        throw Object.assign(new Error('closed'), { code: 'branch-read-snapshot-unsupported' })
    }
    const scoped = createBranchReadRequest({
      assertActive,
      payload,
      req: original,
      transactionID: 'snapshot',
    })
    const copies = [{ ...scoped }, { payload: scoped.payload, transactionID: scoped.transactionID }]

    for (const req of copies) {
      await expect(createPayloadRequest({ payload, req })).rejects.toMatchObject({
        code: 'branch-read-snapshot-unsupported',
      })
      expect(() => assertNoBranchReadMutation({ req })).toThrowError(
        expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
      )
    }
    isActive = false
    for (const req of copies)
      await expect(createPayloadRequest({ payload, req })).rejects.toMatchObject({
        code: 'branch-read-snapshot-unsupported',
      })
    expect(original.payload).toBe(payload)
  })
  it('should admit only explicit data and reads before evaluating arbitrary backing getters', () => {
    const payload = makePayload()
    const getter = vi.fn(function () {
      return this
    })
    Object.defineProperty(payload, 'unknownAccessor', { get: getter })
    Object.defineProperty(payload, 'unknownFunction', {
      value() {
        return this
      },
    })
    const req = createBranchReadRequest({
      payload,
      req: { payload, context: {} } as PayloadRequest,
    })
    for (const property of [
      'unknownAccessor',
      'unknownFunction',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
      'sendEmail',
      'email',
      'jobs',
    ])
      expect(() => Reflect.get(req.payload, property)).toThrowError(
        expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
      )
    Object.defineProperty(payload, 'config', { get: getter })
    expect(() => req.payload.config).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
    expect(getter).not.toHaveBeenCalled()
    expect(req.payload.hasOwnProperty('db')).toBe(false)
    expect(req.payload.toString()).toBe('[object Object]')
    expect(req.payload.valueOf()).toBe(req.payload)
  })
})
