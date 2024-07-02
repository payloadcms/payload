import joi from 'joi'

const ogImageObj = joi.object({
  type: joi.string(),
  alt: joi.string(),
  height: joi.alternatives().try(joi.string(), joi.number()),
  url: joi.string(),
  width: joi.alternatives().try(joi.string(), joi.number()),
})

export const openGraphSchema = joi.object({
  description: joi.string(),
  images: joi.alternatives().try(ogImageObj, joi.array().items(ogImageObj)),
  siteName: joi.string(),
  title: joi.string(),
})
