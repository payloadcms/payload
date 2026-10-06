import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { TextFieldValidation } from '../../validations.js'

import { describe, expect, it } from 'vitest'

import { beforeChange } from './index.js'

const validateRequiredText: TextFieldValidation = (value) =>
  typeof value === 'string' && value.length > 0 ? true : 'Enter a value'

const runBeforeChange = ({
  collection,
  data,
  document,
  submittedTopLevelFieldNames,
}: {
  collection: SanitizedCollectionConfig
  data: JsonObject
  document: JsonObject
  submittedTopLevelFieldNames: ReadonlySet<string>
}) =>
  beforeChange({
    collection,
    context: {},
    data,
    doc: document,
    docWithLocales: document,
    global: null,
    operation: 'update',
    overrideAccess: true,
    req: {
      locale: 'en',
      payload: {
        config: {},
      },
    } as PayloadRequest,
    skipValidation: false,
    fieldsToValidate: submittedTopLevelFieldNames,
  })

describe('beforeChange', () => {
  it('should skip editor validation for an omitted rich text field', async () => {
    const incompleteRichText = {
      root: {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }
    const editor = {
      hooks: {
        beforeChange: [
          ({ skipValidation, value }) => {
            if (!skipValidation) {
              throw new Error('Unexpected nested rich text validation')
            }

            return value
          },
        ],
      },
    } as RichTextAdapter
    const collection = {
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor,
          label: false,
        },
      ],
      slug: 'posts',
    } as SanitizedCollectionConfig
    const document = {
      richText: incompleteRichText,
    }

    await expect(
      runBeforeChange({
        collection,
        data: {
          deletedAt: '2026-09-09T00:00:00.000Z',
          richText: incompleteRichText,
        },
        document,
        submittedTopLevelFieldNames: new Set(['deletedAt']),
      }),
    ).resolves.toEqual({
      deletedAt: '2026-09-09T00:00:00.000Z',
      richText: incompleteRichText,
    } satisfies JsonObject)
  })

  it('should validate nested fields below a submitted top-level field', async () => {
    const collection = {
      fields: [
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'textInGroup',
              type: 'text',
              validate: validateRequiredText,
            },
          ],
        },
      ],
      slug: 'posts',
    } as SanitizedCollectionConfig
    const document = {
      group: {
        textInGroup: 'Existing value',
      },
    }

    await expect(
      runBeforeChange({
        collection,
        data: {
          group: {
            textInGroup: '',
          },
        },
        document,
        submittedTopLevelFieldNames: new Set(['group']),
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [expect.objectContaining({ path: 'group.textInGroup' })],
      },
    })
  })

  it('should skip nested validation below a top-level field outside the submitted scope', async () => {
    const collection = {
      fields: [
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'textInGroup',
              type: 'text',
              validate: validateRequiredText,
            },
          ],
        },
      ],
      slug: 'posts',
    } as SanitizedCollectionConfig
    const document = {
      group: {
        textInGroup: '',
      },
    }

    await expect(
      runBeforeChange({
        collection,
        data: {
          deletedAt: '2026-09-09T00:00:00.000Z',
          group: {
            textInGroup: '',
          },
        },
        document,
        submittedTopLevelFieldNames: new Set(['deletedAt']),
      }),
    ).resolves.toEqual({
      deletedAt: '2026-09-09T00:00:00.000Z',
      group: {
        textInGroup: '',
      },
    } satisfies JsonObject)
  })

  it('should retain submitted field scope through layout fields', async () => {
    const collection = {
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'textInRow',
              type: 'text',
              validate: validateRequiredText,
            },
          ],
        },
        {
          name: 'omittedText',
          type: 'text',
          validate: validateRequiredText,
        },
      ],
      slug: 'posts',
    } as SanitizedCollectionConfig
    const document = {
      omittedText: '',
      textInRow: 'Existing value',
    }

    await expect(
      runBeforeChange({
        collection,
        data: {
          omittedText: '',
          textInRow: '',
        },
        document,
        submittedTopLevelFieldNames: new Set(['textInRow']),
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [expect.objectContaining({ path: 'textInRow' })],
      },
    })
  })
})

describe('beforeChange all-locale publication', () => {
  const runPublication = async ({
    shouldRemoveStatus = false,
  }: { shouldRemoveStatus?: boolean } = {}) => {
    let processedStatus: unknown
    const document = { _status: { en: 'draft', es: 'draft', xx: 'draft' } }
    const result = await beforeChange({
      collection: {
        fields: [
          {
            name: '_status',
            type: 'select',
            localized: true,
            options: [],
            hooks: {
              beforeChange: [
                ({ siblingData, req, value }) => {
                  if (shouldRemoveStatus && req.locale === 'en') {
                    delete siblingData._status
                    return undefined
                  }
                  return value
                },
              ],
            },
          },
        ],
      } as SanitizedCollectionConfig,
      context: {},
      data: { _status: 'published' },
      doc: document,
      docWithLocales: document,
      global: null,
      onDataProcessed: (data) => {
        processedStatus = data._status
      },
      operation: 'update',
      overrideAccess: true,
      skipValidation: true,
      req: {
        context: {},
        locale: 'all',
        payload: {
          config: {
            blocks: [],
            localization: {
              locales: [{ code: 'en' }, { code: 'es' }, { code: 'xx' }],
              localeCodes: ['en', 'es', 'xx'],
              filterAvailableLocales: ({ locales }) =>
                locales.filter((locale) => locale.code !== 'xx'),
            },
          },
        },
      } as PayloadRequest,
    })

    return { processedStatus, result }
  }

  it('should report scalar intent while retaining inaccessible locale storage status', async () => {
    const { processedStatus, result } = await runPublication()

    expect(processedStatus).toBe('published')
    expect(result._status).toEqual({ en: 'published', es: 'published', xx: 'draft' })
  })

  it('should not report scalar intent removed by a field hook', async () => {
    const { processedStatus } = await runPublication({ shouldRemoveStatus: true })

    expect(processedStatus).not.toBe('published')
  })
})
