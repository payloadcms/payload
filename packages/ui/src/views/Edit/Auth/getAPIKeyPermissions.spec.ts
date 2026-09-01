import type { SanitizedDocumentPermissions } from 'payload'

import { describe, expect, it } from 'vitest'

import { getAPIKeyPermissions } from './getAPIKeyPermissions.js'

describe('getAPIKeyPermissions', () => {
  it('should keep API key and status read permissions independent', () => {
    const fields = {
      apiKey: {
        create: true,
        update: true,
      },
      enableAPIKey: {
        create: true,
        read: true,
        update: true,
      },
    } as SanitizedDocumentPermissions['fields']

    expect(getAPIKeyPermissions({ fields, operation: 'update' })).toEqual({
      canModifyAPIKey: true,
      canModifyAPIKeyStatus: true,
      canReadAPIKey: false,
      canReadAPIKeyStatus: true,
    })
  })

  it('should keep API key and status modification permissions independent', () => {
    const fields = {
      apiKey: {
        create: true,
        read: true,
        update: true,
      },
      enableAPIKey: {
        create: true,
        read: true,
      },
    } as SanitizedDocumentPermissions['fields']

    expect(getAPIKeyPermissions({ fields, operation: 'update' })).toEqual({
      canModifyAPIKey: true,
      canModifyAPIKeyStatus: false,
      canReadAPIKey: true,
      canReadAPIKeyStatus: true,
    })
  })

  it('should use create permissions when creating an API key user', () => {
    const fields = {
      apiKey: {
        create: true,
        read: true,
      },
      enableAPIKey: {
        read: true,
        update: true,
      },
    } as SanitizedDocumentPermissions['fields']

    expect(getAPIKeyPermissions({ fields, operation: 'create' })).toEqual({
      canModifyAPIKey: true,
      canModifyAPIKeyStatus: false,
      canReadAPIKey: true,
      canReadAPIKeyStatus: true,
    })
  })

  it('should allow every API key operation when all field permissions are granted', () => {
    expect(getAPIKeyPermissions({ fields: true, operation: 'update' })).toEqual({
      canModifyAPIKey: true,
      canModifyAPIKeyStatus: true,
      canReadAPIKey: true,
      canReadAPIKeyStatus: true,
    })
  })
})
