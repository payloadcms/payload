import joi from 'joi'

export const componentSchema = joi.alternatives().try(joi.object().unknown(), joi.func())

export const documentTabSchema = {
  condition: joi.func(),
  href: joi.alternatives().try(joi.string(), joi.func()).required(),
  isActive: joi.alternatives().try(joi.func(), joi.boolean()),
  label: joi.alternatives().try(joi.string(), joi.func()).required(),
  newTab: joi.boolean(),
  pillLabel: joi.alternatives().try(joi.string(), joi.func()),
}

export const customViewSchema = joi.object({
  Component: componentSchema,
  Tab: joi.alternatives().try(documentTabSchema, componentSchema),
  actions: joi.array().items(componentSchema),
  path: joi.string(),
})

export const livePreviewSchema = {
  breakpoints: joi.array().items(
    joi.object({
      name: joi.string(),
      height: joi.alternatives().try(joi.number(), joi.string()),
      label: joi.string(),
      width: joi.alternatives().try(joi.number(), joi.string()),
    }),
  ),
  url: joi.alternatives().try(joi.string(), joi.func()),
}
