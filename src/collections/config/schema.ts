import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';

const collectionSchema = joi.object().keys({
  slug: joi.string().required(),
  labels: joi.object({
    singular: joi.string(),
    plural: joi.string(),
  }),
  id: joi.any(),
  access: joi.object({
    create: joi.func(),
    read: joi.func(),
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
    preview: joi.func(),
    disableDuplicate: joi.bool(),
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
    afterForgotPassword: joi.array().items(joi.func()),
  }),
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
    }),
    joi.boolean(),
  ),
});

export default collectionSchema;
