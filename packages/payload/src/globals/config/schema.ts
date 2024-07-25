import joi from 'joi'

import { endpointsSchema } from '../../config/schema'
import {
  componentSchema,
  customViewSchema,
  livePreviewSchema,
} from '../../config/shared/componentSchema'

const globalSchema = joi
  .object()
  .keys({
    slug: joi.string().required(),
    access: joi.object({
      read: joi.func(),
      readVersions: joi.func(),
      update: joi.func(),
    }),
    admin: joi.object({
      components: joi.object({
        elements: joi.object({
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
              Preview: joi.alternatives().try(componentSchema, customViewSchema),
              Version: joi.alternatives().try(componentSchema, customViewSchema),
              Versions: joi.alternatives().try(componentSchema, customViewSchema),
              // Relationships
              // References
            }),
          ),
        }),
      }),
      description: joi.alternatives().try(joi.string(), componentSchema),
      group: joi
        .alternatives()
        .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
      hidden: joi.alternatives().try(joi.boolean(), joi.func()),
      hideAPIURL: joi.boolean(),
      livePreview: joi.object(livePreviewSchema),
      preview: joi.func(),
    }),
    custom: joi.object().pattern(joi.string(), joi.any()),
    dbName: joi.alternatives().try(joi.string(), joi.func()),
    endpoints: endpointsSchema,
    fields: joi.array(),
    graphQL: joi.alternatives().try(
      joi.object().keys({
        name: joi.string(),
      }),
      joi.boolean(),
    ),
    hooks: joi.object({
      afterChange: joi.array().items(joi.func()),
      afterRead: joi.array().items(joi.func()),
      beforeChange: joi.array().items(joi.func()),
      beforeRead: joi.array().items(joi.func()),
      beforeValidate: joi.array().items(joi.func()),
    }),
    label: joi.alternatives().try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    typescript: joi.object().keys({
      interface: joi.string(),
    }),
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
        max: joi.number(),
      }),
      joi.boolean(),
    ),
  })
  .unknown()

export default globalSchema
