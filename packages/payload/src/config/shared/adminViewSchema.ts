import joi from 'joi'

import { componentSchema } from './componentSchema'

export const adminViewSchema = joi.array().items(
  joi.object().keys({
    Component: componentSchema,
    exact: joi.bool(),
    path: joi.string().required(),
    sensitive: joi.bool(),
    strict: joi.bool(),
  }),
)
