import joi from 'joi'

export const componentSchema = joi.alternatives().try(joi.object().unknown(), joi.func())

export const customViewSchema = {
  Component: componentSchema,
  label: joi.string(),
  path: joi.string(),
}
