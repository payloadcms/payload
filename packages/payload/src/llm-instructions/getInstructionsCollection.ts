import { getTranslation } from '@payloadcms/translations'

import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, SanitizedConfig } from '../config/types.js'
import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { InstructionTargetFields } from './shared.js'

import { getDataLoader } from '../collections/dataloader.js'
import { ValidationError } from '../errors/ValidationError.js'
import { getSelectMode } from '../utilities/getSelectMode.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { getInstructionTargetAccess } from './getInstructionTargetAccess.js'
import { instructionsCollectionSlug } from './shared.js'

const syncContextKey = 'syncLLMInstructions'
const pendingSyncs = new WeakMap<Payload, Promise<void>>()

export const getInstructionsCollection = ({
  config,
}: {
  config: SanitizedConfig
}): CollectionConfig => {
  const targets = [
    ...config.collections
      .filter(({ slug, admin }) => admin.hidden !== true && slug !== instructionsCollectionSlug)
      .map(({ slug, llmInstructions }) => ({
        slug,
        type: 'collection' as const,
        systemInstructions: llmInstructions,
      })),
    ...config.globals
      .filter(({ admin }) => admin.hidden !== true)
      .map(({ slug, llmInstructions }) => ({
        slug,
        type: 'global' as const,
        systemInstructions: llmInstructions,
      })),
  ]
  const options = config.llmInstructions === false ? undefined : config.llmInstructions
  const editorProvider = options?.editor ?? config.editor?.presets?.llmInstructions
  const configuredEditor = editorProvider?.({ config, isRoot: false, parentIsLocalized: false })
  const editor =
    configuredEditor?.converters?.fromMarkdown && configuredEditor.converters.toMarkdown
      ? configuredEditor
      : undefined
  const getTarget = ({ collectionSlug, globalSlug }: InstructionTargetFields = {}) =>
    targets.find((target) =>
      target.type === 'collection' ? target.slug === collectionSlug : target.slug === globalSlug,
    )
  const getTitle = ({ data, req }: { data?: InstructionTargetFields; req: PayloadRequest }) => {
    const target = getTarget(data)

    if (!target) {
      return ''
    }

    const label =
      target.type === 'collection'
        ? req.payload.collections[target.slug]?.config.labels.plural
        : req.payload.config.globals.find((global) => global.slug === target.slug)?.label

    return getTranslation(label || target.slug, req.i18n)
  }
  const canManage: Access =
    options?.access ||
    (({ req }: { req: PayloadRequest }) =>
      Boolean(req.user && req.user.collection === req.payload.config.admin.user))

  return {
    slug: instructionsCollectionSlug,
    access: {
      create: ({ req }) => req.context[syncContextKey] === true,
      delete: () => false,
      read: ({ req }) =>
        req.context[syncContextKey] === true ||
        getInstructionTargetAccess({ operation: 'read', req, targets }),
      update: async (args) => {
        const manageAccess = await canManage(args)

        if (!manageAccess) {
          return false
        }

        const targetAccess = await getInstructionTargetAccess({
          operation: 'update',
          req: args.req,
          targets,
        })

        if (!targetAccess) {
          return false
        }

        return manageAccess === true ? targetAccess : { and: [manageAccess, targetAccess] }
      },
    },
    admin: {
      defaultColumns: ['title', 'updatedAt', 'type', 'additionalInstructions'],
      group: false,
      listSearchableFields: ['title'],
      useAsTitle: 'title',
    },
    disableBulkEdit: true,
    disableDuplicate: true,
    fields: [
      {
        name: 'id',
        type: 'text',
        admin: { hidden: true },
      },
      {
        name: 'collectionSlug',
        type: 'text',
        admin: { hidden: true },
        index: true,
      },
      {
        name: 'globalSlug',
        type: 'text',
        admin: { hidden: true },
        index: true,
      },
      {
        name: 'title',
        type: 'text',
        admin: { hidden: true },
        hooks: {
          afterRead: [({ data, req }) => getTitle({ data, req })],
          beforeChange: [
            ({ data, originalDoc, req }) => getTitle({ data: { ...originalDoc, ...data }, req }),
          ],
        },
        label: ({ t }) => t('llmInstructions:title'),
      },
      {
        name: 'type',
        type: 'select',
        admin: { hidden: true },
        hooks: { afterRead: [({ data }) => getTarget(data)?.type] },
        label: ({ t }) => t('version:type'),
        options: [
          { label: ({ t }) => t('general:collection'), value: 'collection' },
          { label: ({ t }) => t('llmInstructions:global'), value: 'global' },
        ],
        virtual: true,
      },
      {
        type: 'tabs',
        admin: { className: 'llm-instructions' },
        tabs: [
          {
            fields: [
              {
                name: 'additionalInstructionsDescription',
                type: 'ui',
                admin: {
                  components: {
                    Field: '@payloadcms/ui#LLMInstructionsDescription',
                  },
                },
              },
              {
                name: 'additionalInstructions',
                ...(editor ? { type: 'richText' as const, editor } : { type: 'textarea' as const }),
                admin: {
                  className: 'llm-instructions__editor',
                  components: { Cell: '@payloadcms/ui/rsc#LLMInstructionsCell' },
                },
                label: ({ t }) => t('llmInstructions:additionalInstructions'),
              },
            ],
            label: ({ t }) => t('llmInstructions:additionalInstructions'),
          },
          {
            fields: [
              {
                name: 'systemInstructionsDescription',
                type: 'ui',
                admin: {
                  components: {
                    Field: {
                      clientProps: { isSystem: true },
                      path: '@payloadcms/ui#LLMInstructionsDescription',
                    },
                  },
                },
              },
              {
                name: 'systemInstructions',
                ...(editor ? { type: 'richText' as const, editor } : { type: 'textarea' as const }),
                access: { create: () => false, update: () => false },
                admin: {
                  className: 'llm-instructions__editor llm-instructions__editor--system',
                  readOnly: true,
                },
                hooks: {
                  afterRead: [
                    ({ data }) => {
                      const markdown = getTarget(data)?.systemInstructions

                      return markdown
                        ? (editor?.converters?.fromMarkdown?.({ markdown }) ?? markdown)
                        : null
                    },
                  ],
                },
                label: false,
                virtual: true,
              },
            ],
            label: ({ t }) => t('llmInstructions:systemInstructions'),
          },
        ],
      },
    ],
    hooks: {
      beforeOperation: [
        async ({ args, operation, req }) => {
          if (operation !== 'read' || req.context[syncContextKey] || !req.user) {
            return args
          }

          let pending = pendingSyncs.get(req.payload)

          if (!pending) {
            // Only configuration-owned identities are created here. Client requests cannot set context.
            const syncReq = isolateObjectProperty(req, [
              'context',
              'payloadDataLoader',
              'transactionID',
            ])

            syncReq.context = { ...req.context, [syncContextKey]: true }
            // Concurrent readers share this sync, so it must commit independently of the caller.
            delete syncReq.transactionID
            syncReq.payloadDataLoader = getDataLoader(syncReq)

            pending = (async () => {
              const existing = await req.payload.find({
                collection: instructionsCollectionSlug,
                depth: 0,
                limit: 0,
                overrideAccess: false,
                pagination: false,
                req: syncReq,
                select: { collectionSlug: true, globalSlug: true },
                user: req.user,
              })

              for (const target of targets) {
                const field = target.type === 'collection' ? 'collectionSlug' : 'globalSlug'

                if (!existing.docs.some((doc) => doc[field] === target.slug)) {
                  try {
                    await req.payload.create({
                      collection: instructionsCollectionSlug,
                      data: { [field]: target.slug },
                      overrideAccess: false,
                      req: syncReq,
                      user: req.user,
                    })
                  } catch (error) {
                    // Another server may have initialized the same configuration entry concurrently.
                    const existingDoc = await req.payload.find({
                      collection: instructionsCollectionSlug,
                      limit: 1,
                      overrideAccess: false,
                      req: syncReq,
                      user: req.user,
                      where: { [field]: { equals: target.slug } },
                    })

                    if (!existingDoc.docs.length) {
                      throw error
                    }
                  }
                }
              }
            })().finally(() => pendingSyncs.delete(req.payload))
            pendingSyncs.set(req.payload, pending)
          }

          await pending
          return args
        },
      ],
      beforeValidate: [
        ({ data, operation, originalDoc, req }) => {
          const { collectionSlug, globalSlug } = { ...originalDoc, ...data }

          if (Boolean(collectionSlug) === Boolean(globalSlug)) {
            throw new ValidationError({
              collection: instructionsCollectionSlug,
              errors: ['collectionSlug', 'globalSlug'].map((path) => ({
                message: req.t('llmInstructions:targetRequired'),
                path,
              })),
              req,
            })
          }

          if (!getTarget({ collectionSlug, globalSlug })) {
            throw new ValidationError({
              collection: instructionsCollectionSlug,
              errors: [
                {
                  message: req.t('validation:invalidInput'),
                  path: collectionSlug ? 'collectionSlug' : 'globalSlug',
                },
              ],
              req,
            })
          }

          // Keep one configuration-owned row per target without unique indexes on nullable slugs.
          const id = collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug}`

          if (operation === 'update' && originalDoc?.id !== id) {
            throw new ValidationError({
              collection: instructionsCollectionSlug,
              errors: [
                {
                  message: req.t('llmInstructions:targetCannotBeChanged'),
                  path: collectionSlug ? 'collectionSlug' : 'globalSlug',
                },
              ],
              req,
            })
          }

          return { ...data, id }
        },
      ],
    },
    labels: {
      plural: ({ t }) => t('llmInstructions:instructions'),
      singular: ({ t }) => t('llmInstructions:instructions'),
    },
    lockDocuments: false,
    select: ({ select }) => {
      if (!select) {
        return
      }

      if (getSelectMode(select) === 'include') {
        return { ...select, collectionSlug: true, globalSlug: true }
      }

      const targetSelect = { ...select }

      delete targetSelect.collectionSlug
      delete targetSelect.globalSlug

      return targetSelect
    },
    versions: false,
  }
}
