import {
  createBranchReadRequest,
  isBranchReadRequest,
  forkBranchReadRequest,
  resolveBranchReadPayload,
} from '../../../utilities/createBranchReadRequest.js'
import {
  createBranchReadIntent,
  getBranchReadIntent,
  assertBranchReadOperationRequest,
} from './branchReadContext.js'
import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it } from 'vitest'

import {
  consumeBranchOriginalPolicy,
  createBranchOriginalPolicy,
  readBranchOriginalGrant,
} from './branchOriginalPolicy.js'
import {
  createSelectedBranchRequest,
  forkSelectedBranchRequest,
  getSelectedBranch,
} from './selectedBranchContext.js'

const request = () =>
  Object.assign(new Request('https://example.test/content'), {
    context: { source: true },
    query: { locale: 'fr' },
    routeParams: {},
    locale: 'fr',
    fallbackLocale: false,
    transactionID: 'caller',
  }) as unknown as PayloadRequest

describe('trusted working selections', () => {
  it('should preserve native Request brands and isolate source properties', async () => {
    const source = request()
    const selected = createSelectedBranchRequest({ branchID: 'staging', req: source })
    selected.locale = 'en'
    selected.context.changed = true
    expect(selected.url).toBe(source.url)
    expect(await selected.text()).toBe('')
    expect(source.locale).toBe('fr')
    expect(source.context).toEqual({ source: true })
    expect(getSelectedBranch({ req: { ...selected } })).toBeUndefined()
  })

  it('should delete and redefine transaction identity on the destination only', () => {
    const source = request()
    const selected = createSelectedBranchRequest({ branchID: 'staging', req: source })
    delete selected.transactionID
    expect(selected.transactionID).toBeUndefined()
    expect(source.transactionID).toBe('caller')
    Object.defineProperty(selected, 'transactionID', { value: 'replacement', configurable: true })
    expect(selected.transactionID).toBe('replacement')
    expect(source.transactionID).toBe('caller')
    expect(forkSelectedBranchRequest({ req: selected }).transactionID).toBe('replacement')
  })

  it('should reject main as a working-save destination', () => {
    expect(() => createSelectedBranchRequest({ branchID: 'main', req: request() })).toThrow(
      'publication intent',
    )
  })
})

describe('composite selected read request capabilities', () => {
  it('should preserve both trusted registrations and revoke every derived native view', async () => {
    const source = request()
    const payload = { collections: {}, config: {}, db: {} } as PayloadRequest['payload']
    source.payload = payload
    let isActive = true
    const scoped = createBranchReadRequest({
      payload,
      req: source,
      assertActive: () => {
        if (!isActive) throw new Error('expired read frame')
      },
    })
    const selected = createSelectedBranchRequest({ branchID: 'staging', req: scoped })
    const read = createBranchReadIntent({
      branchID: 'main',
      req: forkSelectedBranchRequest({ req: selected }) as PayloadRequest,
    })
    expect(isBranchReadRequest({ req: read })).toBe(true)
    expect(getSelectedBranch({ req: read })).toBe('staging')
    expect(getBranchReadIntent({ req: read })).toBe('main')
    expect(read.url).toBe(source.url)
    expect(await read.text()).toBe('')
    expect(resolveBranchReadPayload({ payload, req: read })).toBe(read.payload)
    expect(() => {
      read.payload = payload
    }).toThrow('read-only scoped Payload')
    isActive = false
    expect(() => forkBranchReadRequest({ req: read })).toThrow('expired read frame')
    expect(source.transactionID).toBe('caller')
  })

  it('should leave ordinary outer operation requests writable while selecting main reads', () => {
    const source = request()
    const payload = { config: {}, collections: {}, db: {} } as PayloadRequest['payload']
    source.payload = payload
    const read = createBranchReadIntent({ branchID: 'main', req: source })
    expect(read.payload).toBe(payload)
    expect(getSelectedBranch({ req: read })).toBeUndefined()
    read.locale = 'en'
    expect(source.locale).toBe('fr')
  })

  it('should reject request copies and entity changes that drop the incoming read intent', () => {
    const source = request()
    const read = createBranchReadIntent({ branchID: 'main', req: source })
    expect(() =>
      assertBranchReadOperationRequest({
        source: read,
        target: { ...read },
        sourceCollection: 'posts',
        targetCollection: 'posts',
      }),
    ).toThrow('registered request')
    expect(() =>
      assertBranchReadOperationRequest({
        source: read,
        target: read,
        sourceCollection: 'posts',
        targetCollection: 'pages',
      }),
    ).toThrow('entity binding')
  })
})

describe('original root policy receipts', () => {
  it('should clone policy input and consume its receipt exactly once', () => {
    const req = request()
    const where = { title: { equals: 'authorized' } }
    const policy = createBranchOriginalPolicy({
      req,
      branchID: 'staging',
      collection: 'posts',
      where,
    })
    where.title.equals = 'changed'
    const grant = consumeBranchOriginalPolicy({
      req,
      branchID: 'staging',
      collection: 'posts',
      policy,
    })
    expect(readBranchOriginalGrant({ grant })).toEqual({
      where: { title: { equals: 'authorized' } },
      overrideAccess: false,
    })
    expect(() =>
      consumeBranchOriginalPolicy({ req, branchID: 'staging', collection: 'posts', policy }),
    ).toThrow('invalid or expired')
    expect(() => readBranchOriginalGrant({ grant: {} })).toThrow('Invalid')
  })

  it('should reject a source transaction replacement after receipt admission', () => {
    const req = request()
    const policy = createBranchOriginalPolicy({
      req,
      branchID: 'staging',
      collection: 'posts',
      where: {},
    })
    const grant = consumeBranchOriginalPolicy({
      req,
      branchID: 'staging',
      collection: 'posts',
      policy,
    })
    req.transactionID = 'changed after admission'
    expect(() => readBranchOriginalGrant({ grant })).toThrow('Invalid original-operation grant')
  })

  it.each(['branch', 'collection', 'request', 'transaction', 'forged'])(
    'should refuse a mismatched %s receipt',
    (mismatch) => {
      const req = request()
      const policy = createBranchOriginalPolicy({
        req,
        branchID: 'staging',
        collection: 'posts',
        where: {},
      })
      if (mismatch === 'transaction') req.transactionID = 'changed'
      expect(() =>
        consumeBranchOriginalPolicy({
          req: mismatch === 'request' ? request() : req,
          branchID: mismatch === 'branch' ? 'drafts' : 'staging',
          collection: mismatch === 'collection' ? 'other' : 'posts',
          policy: mismatch === 'forged' ? {} : policy,
        }),
      ).toThrow('invalid or expired')
    },
  )
})
