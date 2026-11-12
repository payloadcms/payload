import type { RichTextAdapter } from '../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Field, TextField, ValidateOptions } from './types.js'

import { describe, expect, it, vi } from 'vitest'

import { fieldSchemasToFormState } from '../../../../ui/src/forms/fieldSchemasToFormState/index.js'
import { sanitizeCollection } from '../../collections/config/sanitize.js'
import { hasText } from '../../../../richtext-lexical/src/validate/hasText.js'
import { beforeChange } from '../hooks/beforeChange/index.js'
import { select } from '../validations.js'
import { sanitizeFields } from './sanitize.js'

const req = {
  i18n: { language: 'en' },
  locale: 'en',
  payload: { config: {} },
  t: (key: string) => key,
} as unknown as PayloadRequest

const options = { req } as ValidateOptions<unknown, unknown, object, unknown>

const sanitize = ({ field, config = {} as Config }: { config?: Config; field: Field }): Field => {
  sanitizeFields({ config, fields: [field], validRelationships: null })

  return field
}

const validate = async ({ field, value }: { field: Field; value: unknown }) => {
  const sanitized = sanitize({ field })

  if (!('validate' in sanitized) || !sanitized.validate) {
    throw new Error('Expected a field validator')
  }

  return sanitized.validate(value as never, options as never)
}

const runBeforeChange = ({
  field,
  value,
  skipValidation = false,
  request = req,
  fieldsToValidate,
}: {
  field: TextField
  fieldsToValidate?: ReadonlySet<string>
  request?: PayloadRequest
  skipValidation?: boolean
  value: unknown
}) => {
  const collection = {
    fields: [sanitize({ field, config: request.payload.config })],
    slug: 'posts',
  } as SanitizedCollectionConfig

  return beforeChange({
    collection,
    context: {},
    data: { title: value },
    doc: {},
    docWithLocales: {},
    global: null,
    fieldsToValidate,
    operation: 'create',
    overrideAccess: false,
    req: request,
    skipValidation,
  })
}

describe('required fields with custom validators', () => {
  it.each([undefined, null, ''])('should reject empty text value %j', async (value) => {
    await expect(
      validate({
        field: { name: 'title', type: 'text', required: true, validate: () => true },
        value,
      }),
    ).resolves.toBe('validation:required')
  })

  it.each([
    { type: 'textarea', value: '' },
    { type: 'code', value: '' },
    { type: 'email', value: '' },
    { type: 'date', value: null },
    { type: 'number', value: null },
    { type: 'checkbox', value: undefined },
    { type: 'json', value: null },
    { type: 'array', fields: [], value: [] },
    { type: 'blocks', blocks: [], value: [] },
    { type: 'text', hasMany: true, value: [] },
    { type: 'number', hasMany: true, value: [] },
    { type: 'select', options: ['one'], hasMany: true, value: [] },
    { type: 'radio', options: ['one'], value: undefined },
    { type: 'relationship', relationTo: 'posts', hasMany: true, value: [] },
    { type: 'upload', relationTo: 'media', value: null },
  ])('should reject an empty required $type field', async ({ value, ...field }) => {
    await expect(
      validate({
        field: { ...field, name: 'title', required: true, validate: () => true } as Field,
        value,
      }),
    ).resolves.toBe('validation:required')
  })

  it.each([{ value: [0, ''] }, { value: ['', 0] }, { value: [] }])(
    'should reject incomplete required coordinates $value',
    async ({ value }) => {
      await expect(
        validate({
          field: { name: 'location', type: 'point', required: true, validate: () => true },
          value,
        }),
      ).resolves.toBe('validation:requiresTwoNumbers')
    },
  )

  it.each([
    { type: 'number', value: 0 },
    { type: 'checkbox', value: false },
    { type: 'json', value: false },
    { type: 'json', value: [] },
    { type: 'relationship', relationTo: 'posts', value: 0 },
    { type: 'point', value: [0, 0] },
  ])('should accept a present required $type value', async ({ value, ...field }) => {
    await expect(
      validate({
        field: { ...field, name: 'title', required: true, validate: () => true } as Field,
        value,
      }),
    ).resolves.toBe(true)
  })

  it('should preserve custom errors for nonempty values', async () => {
    await expect(
      validate({
        field: {
          name: 'title',
          type: 'text',
          required: true,
          validate: async () => 'Custom error',
        },
        value: 'present',
      }),
    ).resolves.toBe('Custom error')
  })

  it('should still allow custom validators to override other default constraints', async () => {
    await expect(
      validate({
        field: { name: 'title', type: 'text', required: true, minLength: 10, validate: () => true },
        value: 'short',
      }),
    ).resolves.toBe(true)
  })

  it('should not invoke custom validation for a missing required value', async () => {
    const customValidate = vi.fn(() => true as const)

    await validate({
      field: { name: 'title', type: 'text', required: true, validate: customValidate },
      value: '',
    })

    expect(customValidate).not.toHaveBeenCalled()
  })

  it('should preserve optional custom validation', async () => {
    await expect(
      validate({ field: { name: 'title', type: 'text', validate: () => true }, value: '' }),
    ).resolves.toBe(true)
  })

  it('should preserve virtual field validation', async () => {
    await expect(
      validate({
        field: { name: 'title', type: 'text', required: true, virtual: true, validate: () => true },
        value: undefined,
      }),
    ).resolves.toBe(true)
  })

  it('should reject an empty required value in the server validation pipeline', async () => {
    await expect(
      runBeforeChange({
        field: { name: 'title', type: 'text', required: true, validate: () => true },
        value: '',
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'title', message: 'validation:required' }] },
    })
  })

  it('should validate a value populated by beforeChange hooks', async () => {
    await expect(
      runBeforeChange({
        field: {
          name: 'title',
          type: 'text',
          required: true,
          validate: () => true,
          hooks: { beforeChange: [() => 'generated'] },
        },
        value: '',
      }),
    ).resolves.toMatchObject({ title: 'generated' })
  })

  it('should preserve explicit validation skips used by draft saves', async () => {
    await expect(
      runBeforeChange({
        field: { name: 'title', type: 'text', required: true, validate: () => true },
        value: '',
        skipValidation: true,
      }),
    ).resolves.toMatchObject({ title: '' })
  })

  it('should preserve conditional validation skips', async () => {
    await expect(
      runBeforeChange({
        field: {
          name: 'title',
          type: 'text',
          required: true,
          validate: () => true,
          admin: { condition: () => false },
        },
        value: '',
      }),
    ).resolves.toMatchObject({ title: '' })
  })

  it('should use the rich text editor to detect an empty document', async () => {
    const editor = {
      isEmpty: ({ value }) => value?.root?.children?.length === 0,
      validate: () => true,
    } as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: { root: { children: [] } },
      }),
    ).resolves.toBe('validation:required')
  })

  it('should fall back to editor validation for adapters without an emptiness predicate', async () => {
    const editor = { validate: () => 'validation:required' } as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: { root: { children: [] } },
      }),
    ).resolves.toBe('validation:required')
  })
})

describe('required validation execution context', () => {
  it('should reject an empty native slug after hooks have run', async () => {
    await expect(
      validate({ field: { name: 'slug', type: 'slug', required: true }, value: '' }),
    ).resolves.toBe('validation:required')
  })

  it('should run default rich text validation only once', async () => {
    const defaultValidate = vi.fn(() => true as const)
    const editor = { validate: defaultValidate } as unknown as RichTextAdapter

    await validate({
      field: { name: 'content', type: 'richText', required: true, editor },
      value: { content: 'present' },
    })

    expect(defaultValidate).toHaveBeenCalledTimes(1)
  })

  it('should reject an empty Lexical paragraph even with custom validation', async () => {
    const editor = {
      isEmpty: ({ value }) => !hasText(value),
      validate: () => true,
    } as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: {
          root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: '' }] }] },
        },
      }),
    ).resolves.toBe('validation:required')
  })

  it('should let custom rich text validation override unrelated editor validation', async () => {
    const editor = {
      isEmpty: () => false,
      validate: () => 'Default node error',
    } as unknown as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: { content: 'present' },
      }),
    ).resolves.toBe(true)
  })

  it('should validate each submitted locale independently', async () => {
    const request = {
      ...req,
      locale: 'all',
      payload: { config: { localization: { defaultLocale: 'en', localeCodes: ['en', 'fr'] } } },
    } as unknown as PayloadRequest

    await expect(
      runBeforeChange({
        field: {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
          validate: () => true,
        },
        value: { en: 'Present', fr: '' },
        request,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'title', message: 'validation:required' }] },
    })
  })

  it('should preserve validation scope for omitted top-level fields', async () => {
    await expect(
      runBeforeChange({
        field: { name: 'title', type: 'text', required: true, validate: () => true },
        value: '',
        fieldsToValidate: new Set(['other']),
      }),
    ).resolves.toMatchObject({ title: '' })
  })
})

describe('required row counts and repeated sanitization', () => {
  it.each([
    { type: 'array', fields: [], value: 0 },
    { type: 'blocks', blocks: [], value: 0 },
    { type: 'array', fields: [], value: Number.NaN },
    { type: 'blocks', blocks: [], value: Number.NaN },
  ])('should reject an empty numeric $type row count', async ({ value, ...field }) => {
    await expect(
      validate({
        field: { ...field, name: 'rows', required: true, validate: () => true } as Field,
        value,
      }),
    ).resolves.toBe('validation:required')
  })

  it('should reject zero array rows in the server validation pipeline', async () => {
    const field = sanitize({
      field: { name: 'rows', type: 'array', fields: [], required: true, validate: () => true },
    })

    await expect(
      beforeChange({
        collection: { slug: 'posts', fields: [field] } as SanitizedCollectionConfig,
        context: {},
        data: { rows: 0 },
        doc: {},
        docWithLocales: {},
        global: null,
        operation: 'create',
        overrideAccess: false,
        req,
        skipValidation: false,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'rows', message: 'validation:required' }] },
    })
  })

  it('should not wrap an installed rich text default validator when sanitized again', async () => {
    const defaultValidate = vi.fn(() => true as const)
    const editor = { validate: defaultValidate } as unknown as RichTextAdapter
    const field = sanitize({ field: { name: 'content', type: 'richText', required: true, editor } })

    await validate({ field, value: { content: 'present' } })

    expect(defaultValidate).toHaveBeenCalledTimes(1)
  })
})

describe('required validation review regressions', () => {
  it.each([undefined, null])(
    'should reject missing rich text %j before adapter validation',
    async (value) => {
      const editor = { validate: () => true } as RichTextAdapter

      await expect(
        validate({
          field: {
            name: 'content',
            type: 'richText',
            required: true,
            editor,
            validate: () => true,
          },
          value,
        }),
      ).resolves.toBe('validation:required')
    },
  )

  it('should enforce required inherited from an auth base field', async () => {
    const collection = sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', validate: () => true }],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'email')!

    expect(field).toMatchObject({ required: true })
    await expect(
      beforeChange({
        collection: { ...collection, fields: [field] },
        context: {},
        data: { email: '' },
        doc: {},
        docWithLocales: {},
        global: null,
        operation: 'create',
        overrideAccess: false,
        req,
        skipValidation: false,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'email', message: 'validation:required' }] },
    })
  })

  it('should preserve explicitly optional auth overrides', async () => {
    const collection = sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', required: false, validate: () => true }],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'email')!

    expect(field).toMatchObject({ required: false })
    await expect(
      beforeChange({
        collection: { ...collection, fields: [field] },
        context: {},
        data: { email: '' },
        doc: {},
        docWithLocales: {},
        global: null,
        operation: 'create',
        overrideAccess: false,
        req,
        skipValidation: false,
      }),
    ).resolves.toMatchObject({ email: '' })
  })

  it('should keep a blank native slug valid when form state refreshes after a failed submission', async () => {
    const field = sanitize({ field: { name: 'slug', type: 'slug' } })
    const args = {
      collectionSlug: 'posts',
      data: {},
      fields: [field],
      fieldSchemaMap: undefined,
      permissions: true as const,
      preferences: { fields: {} },
      renderAllFields: false,
      req,
      schemaPath: '',
    }
    const initialState = await fieldSchemasToFormState({ ...args, skipValidation: true })
    const refreshedState = await fieldSchemasToFormState({
      ...args,
      previousFormState: initialState,
      skipValidation: false,
    })

    expect(refreshedState).toHaveProperty('slug')
    expect(refreshedState?.slug?.valid).not.toBe(false)
    expect(refreshedState?.slug?.errorMessage).toBeUndefined()
    await expect(validate({ field, value: '' })).resolves.toBe('validation:required')
  })
})

describe('native slug generation with required enforcement', () => {
  it('should accept a slug populated by its native generation hook', async () => {
    const field = sanitize({ field: { name: 'slug', type: 'slug', useAsSlug: 'title' } })

    await expect(
      beforeChange({
        collection: null,
        global: { slug: 'settings', fields: [field] } as SanitizedGlobalConfig,
        context: {},
        data: { title: 'Generate me', slug: '' },
        doc: {},
        docWithLocales: {},
        operation: 'create',
        overrideAccess: false,
        req,
        skipValidation: false,
      }),
    ).resolves.toMatchObject({ slug: 'generate-me' })
  })

  it('should reject an empty slug when its native hook cannot generate a value', async () => {
    const field = sanitize({ field: { name: 'slug', type: 'slug' } })

    await expect(
      beforeChange({
        collection: null,
        global: { slug: 'settings', fields: [field] } as SanitizedGlobalConfig,
        context: {},
        data: { slug: '' },
        doc: {},
        docWithLocales: {},
        operation: 'create',
        overrideAccess: false,
        req,
        skipValidation: false,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'slug', message: 'validation:required' }] },
    })
  })
})

describe('auth-field validation scope', () => {
  it('should not install additional validators on built-in auth fields', () => {
    const collection = sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'hash')

    expect(field).toBeDefined()
    expect(field).not.toHaveProperty('validate')
  })
})

describe('required select presence semantics', () => {
  it('should accept a configured empty-string option when composing default validation', async () => {
    await expect(
      validate({
        field: {
          name: 'choice',
          type: 'select',
          required: true,
          options: [{ label: 'None', value: '' }],
          validate: (value, args) => select(value, args),
        },
        value: '',
      }),
    ).resolves.toBe(true)
  })

  it('should retain default rejection of an unconfigured empty-string option', async () => {
    await expect(
      validate({
        field: {
          name: 'choice',
          type: 'select',
          required: true,
          options: ['one'],
          validate: (value, args) => select(value, args),
        },
        value: '',
      }),
    ).resolves.toBe('validation:invalidSelection')
  })

  it.each([undefined, null])(
    'should still reject a missing required select value %j',
    async (value) => {
      await expect(
        validate({
          field: {
            name: 'choice',
            type: 'select',
            required: true,
            options: [{ label: 'None', value: '' }],
            validate: () => true,
          },
          value,
        }),
      ).resolves.toBe('validation:required')
    },
  )
})
