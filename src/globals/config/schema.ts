import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';
import { endpointsSchema } from '../../config/schema';

const globalSchema = joi.object().keys({
  slug: joi.string().required(),
  label: joi.alternatives().try(
    joi.string(),
    joi.object().pattern(joi.string(), [joi.string()]),
  ),
  admin: joi.object({
    hidden: joi.alternatives().try(
      joi.boolean(),
      joi.func(),
    ),
    group: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
    hideAPIURL: joi.boolean(),
    description: joi.alternatives().try(
      joi.string(),
      componentSchema,
    ),
    components: joi.object({
      views: joi.object({
        Edit: componentSchema,
      }),
      elements: joi.object({
        SaveButton: componentSchema,
        PublishButton: componentSchema,
        SaveDraftButton: componentSchema,
        PreviewButton: componentSchema,
      }),
    }),
    preview: joi.func(),
  }),
  typescript: joi.object().keys({
    interface: joi.string(),
  }),
  graphQL: joi.object().keys({
    name: joi.string(),
  }),
  hooks: joi.object({
    beforeValidate: joi.array().items(joi.func()),
    beforeChange: joi.array().items(joi.func()),
    afterChange: joi.array().items(joi.func()),
    beforeRead: joi.array().items(joi.func()),
    afterRead: joi.array().items(joi.func()),
  }),
  endpoints: endpointsSchema,
  access: joi.object({
    read: joi.func(),
    readVersions: joi.func(),
    update: joi.func(),
  }),
  fields: joi.array(),
  versions: joi.alternatives().try(
    joi.object({
      max: joi.number(),
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
  custom: joi.object().pattern(joi.string(), joi.any()),
}).unknown();

export default globalSchema;
