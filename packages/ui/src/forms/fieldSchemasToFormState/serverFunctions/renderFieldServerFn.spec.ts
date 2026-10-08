import { beforeEach, describe, expect, it, vi } from 'vitest'

import { _internal_renderFieldHandler } from './renderFieldServerFn.js'

const mocks = vi.hoisted(() => ({
  canAccessAdmin: vi.fn(),
  getClientConfig: vi.fn(),
  getClientSchemaMap: vi.fn(),
  getSchemaMap: vi.fn(),
  renderField: vi.fn(),
}))

vi.mock('payload', () => ({
  canAccessAdmin: mocks.canAccessAdmin,
  UnauthorizedError: class extends Error {},
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

  it('should accept allowed field props', async () => {
    const targetField = { name: 'content', type: 'richText', admin: { hidden: true } }

    mocks.getSchemaMap.mockReturnValue(new Map([['posts.content', targetField]]))

    await _internal_renderFieldHandler({
      ...args,
      name: 'editor',
      label: 'Editor',
      hidden: false,
      initialValue: 'Initial text',
    })

    expect(mocks.canAccessAdmin).toHaveBeenCalledWith({ req: args.req })
    expect(mocks.renderField).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldConfig: {
          name: 'editor',
          label: 'Editor',
          type: 'richText',
          admin: { hidden: false },
        },
        data: { editor: 'Initial text' },
        path: 'editor',
        schemaPath: 'posts.content',
        forceCreateClientField: true,
      }),
    )
    expect(targetField).toEqual({ name: 'content', type: 'richText', admin: { hidden: true } })
  })

  it('should reject disallowed field props', async () => {
    const components = {
      Field: { path: './ConfiguredField', serverProps: { heading: 'Configured heading' } },
    }
    const targetField = { name: 'content', type: 'richText', admin: { components, hidden: true } }

    mocks.getSchemaMap.mockReturnValue(new Map([['posts.content', targetField]]))

    const request = {
      ...args,
      field: {
        admin: {
          components: {
            Field: {
              path: './OtherField',
              serverProps: { heading: 'Other heading' },
            },
          },
        },
      },
      initialValue: 'Initial text',
    }

    await _internal_renderFieldHandler(request)

    expect(mocks.canAccessAdmin).toHaveBeenCalledWith({ req: args.req })
    expect(mocks.renderField).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldConfig: {
          ...targetField,
          admin: {
            components: {
              Field: {
                path: './ConfiguredField',
                serverProps: { heading: 'Configured heading' },
              },
            },
            hidden: true,
          },
        },
        data: { content: 'Initial text' },
        path: 'content',
        schemaPath: 'posts.content',
        forceCreateClientField: false,
      }),
    )
    expect(targetField).toEqual({
      name: 'content',
      type: 'richText',
      admin: {
        components: {
          Field: {
            path: './ConfiguredField',
            serverProps: { heading: 'Configured heading' },
          },
        },
        hidden: true,
      },
    })
  })

  it('should deny when admin access is denied', async () => {
    mocks.canAccessAdmin.mockRejectedValue(new Error('Admin access denied'))

    await expect(_internal_renderFieldHandler(args)).rejects.toThrow('Admin access denied')
    expect(mocks.getSchemaMap).not.toHaveBeenCalled()
    expect(mocks.renderField).not.toHaveBeenCalled()
  })

  it('should deny when no user is on the request', async () => {
    await expect(
      _internal_renderFieldHandler({ ...args, req: { ...args.req, user: null } }),
    ).rejects.toThrow()
    expect(mocks.canAccessAdmin).not.toHaveBeenCalled()
    expect(mocks.renderField).not.toHaveBeenCalled()
  })
})
