import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';
import { endpointsSchema } from '../../config/schema';

const strategyBaseSchema = joi.object().keys({
  refresh: joi.boolean(),
  logout: joi.boolean(),
});

const collectionSchema = joi.object().keys({
  slug: joi.string().required(),
  labels: joi.object({
    singular: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
    plural: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
  }),
  access: joi.object({
    create: joi.func(),
    read: joi.func(),
    readVersions: joi.func(),
    update: joi.func(),
    delete: joi.func(),
    unlock: joi.func(),
    admin: joi.func(),
  }),
  defaultSort: joi.string(),
  graphQL: joi.object().keys({
    singularName: joi.string(),
    pluralName: joi.string(),
  }),
  typescript: joi.object().keys({
    interface: joi.string(),
  }),
  timestamps: joi.boolean(),
  admin: joi.object({
    hidden: joi.alternatives().try(
      joi.boolean(),
      joi.func(),
    ),
    useAsTitle: joi.string(),
    defaultColumns: joi.array().items(joi.string()),
    listSearchableFields: joi.array().items(joi.string()),
    group: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
    description: joi.alternatives().try(
      joi.string(),
      componentSchema,
    ),
    hooks: joi.object({
      beforeDuplicate: joi.func(),
    }),
    enableRichTextRelationship: joi.boolean(),
    components: joi.object({
      views: joi.object({
        List: componentSchema,
        Edit: componentSchema,
      }),
    }),
    pagination: joi.object({
      defaultLimit: joi.number(),
      limits: joi.array().items(joi.number()),
    }),
    preview: joi.func(),
    disableDuplicate: joi.bool(),
    hideAPIURL: joi.bool(),
  }),
  fields: joi.array(),
  hooks: joi.object({
    beforeOperation: joi.array().items(joi.func()),
    beforeValidate: joi.array().items(joi.func()),
    beforeChange: joi.array().items(joi.func()),
    afterChange: joi.array().items(joi.func()),
    beforeRead: joi.array().items(joi.func()),
    afterRead: joi.array().items(joi.func()),
    beforeDelete: joi.array().items(joi.func()),
    afterDelete: joi.array().items(joi.func()),
    beforeLogin: joi.array().items(joi.func()),
    afterLogin: joi.array().items(joi.func()),
    afterLogout: joi.array().items(joi.func()),
    afterMe: joi.array().items(joi.func()),
    afterRefresh: joi.array().items(joi.func()),
    afterForgotPassword: joi.array().items(joi.func()),
  }),
  endpoints: endpointsSchema,
  auth: joi.alternatives().try(
    joi.object({
      tokenExpiration: joi.number(),
      depth: joi.number(),
      verify: joi.alternatives().try(
        joi.boolean(),
        joi.object().keys({
          generateEmailHTML: joi.func(),
          generateEmailSubject: joi.func(),
        }),
      ),
      lockTime: joi.number(),
      useAPIKey: joi.boolean(),
      cookies: joi.object().keys({
        secure: joi.boolean(),
        sameSite: joi.string(), // TODO: add further specificity with joi.xor
        domain: joi.string(),
      }),
      forgotPassword: joi.object().keys({
        generateEmailHTML: joi.func(),
        generateEmailSubject: joi.func(),
      }),
      maxLoginAttempts: joi.number(),
      disableLocalStrategy: joi.boolean().valid(true),
      strategies: joi.array().items(joi.alternatives().try(
        strategyBaseSchema.keys({
          name: joi.string().required(),
          strategy: joi.func()
            .maxArity(1)
            .required(),
        }),
        strategyBaseSchema.keys({
          name: joi.string(),
          strategy: joi.object().required(),
        }),
      )),
    }),
    joi.boolean(),
  ),
  versions: joi.alternatives().try(
    joi.object({
      maxPerDoc: joi.number(),
      drafts: joi.alternatives().try(
        joi.object({
          autosave: joi.alternatives().try(
            joi.boolean(),
            joi.object({
              interval: joi.number(),
            }),
          ),
        }),
        joi.boolean(),
      ),
    }),
    joi.boolean(),
  ),
  upload: joi.alternatives().try(
    joi.object({
      staticURL: joi.string(),
      staticDir: joi.string(),
      disableLocalStorage: joi.bool(),
      useTempFiles: joi.bool(),
      tempFileDir: joi.string(),
      adminThumbnail: joi.alternatives().try(
        joi.string(),
        joi.func(),
      ),
      imageSizes: joi.array().items(
        joi.object().keys({
          name: joi.string(),
          width: joi.number().integer().allow(null),
          height: joi.number().integer().allow(null),
          crop: joi.string(), // TODO: add further specificity with joi.xor
        }).unknown(),
      ),
      mimeTypes: joi.array().items(joi.string()),
      staticOptions: joi.object(),
      handlers: joi.array().items(joi.func()),
      resizeOptions: joi.object().keys({
        width: joi.number().allow(null),
        height: joi.number().allow(null),
        fit: joi.string(),
        position: joi.alternatives().try(
          joi.string(),
          joi.number(),
        ),
        background: joi.string(),
        kernel: joi.string(),
        withoutEnlargement: joi.bool(),
        fastShrinkOnLoad: joi.bool(),
      }).allow(null),
      formatOptions: joi.object().keys({
        format: joi.string(),
        options: joi.object(),
      }),
    }),
    joi.boolean(),
  ),
  custom: joi.object().pattern(joi.string(), joi.any()),
});

export default collectionSchema;
