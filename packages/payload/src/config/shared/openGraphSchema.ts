import joi from 'joi'

const ogImageObj = joi.object({
  type: joi.string(),
  alt: joi.string(),
  height: joi.alternatives().try(joi.string(), joi.number()),
  secureUrl: joi.string(),
  url: joi.string(),
  width: joi.alternatives().try(joi.string(), joi.number()),
})

export const openGraphSchema = joi.object({
  alternateLocale: joi.alternatives().try(joi.string(), joi.array().items(joi.string())),
  audio: joi.alternatives().try(joi.array().items(joi.string()), joi.object()),
  countryName: joi.string(),
  description: joi.string(),
  determiner: joi.string().valid('a', 'an', 'the', 'auto', ''),
  emails: joi.alternatives().try(joi.string(), joi.array().items(joi.string())),
  faxNumbers: joi.alternatives().try(joi.string(), joi.array().items(joi.string())),
  images: joi.alternatives().try(joi.array().items(joi.string()), joi.array().items(ogImageObj)),
  locale: joi.string(),
  phoneNumbers: joi.alternatives().try(joi.string(), joi.array().items(joi.string())),
  siteName: joi.string(),
  title: joi.string(),
  ttl: joi.number(),
  url: joi.string(),
  videos: joi.alternatives().try(joi.array().items(joi.string()), joi.object()),
})
