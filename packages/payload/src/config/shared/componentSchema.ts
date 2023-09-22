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
  Component: componentSchema.required(),
  Tab: joi.alternatives().try(documentTabSchema, componentSchema),
  path: joi.string().required(),
})
