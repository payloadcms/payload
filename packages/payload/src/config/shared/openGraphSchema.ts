import joi from 'joi'

export const openGraphSchema = joi.object({
  description: joi.string(),
  images: joi.array().items(
    joi.object({
      alt: joi.string(),
      height: joi.number(),
      url: joi.string(),
      width: joi.number(),
    }),
  ),
  siteName: joi.string(),
  title: joi.string(),
  url: joi.string(),
})
