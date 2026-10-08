import { describe, expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { PlannedTransformer } from '../transformers/types.js'

import { validateTransformedDocument } from '../validateTransformedDocument.js'
import { assertTransformCoverage } from './assertTransformCoverage.js'
import { buildTransformStateJSONSchema } from './buildTransformStateJSONSchema.js'
import { canReuseStoredDefault } from './canReuseStoredDefault.js'
import { migrateLegacyFocalPoint } from './migrateLegacyFocalPoint.js'
import { resolveTransformStateWrite } from './resolveTransformStateWrite.js'
import { transformStateJSONSchema } from './transformStateSchema.js'
import { getTransformStateErrors } from './validateTransformState.js'

describe('transform state validation', () => {
  it('should accept arbitrary custom keys and nested JSON without registration', () => {
    expect(getTransformStateErrors({ value: { custom: { steps: [1, 'a', null, true] } } })).toEqual(
      [],
    )
  })

  it('should validate standard shapes under built-in keys', () => {
    expect(getTransformStateErrors({ value: { crop: 'custom' } })).toEqual([
      expect.objectContaining({ path: '_transforms.crop' }),
    ])
    expect(
      getTransformStateErrors({ value: { crop: { x: 0, y: 0, width: 2, height: 2 } } }),
    ).toEqual([])
  })

  it('should reject crop overflow against the retained original', () => {
    expect(
      getTransformStateErrors({
        doc: { original: { width: 20, height: 10 } },
        value: { crop: { x: 10, y: 0, width: 11, height: 10 } },
      }),
    ).toEqual([expect.objectContaining({ path: '_transforms.crop.width' })])
  })

  it.each([
    { resize: {} },
    { flip: { horizontal: false, vertical: false } },
    { focalPoint: { x: 101, y: 0 } },
    { clip: { startMs: 2, endMs: 1 } },
    { pageRange: { startPage: 0, endPage: 1 } },
    { encoding: { quality: 101 } },
    { rotate: { angle: Infinity } },
    { crop: { x: 0, y: 0, width: 1, height: 1, unit: '%' } },
  ])('should reject invalid built-in intent %j', (value) => {
    expect(getTransformStateErrors({ value })).not.toEqual([])
  })

  it.each([undefined, null, {}, { rotate: { angle: -450 } }])(
    'should accept absent, cleared, or valid state %j',
    (value) => {
      expect(getTransformStateErrors({ value })).toEqual([])
    },
  )

  it.each([
    [],
    'x',
    { custom: NaN },
    { custom: undefined },
    { custom: new Date() },
    { custom: () => 1 },
  ])('should reject non-JSON containers or values %j', (value) => {
    expect(getTransformStateErrors({ value })).not.toEqual([])
  })

  it('should reject cycles without recursing indefinitely', () => {
    const value: Record<string, unknown> = {}
    value.self = value
    expect(getTransformStateErrors({ value })).toEqual([
      expect.objectContaining({ path: '_transforms.self' }),
    ])
  })
})

describe('resolveTransformStateWrite', () => {
  const originalDoc = { _transforms: { rotate: { angle: 90 }, custom: { mode: 'a' } } }

  it('should preserve omitted state', () => {
    expect(resolveTransformStateWrite({ data: {}, originalDoc }).value).toEqual(
      originalDoc._transforms,
    )
    expect(resolveTransformStateWrite({ data: {}, originalDoc }).hasChanged).toBe(false)
  })

  it('should replace the complete object and remove omitted keys', () => {
    expect(
      resolveTransformStateWrite({ data: { _transforms: { custom: 'b' } }, originalDoc }).value,
    ).toEqual({ custom: 'b' })
  })

  it.each([null, {}])('should clear state with %j', (_transforms) => {
    expect(resolveTransformStateWrite({ data: { _transforms }, originalDoc }).value).toBeNull()
  })

  it('should clear omitted state when replacing the original', () => {
    expect(
      resolveTransformStateWrite({ data: {}, isReplacingOriginal: true, originalDoc }).value,
    ).toBeNull()
  })

  it('should preserve explicit state for a replacement original', () => {
    expect(
      resolveTransformStateWrite({
        data: { _transforms: { custom: 1 } },
        isReplacingOriginal: true,
        originalDoc,
      }).value,
    ).toEqual({ custom: 1 })
  })

  it('should treat reordered object keys as unchanged', () => {
    expect(
      resolveTransformStateWrite({
        data: { _transforms: { custom: { mode: 'a' }, rotate: { angle: 90 } } },
        originalDoc,
      }).hasChanged,
    ).toBe(false)
  })
})

describe('legacy focal read compatibility', () => {
  it('should preserve zero and the original document', () => {
    const doc = { focalX: 0, focalY: 100 }

    expect(migrateLegacyFocalPoint({ doc })).toEqual({
      ...doc,
      _transforms: { focalPoint: { x: 0, y: 100 } },
    })
    expect(doc).toEqual({ focalX: 0, focalY: 100 })
  })
  it('should preserve canonical replacements that omit focalPoint', () => {
    const doc = {
      focalX: 10,
      focalY: 20,
      _transforms: { crop: { x: 0, y: 0, width: 2, height: 2 } },
    }

    expect(migrateLegacyFocalPoint({ doc })).toBe(doc)
  })
  it.each([
    { focalX: 0 },
    { focalX: '0', focalY: 100 },
    { focalX: -1, focalY: 100 },
    { focalX: NaN, focalY: 100 },
  ])('should ignore malformed legacy data %j', (doc) => {
    expect(migrateLegacyFocalPoint({ doc })).toBe(doc)
  })
})

const collection = { slug: 'media', upload: {} } as SanitizedCollectionConfig
const req = { payload: { config: { routes: { api: '/api' } } } } as PayloadRequest
const original = { filename: 'a.png', filesize: 1, url: '/api/media/file/a.png' }

describe('materialized representation ownership', () => {
  it('should reuse a stored default even when the original shares its bytes', () => {
    expect(canReuseStoredDefault({ collection, req, doc: { ...original, original } })).toBe(true)
  })

  it('should require a physical descriptor for a requested variant', () => {
    const doc = {
      ...original,
      original,
      variants: {
        small: {
          filename: 'small.png',
          filesize: null as null | number,
          url: '/api/media/file/small.png',
        },
      },
    }

    expect(canReuseStoredDefault({ collection, req, doc, filename: 'small.png' })).toBe(false)
    doc.variants.small.filesize = 1
    expect(canReuseStoredDefault({ collection, req, doc, filename: 'small.png' })).toBe(true)
  })

  it('should not infer stored bytes from a logical filename and URL', () => {
    expect(
      canReuseStoredDefault({
        collection,
        req,
        doc: {
          filename: 'default.png',
          filesize: null as null | number,
          url: '/api/media/file/default.png',
          original,
        },
      }),
    ).toBe(false)
  })
})

const stage = ({ keys, slug }: { keys?: string[]; slug: string }): PlannedTransformer => ({
  handledTransformKeys: keys,
  transformer: { mimeTypes: ['*/*'], slug },
})

describe('assertTransformCoverage', () => {
  it('should accept custom keys without schema definitions when each has one owner', () => {
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom'], slug: 'a' })],
        state: { custom: [1, 2] },
      }),
    ).not.toThrow()
  })

  it('should reject missing coverage', () => {
    expect(() =>
      assertTransformCoverage({ pipeline: [stage({ slug: 'a' })], state: { custom: 1 } }),
    ).toThrow('custom')
  })

  it('should reject duplicate ownership', () => {
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom'], slug: 'a' }), stage({ keys: ['custom'], slug: 'b' })],
        state: { custom: 1 },
      }),
    ).toThrow('custom')
  })

  it('should reject claims for absent state and duplicate claims within one adapter', () => {
    expect(() =>
      assertTransformCoverage({ pipeline: [stage({ keys: ['custom'], slug: 'a' })], state: null }),
    ).toThrow('custom')
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom', 'custom'], slug: 'a' })],
        state: { custom: 1 },
      }),
    ).toThrow('custom')
  })
})

const transformer = {
  slug: 'custom',
  mimeTypes: ['image/*'],
  transformDefinitions: {
    watermark: {
      type: 'object' as const,
      description: 'Watermark intent interpreted by this adapter.',
      properties: { text: { type: 'string' as const, description: 'Visible watermark text.' } },
      required: ['text'],
      additionalProperties: false,
    },
  },
}

describe('optional transform definitions', () => {
  it('should add custom properties and descriptions without closing the container or mutating shared schemas', () => {
    const schema = buildTransformStateJSONSchema({ transformers: [transformer] })
    const objectSchema = schema.schema.anyOf!.find((branch) => branch.type === 'object')!

    expect(objectSchema.properties?.watermark).toEqual(transformer.transformDefinitions.watermark)
    expect(objectSchema.properties?.crop).toBeDefined()
    expect(objectSchema.additionalProperties).not.toBe(false)
    expect(JSON.stringify(transformStateJSONSchema)).not.toContain('watermark')
  })

  it('should reject a definition that attempts to redefine a built-in key', () => {
    expect(() =>
      buildTransformStateJSONSchema({
        transformers: [
          {
            ...transformer,
            transformDefinitions: { crop: { type: 'string' } },
          },
        ],
      }),
    ).toThrow(/crop/)
  })

  it('should reject conflicting custom definitions rather than depend on adapter order', () => {
    expect(() =>
      buildTransformStateJSONSchema({
        transformers: [
          transformer,
          {
            ...transformer,
            slug: 'second',
            transformDefinitions: { watermark: { type: 'string' } },
          },
        ],
      }),
    ).toThrow(/watermark/)
  })

  it('should allow identical custom definitions across adapters', () => {
    expect(
      buildTransformStateJSONSchema({
        transformers: [transformer, { ...transformer, slug: 'second' }],
      }),
    ).toEqual(buildTransformStateJSONSchema({ transformers: [transformer] }))
  })
})

describe('removed transformer containers', () => {
  it.each(['group', 'tabs'] as const)(
    'should validate required descendants of removed %s',
    async (kind) => {
      const child = {
        name: 'required',
        type: 'text' as const,
        required: true,
        validate: (value: unknown) => (value ? true : 'Required child.'),
      }
      const fields =
        kind === 'group'
          ? [{ name: 'container', type: 'group', fields: [child] }]
          : [{ type: 'tabs', tabs: [{ name: 'container', label: 'Container', fields: [child] }] }]

      for (const value of [undefined, null, {}]) {
        await expect(
          validateTransformedDocument({
            collection: { slug: 'media', fields } as SanitizedCollectionConfig,
            doc: { container: value },
            originalDoc: { container: { other: true } },
            operation: 'update',
            req: { payload: { config: {} }, t: (key: string) => key } as PayloadRequest,
          }),
        ).rejects.toMatchObject({
          data: { errors: [expect.objectContaining({ path: 'container.required' })] },
        })
      }
    },
  )
})
