import type { RichTextAdapter } from '../../admin/RichText.js'
import type { Config } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Field, ValidateOptions } from './types.js'

import { describe, expect, it, vi } from 'vitest'

import { hasText } from '../../../../richtext-lexical/src/validate/hasText.js'
import { fieldSchemasToFormState } from '../../../../ui/src/forms/fieldSchemasToFormState/index.js'
import { sanitizeCollection } from '../../collections/config/sanitize.js'
import { select } from '../validations.js'
import { sanitizeFields } from './sanitize.js'

const req = {
  i18n: { language: 'en' },
  locale: 'en',
  payload: { config: {} },
  t: (key: string) => key,
} as unknown as PayloadRequest
const options = { req } as ValidateOptions<unknown, unknown, object, unknown>

const sanitize = ({ field }: { field: Field }): Field => {
  sanitizeFields({ config: {} as Config, fields: [field], validRelationships: null })

  return field
}

const validate = async ({ field, value }: { field: Field; value: unknown }) => {
  const sanitized = sanitize({ field })

  if (!('validate' in sanitized) || !sanitized.validate) {
    throw new Error('Expected a field validator')
  }

  return sanitized.validate(value as never, options as never)
}

describe('required validation with custom validators', () => {
  it.each([
    { field: { type: 'text' }, value: undefined, expected: 'validation:required' },
    { field: { type: 'select', options: ['one'] }, value: '', expected: 'validation:required' },
    { field: { type: 'array', fields: [] }, value: [], expected: 'validation:required' },
    { field: { type: 'array', fields: [] }, value: 0, expected: 'validation:required' },
    { field: { type: 'blocks', blocks: [] }, value: 0, expected: 'validation:required' },
    { field: { type: 'number' }, value: 0, expected: true },
    { field: { type: 'checkbox' }, value: false, expected: true },
    { field: { type: 'json' }, value: [], expected: true },
  ])(
    'should preserve presence semantics for $field.type value $value',
    async ({ field, value, expected }) => {
      await expect(
        validate({
          field: { ...field, name: 'value', required: true, validate: () => true } as Field,
          value,
        }),
      ).resolves.toBe(expected)
    },
  )

  it.each([
    { value: [0, ''], expected: 'validation:requiresTwoNumbers' },
    { value: [0, 0], expected: true },
  ])('should validate required point coordinates $value', async ({ value, expected }) => {
    await expect(
      validate({
        field: { name: 'location', type: 'point', required: true, validate: () => true },
        value,
      }),
    ).resolves.toBe(expected)
  })

  it('should preserve custom validation of nonempty values without enforcing other defaults', async () => {
    const field: Field = {
      name: 'title',
      type: 'text',
      required: true,
      minLength: 10,
      validate: async (value) => (value === 'reject' ? 'Custom error' : true),
    }

    await expect(validate({ field, value: 'short' })).resolves.toBe(true)
    await expect(validate({ field, value: 'reject' })).resolves.toBe('Custom error')
  })

  it.each([{ required: false }, { required: true, virtual: true }])(
    'should preserve exemptions for $required required and $virtual virtual fields',
    async (field) => {
      await expect(
        validate({
          field: { ...field, name: 'title', type: 'text', validate: () => true },
          value: undefined,
        }),
      ).resolves.toBe(true)
    },
  )

  it('should reject missing rich text before a legacy adapter can accept it', async () => {
    const editor = { validate: () => true } as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: null,
      }),
    ).resolves.toBe('validation:required')
  })

  it('should reject an empty Lexical paragraph using editor-defined emptiness', async () => {
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

  it('should await required validation from a legacy editor adapter', async () => {
    const editor = { validate: async () => 'validation:required' } as RichTextAdapter

    await expect(
      validate({
        field: { name: 'content', type: 'richText', required: true, editor, validate: () => true },
        value: {},
      }),
    ).resolves.toBe('validation:required')
  })

  it('should not wrap an installed default validator on repeated sanitization', async () => {
    const defaultValidate = vi.fn(() => true as const)
    const editor = { validate: defaultValidate } as unknown as RichTextAdapter
    const field = sanitize({ field: { name: 'content', type: 'richText', required: true, editor } })

    await validate({ field, value: { content: 'present' } })

    expect(defaultValidate).toHaveBeenCalledTimes(1)
  })

  it('should enforce required inherited from an auth base field', async () => {
    const collection = sanitizeCollection({ collections: [] } as Config, {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', validate: () => true }],
    })
    const field = collection.fields.find((field) => 'name' in field && field.name === 'email')!

    expect(field).toMatchObject({ required: true })

    if (!('validate' in field) || !field.validate) {
      throw new Error('Expected a field validator')
    }

    expect(await field.validate('' as never, options as never)).toBe('validation:required')
  })

  it('should permit a blank native slug during form-state refresh and enforce it on submit', async () => {
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

  it.each([[''], [{ label: 'None', value: '' }]])(
    'should accept a configured empty-string select option %j with a composed validator',
    async (option) => {
      await expect(
        validate({
          field: {
            name: 'choice',
            type: 'select',
            required: true,
            options: [option],
            validate: (value, args) => select(value, args),
          },
          value: '',
        }),
      ).resolves.toBe(true)
    },
  )
})
