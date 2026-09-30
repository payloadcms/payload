import type { ClientField, FieldState, PayloadRequest, UIField } from 'payload'

import { describe, expect, it } from 'vitest'

import { renderField } from './renderField.js'

type UIFieldComponents = NonNullable<UIField['admin']>['components']

const schemaPath = 'posts.thumbnail'

const renderUIField = ({ components }: { components: UIFieldComponents }) => {
  const fieldConfig: UIField = {
    name: 'thumbnail',
    type: 'ui',
    admin: { components },
  }

  const fieldState: FieldState = { customComponents: {} }

  renderField({
    clientFieldSchemaMap: new Map([[schemaPath, { name: 'thumbnail', type: 'ui' } as ClientField]]),
    collectionSlug: 'posts',
    data: {},
    fieldConfig,
    fieldSchemaMap: new Map(),
    fieldState,
    formState: {},
    indexPath: '',
    mockRSCs: true,
    operation: 'update',
    parentPath: '',
    parentSchemaPath: 'posts',
    path: 'thumbnail',
    permissions: true,
    renderAllFields: true,
    req: { payload: { importMap: {} } } as unknown as PayloadRequest,
    schemaPath,
    siblingData: {},
  })

  return fieldState
}

describe('renderField - ui field', () => {
  it('should not render the Cell component in form state', () => {
    const fieldState = renderUIField({ components: { Cell: '/components/MyCell' } })

    expect(fieldState.customComponents).not.toHaveProperty('Cell')
  })

  it('should not render the Filter component in form state', () => {
    const fieldState = renderUIField({ components: { Filter: '/components/MyFilter' } })

    expect(fieldState.customComponents).not.toHaveProperty('Filter')
  })

  it('should render the Field component in form state', () => {
    const fieldState = renderUIField({ components: { Field: '/components/MyField' } })

    expect(fieldState.customComponents.Field).toBe('Mock')
  })

  it('should render extra, untyped components in form state', () => {
    const fieldState = renderUIField({
      components: { MyExtraComponent: '/components/MyExtra' } as UIFieldComponents,
    })

    expect(fieldState.customComponents).toHaveProperty('MyExtraComponent', 'Mock')
  })
})
