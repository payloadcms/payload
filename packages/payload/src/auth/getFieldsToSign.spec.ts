import type { CollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { getFieldsToSign } from './getFieldsToSign.js'

describe('getFieldsToSign', () => {
  it('should keep fields configured with saveToJWT flat while protecting reserved authentication values', () => {
    const collectionConfig = {
      fields: [
        {
          name: 'alternateID',
          saveToJWT: 'id',
          type: 'text',
        },
        {
          name: 'alternateCollection',
          saveToJWT: 'collection',
          type: 'text',
        },
        {
          name: 'alternateEmail',
          saveToJWT: 'email',
          type: 'text',
        },
        {
          name: 'alternateSID',
          saveToJWT: 'sid',
          type: 'text',
        },
        {
          name: 'alternateIssuedAt',
          saveToJWT: 'iat',
          type: 'number',
        },
        {
          name: 'alternateExpiry',
          saveToJWT: 'exp',
          type: 'number',
        },
        {
          name: 'authVersionAlias',
          saveToJWT: 'authVersion',
          type: 'number',
        },
        {
          name: 'role',
          saveToJWT: true,
          type: 'text',
        },
      ],
      slug: 'users',
    } as CollectionConfig

    const result = getFieldsToSign({
      collectionConfig,
      email: 'account@example.com',
      sid: 'trusted-session',
      user: {
        id: 'account-id',
        alternateCollection: 'posts',
        alternateEmail: 'alternate@example.com',
        alternateExpiry: 0,
        alternateIssuedAt: 0,
        alternateID: 'alternate-id',
        alternateSID: 'alternate-session',
        authVersionAlias: 1,
        role: 'admin',
      } as PayloadRequest['user'],
    })

    expect(Object.getPrototypeOf(result)).toBe(null)
    expect(result).toEqual({
      collection: 'users',
      email: 'account@example.com',
      id: 'account-id',
      authVersion: 1,
      role: 'admin',
      sid: 'trusted-session',
    })
  })

  it('should preserve __proto__ and constructor aliases after JSON round-trip', () => {
    const collectionConfig = {
      fields: [
        {
          name: 'constructorValue',
          saveToJWT: 'constructor',
          type: 'json',
        },
        {
          name: 'prototypeValue',
          saveToJWT: '__proto__',
          type: 'json',
        },
      ],
      slug: 'users',
    } as CollectionConfig

    const result = getFieldsToSign({
      collectionConfig,
      email: 'user@example.com',
      user: {
        id: 'user-id',
        constructorValue: { stored: true },
        prototypeValue: { stored: true },
      } as PayloadRequest['user'],
    })
    const roundTripped = JSON.parse(JSON.stringify(result)) as Record<string, unknown>

    expect(Object.getPrototypeOf(result)).toBe(null)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(Object.hasOwn(result, 'constructor')).toBe(true)
    expect(Object.hasOwn(roundTripped, '__proto__')).toBe(true)
    expect(roundTripped['__proto__']).toEqual({ stored: true })
    expect(roundTripped.constructor).toEqual({ stored: true })
    expect(Object.getPrototypeOf(roundTripped)).toBe(Object.prototype)
    expect(Object.prototype).not.toHaveProperty('stored')
  })
})
