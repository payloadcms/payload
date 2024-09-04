import joi from 'joi'

import { endpointsSchema } from '../../config/schema'
import {
  componentSchema,
  customViewSchema,
  livePreviewSchema,
} from '../../config/shared/componentSchema'

const strategyBaseSchema = joi.object().keys({
  logout: joi.boolean(),
  refresh: joi.boolean(),
})

const collectionSchema = joi.object().keys({
  slug: joi.string().required(),
  access: joi.object({
    admin: joi.func(),
    create: joi.func(),
    delete: joi.func(),
    read: joi.func(),
    readVersions: joi.func(),
    unlock: joi.func(),
    update: joi.func(),
  }),
  admin: joi.object({
    components: joi.object({
      AfterList: joi.array().items(componentSchema),
      AfterListTable: joi.array().items(componentSchema),
      BeforeList: joi.array().items(componentSchema),
      BeforeListTable: joi.array().items(componentSchema),
      edit: joi.object({
        PreviewButton: componentSchema,
        PublishButton: componentSchema,
        SaveButton: componentSchema,
        SaveDraftButton: componentSchema,
      }),
      views: joi.object({
        Edit: joi.alternatives().try(
          componentSchema,
          joi.object({
            API: joi.alternatives().try(componentSchema, customViewSchema),
            Default: joi.alternatives().try(componentSchema, customViewSchema),
            LivePreview: joi.alternatives().try(componentSchema, customViewSchema),
            Version: joi.alternatives().try(componentSchema, customViewSchema),
            Versions: joi.alternatives().try(componentSchema, customViewSchema),
            // Relationships
            // References
          }),
        ),
        List: joi.alternatives().try(
          componentSchema,
          joi.object({
            Component: componentSchema,
            actions: joi.array().items(componentSchema),
          }),
        ),
      }),
    }),
    defaultColumns: joi.array().items(joi.string()),
    description: joi.alternatives().try(joi.string(), componentSchema),
    disableDuplicate: joi.bool(),
    enableRichTextLink: joi.boolean(),
    enableRichTextRelationship: joi.boolean(),
    group: joi.alternatives().try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    hidden: joi.alternatives().try(joi.boolean(), joi.func()),
    hideAPIURL: joi.bool(),
    hooks: joi.object({
      beforeDuplicate: joi.func(),
    }),
    listSearchableFields: joi.array().items(joi.string()),
    livePreview: joi.object(livePreviewSchema),
    pagination: joi.object({
      defaultLimit: joi.number(),
      limits: joi.array().items(joi.number()),
    }),
    preview: joi.func(),
    useAsTitle: joi.string(),
  }),
  auth: joi.alternatives().try(
    joi.object({
      cookies: joi.object().keys({
        domain: joi.string(),
        sameSite: joi.string(), // TODO: add further specificity with joi.xor
        secure: joi.boolean(),
      }),
      depth: joi.number(),
      disableLocalStrategy: joi.boolean().valid(true),
      forgotPassword: joi.object().keys({
        generateEmailHTML: joi.func(),
        generateEmailSubject: joi.func(),
      }),
      lockTime: joi.number(),
      maxLoginAttempts: joi.number(),
      removeTokenFromResponses: joi.boolean().valid(true),
      strategies: joi.array().items(
        joi.alternatives().try(
          strategyBaseSchema.keys({
            name: joi.string().required(),
            strategy: joi.func().maxArity(1).required(),
          }),
          strategyBaseSchema.keys({
            name: joi.string(),
            strategy: joi.object().required(),
          }),
        ),
      ),
      tokenExpiration: joi.number(),
      useAPIKey: joi.boolean(),
      verify: joi.alternatives().try(
        joi.boolean(),
        joi.object().keys({
          generateEmailHTML: joi.func(),
          generateEmailSubject: joi.func(),
        }),
      ),
    }),
    joi.boolean(),
  ),
  custom: joi.object().pattern(joi.string(), joi.any()),
  db: joi.object(),
  dbName: joi.alternatives().try(joi.string(), joi.func()),
  defaultSort: joi.string(),
  endpoints: endpointsSchema,
  fields: joi.array(),
  graphQL: joi.alternatives().try(
    joi.object().keys({
      pluralName: joi.string(),
      singularName: joi.string(),
    }),
    joi.boolean(),
  ),
  hooks: joi.object({
    afterChange: joi.array().items(joi.func()),
    afterDelete: joi.array().items(joi.func()),
    afterForgotPassword: joi.array().items(joi.func()),
    afterLogin: joi.array().items(joi.func()),
    afterLogout: joi.array().items(joi.func()),
    afterMe: joi.array().items(joi.func()),
    afterOperation: joi.array().items(joi.func()),
    afterRead: joi.array().items(joi.func()),
    afterRefresh: joi.array().items(joi.func()),
    beforeChange: joi.array().items(joi.func()),
    beforeDelete: joi.array().items(joi.func()),
    beforeLogin: joi.array().items(joi.func()),
    beforeOperation: joi.array().items(joi.func()),
    beforeRead: joi.array().items(joi.func()),
    beforeValidate: joi.array().items(joi.func()),
    me: joi.array().items(joi.func()),
    refresh: joi.array().items(joi.func()),
  }),
  indexes: joi.array().items(
    joi.object().keys({
      fields: joi.object().required(),
      options: joi.object(),
    }),
  ),
  labels: joi.object({
    plural: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    singular: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
  }),
  timestamps: joi.boolean(),
  typescript: joi.object().keys({
    interface: joi.string(),
  }),
  upload: joi.alternatives().try(
    joi.object({
      adminThumbnail: joi.alternatives().try(joi.string(), joi.func()),
      crop: joi.bool(),
      disableLocalStorage: joi.bool(),
      displayPreview: joi.bool().default(false),
      externalFileHeaderFilter: joi.func(),
      filesRequiredOnCreate: joi.bool(),
      focalPoint: joi.bool(),
      formatOptions: joi.object().keys({
        format: joi.string(),
        options: joi.object(),
      }),
      handlers: joi.array().items(joi.func()),
      imageSizes: joi.array().items(
        joi
          .object()
          .keys({
            name: joi.string(),
            crop: joi.string(), // TODO: add further specificity with joi.xor
            height: joi.number().integer().allow(null),
            width: joi.number().integer().allow(null),
          })
          .unknown(),
      ),
      mimeTypes: joi.array().items(joi.string()),
      resizeOptions: joi
        .object()
        .keys({
          background: joi.string(),
          fastShrinkOnLoad: joi.bool(),
          fit: joi.string(),
          height: joi.number().allow(null),
          kernel: joi.string(),
          position: joi.alternatives().try(joi.string(), joi.number()),
          width: joi.number().allow(null),
          withoutEnlargement: joi.bool(),
        })
        .allow(null),
      staticDir: joi.string(),
      staticOptions: joi.object(),
      staticURL: joi.string(),
      tempFileDir: joi.string(),
      trimOptions: joi.alternatives().try(
        joi.object().keys({
          format: joi.string(),
          options: joi.object(),
        }),
        joi.string(),
        joi.number(),
      ),
      useTempFiles: joi.bool(),
      withMetadata: joi.alternatives().try(joi.boolean(), joi.func()),
    }),
    joi.boolean(),
  ),
  versions: joi.alternatives().try(
    joi.object({
      drafts: joi.alternatives().try(
        joi.object({
          autosave: joi.alternatives().try(
            joi.boolean(),
            joi.object({
              interval: joi.number(),
            }),
          ),
          validate: joi.boolean(),
        }),
        joi.boolean(),
      ),
      maxPerDoc: joi.number(),
    }),
    joi.boolean(),
  ),
})

export default collectionSchema
