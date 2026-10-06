import { beforeEach, describe, expect, it, vi } from 'vitest'

import { _internal_renderFieldHandler } from './renderFieldServerFn.js'

const mocks = vi.hoisted(() => ({
  getClientConfig: vi.fn(),
  getClientSchemaMap: vi.fn(),
  getSchemaMap: vi.fn(),
  renderField: vi.fn(),
}))

vi.mock('../../../utilities/getClientConfig.js', () => ({
  getClientConfig: mocks.getClientConfig,
}))
vi.mock('../../../utilities/getClientSchemaMap.js', () => ({
  getClientSchemaMap: mocks.getClientSchemaMap,
}))
vi.mock('../../../utilities/getSchemaMap.js', () => ({ getSchemaMap: mocks.getSchemaMap }))
vi.mock('../renderField.js', () => ({ renderField: mocks.renderField }))

type HandlerArgs = Parameters<typeof _internal_renderFieldHandler>[0]

const args = {
  req: { user: { collection: 'users' }, payload: { config: {}, importMap: {} } },
  schemaPath: 'collection.posts.content',
} as HandlerArgs

describe('renderFieldServerFn', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should reject disallowed field props', async () => {
    const targetField = {
      name: 'content',
      type: 'richText',
      admin: {
        components: {
          Field: {
            path: './ConfiguredField',
            exportName: 'Field',
            serverProps: { heading: 'Configured heading' },
          },
        },
        hidden: true,
      },
    }

    mocks.getSchemaMap.mockReturnValue(new Map([['posts.content', targetField]]))

    const request = {
      ...args,
      field: {
        admin: {
          components: {
            Field: {
              path: './OtherField',
              exportName: 'Field',
              serverProps: { heading: 'Other heading', appearance: 'compact' },
            },
          },
        },
      },
      initialValue: 'Initial text',
    }

    await _internal_renderFieldHandler(request)

    expect(mocks.renderField).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { content: 'Initial text' },
        fieldConfig: {
          ...targetField,
          admin: {
            components: {
              Field: {
                path: './ConfiguredField',
                exportName: 'Field',
                serverProps: { heading: 'Configured heading' },
              },
            },
            hidden: true,
          },
        },
        forceCreateClientField: false,
        path: 'content',
        schemaPath: 'posts.content',
      }),
    )
    expect(targetField).toEqual({
      name: 'content',
      type: 'richText',
      admin: {
        components: {
          Field: {
            path: './ConfiguredField',
            exportName: 'Field',
            serverProps: { heading: 'Configured heading' },
          },
        },
        hidden: true,
      },
    })
  })

  it('should accept allowed field props', async () => {
    const targetField = { name: 'content', type: 'richText', admin: { hidden: true } }

    mocks.getSchemaMap.mockReturnValue(new Map([['posts.content', targetField]]))

    await _internal_renderFieldHandler({
      ...args,
      name: 'editor',
      label: false,
      hidden: false,
    })

    expect(mocks.renderField).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldConfig: {
          name: 'editor',
          label: false,
          admin: { hidden: false },
          type: 'richText',
        },
        forceCreateClientField: true,
        path: 'editor',
      }),
    )
    expect(targetField).toEqual({ name: 'content', type: 'richText', admin: { hidden: true } })
  })
})
