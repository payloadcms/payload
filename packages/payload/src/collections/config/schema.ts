import joi from 'joi'

import { endpointsSchema } from '../../config/schema.js'
import {
  componentSchema,
  customViewSchema,
  livePreviewSchema,
} from '../../config/shared/componentSchema.js'
import { openGraphSchema } from '../../config/shared/openGraphSchema.js'

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
      afterList: joi.array().items(componentSchema),
      afterListTable: joi.array().items(componentSchema),
      beforeList: joi.array().items(componentSchema),
      beforeListTable: joi.array().items(componentSchema),
      edit: joi.object({
        Description: componentSchema,
        PreviewButton: componentSchema,
        PublishButton: componentSchema,
        SaveButton: componentSchema,
        SaveDraftButton: componentSchema,
        Upload: componentSchema,
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
    custom: joi.object().pattern(joi.string(), joi.any()),
    defaultColumns: joi.array().items(joi.string()),
    description: joi
      .alternatives()
      .try(joi.func(), joi.object().pattern(joi.string(), [joi.string()]), joi.string()),
    enableRichTextLink: joi.boolean(),
    enableRichTextRelationship: joi.boolean(),
    group: joi.alternatives().try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    hidden: joi.alternatives().try(joi.boolean(), joi.func()),
    hideAPIURL: joi.bool(),
    listSearchableFields: joi.array().items(joi.string()),
    livePreview: joi.object(livePreviewSchema),
    meta: joi.object({
      description: joi.string(),
      openGraph: openGraphSchema,
    }),
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
      loginWithUsername: joi.alternatives().try(
        joi.boolean(),
        joi.object().keys({
          allowEmailLogin: joi.boolean(),
          requireEmail: joi.boolean(),
        }),
      ),
      maxLoginAttempts: joi.number(),
      removeTokenFromResponses: joi.boolean().valid(true),
      strategies: joi.array().items(
        joi.object().keys({
          name: joi.string().required(),
          authenticate: joi.func().required(),
        }),
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
  dbName: joi.alternatives().try(joi.string(), joi.func()),
  defaultSort: joi.string(),
  disableDuplicate: joi.bool(),
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
  labels: joi.object({
    plural: joi
      .alternatives()
      .try(joi.func(), joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    singular: joi
      .alternatives()
      .try(joi.func(), joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
  }),
  timestamps: joi.boolean(),
  typescript: joi.object().keys({
    interface: joi.string(),
  }),
  upload: joi.alternatives().try(
    joi.object({
      adapter: joi.string(),
      adminThumbnail: joi.alternatives().try(joi.string(), componentSchema),
      crop: joi.bool(),
      disableLocalStorage: joi.bool(),
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
      modifyResponseHeaders: joi.func(),
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
