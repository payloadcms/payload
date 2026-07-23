import type { CollectionBeforeChangeHook, CollectionConfig, GlobalConfig } from 'payload'

import path from 'path'
import { saveVersion } from 'payload'
import { fileURLToPath } from 'url'

// Direct internal import intentionally exercises the upload write guard.
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { uploadFiles } from '../../packages/payload/src/uploads/uploadFiles.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const validationCollectionSlug = 'validation-items'
export const validationGlobalSlug = 'validation-settings'
export const writeTargetsSlug = 'validation-write-targets'
export const validationUploadsSlug = 'validation-uploads'
export const validationUploadsDir = path.resolve(dirname, 'validation-uploads')

type HookEvent = {
  context: Record<string, unknown>
  hook: string
  operation: string
  requestOperation: string | undefined
}

export const hookEvents: HookEvent[] = []
export const accessEvents: string[] = []

export function clearValidationEvents(): void {
  accessEvents.length = 0
  hookEvents.length = 0
}

function recordHook({ context, hook, operation, requestOperation }: HookEvent): void {
  hookEvents.push({
    context: { ...context },
    hook,
    operation,
    requestOperation,
  })
}

const runWriteAttempt: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'validate') {
    return data
  }

  const targetID = data.targetID as string | undefined

  switch (data.writeAttempt) {
    case 'create':
      await req.payload.create({
        collection: writeTargetsSlug,
        data: { title: 'must not be created' },
        disableTransaction: true,
        req,
      })
      break

    case 'delete':
      await req.payload.delete({
        id: targetID!,
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
      })
      break

    case 'update':
      await req.payload.update({
        id: targetID!,
        collection: writeTargetsSlug,
        data: { title: 'must not be updated' },
        disableTransaction: true,
        req,
      })
      break

    case 'upload': {
      const fileData = Buffer.from('must not be uploaded')

      await uploadFiles(
        req.payload,
        [
          {
            buffer: fileData,
            path: path.join(validationUploadsDir, 'blocked.txt'),
          },
        ],
        req,
      )
      break
    }

    case 'version':
      await saveVersion({
        id: targetID,
        collection: req.payload.collections[writeTargetsSlug]!.config,
        docWithLocales: {
          id: targetID,
          title: 'must not create a version',
        },
        operation: 'update',
        payload: req.payload,
        req,
      })
      break
  }

  return data
}

const validationCollection: CollectionConfig = {
  slug: validationCollectionSlug,
  access: {
    validate: ({ req }) => {
      accessEvents.push('collection')
      return req.payloadAPI === 'REST' || req.context.allowValidation === true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ context, operation, req, value }) => {
            recordHook({
              context,
              hook: 'fieldBeforeChange',
              operation,
              requestOperation: req.operation,
            })
            return value
          },
        ],
        beforeValidate: [
          ({ context, operation, req, value }) => {
            recordHook({
              context,
              hook: 'fieldBeforeValidate',
              operation,
              requestOperation: req.operation,
            })
            return value
          },
        ],
      },
      localized: true,
      required: true,
      validate: (value, { operation, req }) => {
        recordHook({
          context: req.context,
          hook: 'fieldValidate',
          operation,
          requestOperation: req.operation,
        })
        return typeof value === 'string' && value.length > 0 ? true : 'Title is required'
      },
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'text',
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'location',
      type: 'point',
      validate: (value) =>
        value === undefined || (Array.isArray(value) && value.length === 2)
          ? true
          : 'Location must use the public point tuple representation',
    },
    {
      name: 'writeAttempt',
      type: 'select',
      options: ['create', 'delete', 'update', 'upload', 'version'],
    },
    {
      name: 'targetID',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'collectionBeforeChange',
          operation,
          requestOperation: req.operation,
        })

        if (req.context.throwValidationHook === true) {
          throw new Error('collection validation hook failure')
        }

        return data
      },
      runWriteAttempt,
    ],
    beforeValidate: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'collectionBeforeValidate',
          operation,
          requestOperation: req.operation,
        })
        return data
      },
    ],
  },
  versions: false,
}

const validationGlobal: GlobalConfig = {
  slug: validationGlobalSlug,
  access: {
    validate: ({ req }) => {
      accessEvents.push('global')
      return req.payloadAPI === 'REST' || req.context.allowValidation === true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'point',
      validate: (value) =>
        value === undefined || (Array.isArray(value) && value.length === 2)
          ? true
          : 'Location must use the public point tuple representation',
    },
  ],
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'globalBeforeChange',
          operation,
          requestOperation: req.operation,
        })

        if (req.context.throwValidationHook === true) {
          throw new Error('global validation hook failure')
        }

        return data
      },
    ],
    beforeValidate: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'globalBeforeValidate',
          operation,
          requestOperation: req.operation,
        })
        return data
      },
    ],
  },
  versions: false,
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    validationCollection,
    {
      slug: writeTargetsSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      versions: true,
    },
    {
      slug: validationUploadsSlug,
      fields: [],
      upload: {
        staticDir: validationUploadsDir,
      },
      versions: false,
    },
  ],
  globals: [validationGlobal],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
})
