import type { CheckboxField, FieldAccess, TextField } from '../../../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { createAPIKeyFields } from './index.js'

describe('createAPIKeyFields', () => {
  it('should retain default read access when other access operations are overridden', async () => {
    const denyUpdate: FieldAccess = () => false
    const fields = createAPIKeyFields({
      apiKeyField: {
        access: {
          update: denyUpdate,
        },
      },
      enableAPIKeyField: {
        access: {
          update: denyUpdate,
        },
      },
    })
    const apiKeyField = fields.find(
      (field) => 'name' in field && field.name === 'apiKey',
    ) as TextField
    const enableAPIKeyField = fields.find(
      (field) => 'name' in field && field.name === 'enableAPIKey',
    ) as CheckboxField

    expect(apiKeyField.access?.update).toBe(denyUpdate)
    expect(
      await apiKeyField.access?.read?.({
        collection: { slug: 'users' },
        id: 'user-1',
        req: {
          user: {
            collection: 'users',
            id: 'user-2',
          },
        },
      } as any),
    ).toBe(false)
    expect(enableAPIKeyField.access?.update).toBe(denyUpdate)
    expect(
      await enableAPIKeyField.access?.read?.({
        req: {
          user: null,
        },
      } as any),
    ).toBe(false)
  })
})
