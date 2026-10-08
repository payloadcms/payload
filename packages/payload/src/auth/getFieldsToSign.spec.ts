import type { CollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { getFieldsToSign } from './getFieldsToSign.js'

describe('getFieldsToSign', () => {
  it('should prevent fields configured with saveToJWT from replacing Payload-owned JWT values', () => {
    const collectionConfig = {
      fields: [
        {
          name: 'impersonatedID',
          saveToJWT: 'id',
          type: 'text',
        },
        {
          name: 'impersonatedCollection',
          saveToJWT: 'collection',
          type: 'text',
        },
        {
          name: 'impersonatedEmail',
          saveToJWT: 'email',
          type: 'text',
        },
        {
          name: 'impersonatedSession',
          saveToJWT: 'sid',
          type: 'text',
        },
        {
          name: 'forgedIssuedAt',
          saveToJWT: 'iat',
          type: 'number',
        },
        {
          name: 'forgedExpiration',
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
      email: 'attacker@example.com',
      sid: 'trusted-session',
      user: {
        forgedExpiration: 1,
        forgedIssuedAt: 1,
        id: 'attacker-id',
        impersonatedCollection: 'posts',
        impersonatedEmail: 'victim@example.com',
        impersonatedID: 'victim-id',
        impersonatedSession: 'victim-session',
        authVersionAlias: 1,
        role: 'admin',
      } as PayloadRequest['user'],
    })

    expect(result).toEqual({
      collection: 'users',
      email: 'attacker@example.com',
      id: 'attacker-id',
      authVersion: 1,
      role: 'admin',
      sid: 'trusted-session',
    })
  })

  it('should retain __proto__ and constructor aliases without mutating the result prototype', () => {
    const collectionConfig = {
      fields: [
        {
          name: 'prototypeAlias',
          saveToJWT: '__proto__',
          type: 'text',
        },
        {
          name: 'constructorAlias',
          saveToJWT: 'constructor',
          type: 'text',
        },
      ],
      slug: 'users',
    } as CollectionConfig

    const result = getFieldsToSign({
      collectionConfig,
      email: 'user@example.com',
      user: {
        constructorAlias: 'custom-constructor',
        id: 'user-id',
        prototypeAlias: 'custom-prototype',
      } as PayloadRequest['user'],
    })
    const roundTrippedResult = JSON.parse(JSON.stringify(result)) as Record<string, unknown>

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(Object.hasOwn(result, 'constructor')).toBe(true)
    expect(result.__proto__).toBe('custom-prototype')
    expect(result.constructor).toBe('custom-constructor')
    expect(Object.getPrototypeOf(roundTrippedResult)).toBe(Object.prototype)
    expect(Object.hasOwn(roundTrippedResult, '__proto__')).toBe(true)
    expect(Object.hasOwn(roundTrippedResult, 'constructor')).toBe(true)
    expect(roundTrippedResult.__proto__).toBe('custom-prototype')
    expect(roundTrippedResult.constructor).toBe('custom-constructor')
  })
})
