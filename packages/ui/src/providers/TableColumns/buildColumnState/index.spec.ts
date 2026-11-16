import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, Field, Payload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { buildColumnState } from './index.js'

vi.mock('../../../exports/client/index.js', () => ({
  SortColumn: () => null,
}))

describe('buildColumnState', () => {
  it('should handle fields with admin components explicitly set to undefined', () => {
    const clientField: ClientField = {
      name: 'title',
      type: 'text',
    }
    const serverField: Field = {
      name: 'title',
      type: 'text',
      admin: {
        components: undefined,
      },
    }

    const columns = buildColumnState({
      clientFields: [clientField],
      collectionSlug: 'posts',
      customCellProps: {},
      dataType: 'monomorphic',
      docs: [],
      enableRowSelections: false,
      fieldPermissions: true,
      i18n: {
        t: vi.fn(),
      } as unknown as I18nClient,
      payload: {
        importMap: {},
      } as unknown as Payload,
      serverFields: [serverField],
      useAsTitle: 'title',
    })

    expect(columns).toHaveLength(1)
    expect(columns[0].CustomLabel).toBeUndefined()
  })
})
