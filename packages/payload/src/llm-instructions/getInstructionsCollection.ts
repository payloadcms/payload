import { getTranslation } from '@payloadcms/translations'

import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { InstructionTargetFields } from './shared.js'

import { getDataLoader } from '../collections/dataloader.js'
import { ValidationError } from '../errors/ValidationError.js'
import { getSelectMode } from '../utilities/getSelectMode.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { getInstructionTargetAccess } from './getInstructionTargetAccess.js'
import { instructionsCollectionSlug } from './shared.js'

const syncContextKey = 'syncLLMInstructions'

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
  const getTarget = ({ entitySlug, entityType }: InstructionTargetFields = {}) =>
    targets.find((target) => target.slug === entitySlug && target.type === entityType)
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
      defaultColumns: ['title', 'updatedAt', 'entityType', 'additionalInstructions'],
      group: false,
      listSearchableFields: ['entitySlug'],
      useAsTitle: 'entitySlug',
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
        name: 'entitySlug',
        type: 'text',
        admin: { hidden: true },
        index: true,
        required: true,
      },
      {
        name: 'title',
        type: 'text',
        admin: { hidden: true },
        hooks: {
          afterRead: [({ data, req }) => getTitle({ data, req })],
        },
        label: ({ t }) => t('llmInstructions:title'),
        virtual: true,
      },
      {
        name: 'entityType',
        type: 'select',
        admin: { hidden: true },
        label: ({ t }) => t('version:type'),
        options: [
          { label: ({ t }) => t('general:collection'), value: 'collection' },
          { label: ({ t }) => t('llmInstructions:global'), value: 'global' },
        ],
        required: true,
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

          // Only configuration-owned identities are created here. Client requests cannot set context.
          const syncReq = isolateObjectProperty(req, [
            'context',
            'payloadDataLoader',
            'transactionID',
          ])

          syncReq.context = { ...req.context, [syncContextKey]: true }
          // Initialization must persist even if the caller rolls back its transaction.
          delete syncReq.transactionID
          syncReq.payloadDataLoader = getDataLoader(syncReq)

          const { docs } = await req.payload.find({
            collection: instructionsCollectionSlug,
            depth: 0,
            limit: 0,
            overrideAccess: false,
            pagination: false,
            req: syncReq,
            select: { id: true },
          })
          const existingIDs = new Set(docs.map(({ id }) => id))

          for (const target of targets) {
            const id = `${target.type}-${target.slug}`

            if (existingIDs.has(id)) {
              continue
            }

            try {
              await req.payload.create({
                collection: instructionsCollectionSlug,
                data: { id, entitySlug: target.slug, entityType: target.type },
                disableTransaction: true,
                overrideAccess: false,
                req: syncReq,
                user: req.user,
              })
            } catch (error) {
              // The unique ID allows only one concurrent request to create this entry.
              const existingDoc = await req.payload.findByID({
                id,
                collection: instructionsCollectionSlug,
                depth: 0,
                disableErrors: true,
                overrideAccess: false,
                req: syncReq,
                select: { id: true },
              })

              if (!existingDoc) {
                throw error
              }
            }
          }

          return args
        },
      ],
      beforeValidate: [
        ({ data, operation, originalDoc, req }) => {
          const { entitySlug, entityType } = { ...originalDoc, ...data }

          if (!entitySlug || !entityType) {
            return data
          }

          if (!getTarget({ entitySlug, entityType })) {
            throw new ValidationError({
              collection: instructionsCollectionSlug,
              errors: [
                {
                  message: req.t('validation:invalidInput'),
                  path:
                    entityType === 'collection' || entityType === 'global'
                      ? 'entitySlug'
                      : 'entityType',
                },
              ],
              req,
            })
          }

          const id = `${entityType}-${entitySlug}`

          if (operation === 'update' && originalDoc?.id !== id) {
            throw new ValidationError({
              collection: instructionsCollectionSlug,
              errors: [
                {
                  message: req.t('llmInstructions:targetCannotBeChanged'),
                  path: originalDoc?.entityType !== entityType ? 'entityType' : 'entitySlug',
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
        return { ...select, entitySlug: true, entityType: true }
      }

      const targetSelect = { ...select }

      delete targetSelect.entitySlug
      delete targetSelect.entityType

      return targetSelect
    },
    versions: false,
  }
}
