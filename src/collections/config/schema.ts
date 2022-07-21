import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';

const strategyBaseSchema = joi.object().keys({
  refresh: joi.boolean(),
  logout: joi.boolean(),
});

const collectionSchema = joi.object().keys({
  slug: joi.string().required(),
  labels: joi.object({
    singular: joi.string(),
    plural: joi.string(),
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
  timestamps: joi.boolean(),
  admin: joi.object({
    useAsTitle: joi.string(),
    defaultColumns: joi.array().items(joi.string()),
    description: joi.alternatives().try(
      joi.string(),
      componentSchema,
    ),
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
  endpoints: joi.array().items(joi.object({
    path: joi.string(),
    method: joi.string().valid('get', 'head', 'post', 'put', 'patch', 'delete', 'connect', 'options'),
    handler: joi.alternatives().try(
      joi.array().items(joi.func()),
      joi.func(),
    ),
  })),
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
      retainDeleted: joi.boolean(),
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
      adminThumbnail: joi.alternatives().try(
        joi.string(),
        joi.func(),
      ),
      imageSizes: joi.array().items(
        joi.object().keys({
          name: joi.string(),
          width: joi.number().allow(null),
          height: joi.number().allow(null),
          crop: joi.string(), // TODO: add further specificity with joi.xor
        }),
      ),
      mimeTypes: joi.array().items(joi.string()),
      staticOptions: joi.object(),
    }),
    joi.boolean(),
  ),
});

export default collectionSchema;
