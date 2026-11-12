import type { CollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { Field, TextField } from './types.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sanitizeCollection } from '../../collections/config/sanitize.js'
import { text } from '../validations.js'
import { sanitizeFields } from './sanitize.js'

const sanitize = ({ fields }: { fields: Field[] }) =>
  sanitizeFields({
    collectionConfig: { slug: 'posts' } as CollectionConfig,
    config: {} as Config,
    fields,
    validRelationships: null,
  })

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('required fields with custom validators', () => {
  it('should explain that custom validation replaces required validation in development', async () => {
    await sanitize({
      fields: [{ name: 'title', type: 'text', required: true, validate: () => true }],
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('posts.title'))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('required'))
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://payloadcms.com/docs/fields/overview#reusing-default-field-validations',
      ),
    )
  })

  it('should include nested field paths', async () => {
    await sanitize({
      fields: [
        {
          name: 'group',
          type: 'group',
          fields: [{ name: 'title', type: 'text', required: true, validate: () => true }],
        },
      ],
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('posts.group.title'))
  })

  it('should preserve the custom validator and allow intentionally empty values', async () => {
    const customValidate = () => true as const
    const field: TextField = {
      name: 'title',
      type: 'text',
      required: true,
      validate: customValidate,
    }

    await sanitize({ fields: [field] })

    expect(field.validate).toBe(customValidate)
    expect(field.validate?.('', {} as never)).toBe(true)
  })

  it('should retain validation when the custom validator delegates to the default', async () => {
    const field: TextField = {
      name: 'title',
      type: 'text',
      required: true,
      validate: (value, options) => text(value, options),
    }

    await sanitize({ fields: [field] })

    expect(
      field.validate?.('', {
        required: true,
        req: { payload: { config: {} }, t: (key) => key },
      } as never),
    ).toBe('validation:required')
  })

  it.each(['production', 'test'])('should not warn in %s', async (environment) => {
    vi.stubEnv('NODE_ENV', environment)

    await sanitize({
      fields: [{ name: 'title', type: 'text', required: true, validate: () => true }],
    })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should not warn for optional fields with custom validation', async () => {
    await sanitize({ fields: [{ name: 'title', type: 'text', validate: () => true }] })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should not warn for fields using default validation', async () => {
    await sanitize({ fields: [{ name: 'title', type: 'text', required: true }] })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should not warn for virtual fields', async () => {
    await sanitize({
      fields: [
        { name: 'title', type: 'text', required: true, virtual: true, validate: () => true },
      ],
    })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should warn only once when the same field is sanitized again', async () => {
    const field: TextField = { name: 'title', type: 'text', required: true, validate: () => true }

    await sanitize({ fields: [field] })
    await sanitize({ fields: [field] })

    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('should not mistake an installed default validator for custom validation', async () => {
    const field: TextField = { name: 'title', type: 'text', required: true }

    await sanitize({ fields: [field] })
    await sanitize({ fields: [field] })

    expect(console.warn).not.toHaveBeenCalled()
  })
})

describe('required validation after auth-field merging', () => {
  it('should warn when an auth override inherits required from its base field', async () => {
    const customValidate = () => true as const
    const collection = await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', validate: customValidate }],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'email')

    expect(field).toMatchObject({ required: true, validate: customValidate })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('users.email'))
  })

  it('should not warn for built-in auth validation', async () => {
    await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [],
    })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should warn only once for an explicitly required auth override', async () => {
    await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', required: true, validate: () => true }],
    })

    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('should not warn for an explicitly optional auth override', async () => {
    await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', required: false, validate: () => true }],
    })

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('should finish sanitizing later fields before checking warnings', async () => {
    await sanitize({
      fields: [
        { name: 'first', type: 'text' },
        { name: 'second', type: 'text', required: true, validate: () => true },
      ],
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('posts.second'))
  })
})

describe('auth-field validation scope', () => {
  it('should not install additional validators on built-in auth fields', async () => {
    const collection = await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'hash')

    expect(field).toBeDefined()
    expect(field).not.toHaveProperty('validate')
  })
})

describe('auth warnings inside layout fields', () => {
  it.each(['row', 'collapsible', 'tabs'] as const)(
    'should warn for custom required fields inside %s',
    async (type) => {
      const fields: Field[] = [
        { name: 'title', type: 'text', required: true, validate: () => true },
      ]
      const layout: Field =
        type === 'tabs'
          ? { type, tabs: [{ label: 'Details', fields }] }
          : type === 'collapsible'
            ? { type, label: 'Details', fields }
            : { type, fields }

      await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [layout],
      })

      expect(console.warn).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('title'))
    },
  )

  it('should warn when username inherits required from its base field', async () => {
    await sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: { loginWithUsername: true },
      fields: [{ name: 'username', type: 'text', validate: () => true }],
    })

    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('users.username'))
  })
})
