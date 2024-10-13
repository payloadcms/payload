import mongoose from 'mongoose'

const internalFields = ['__v']

/**
 * Mutates the mongodb document result.
 * This is much more performant than `JSON.parse(JSON.stringify(doc)).`
 * - `_id` -> `id`
 * - converts all `ObjectID`s to strings
 * - converts all `Date`s to ISO strings
 * - strips internal fields (`__v`)
 */
export const sanitizeDocument = (doc: Record<string, unknown>, nested = false) => {
  if (!nested) {
    doc['id'] = doc['_id']
    delete doc['_id']
  }

  for (const key in doc) {
    if (!nested && internalFields.includes(key)) {
      delete doc[key]
      continue
    }

    if (doc[key] instanceof mongoose.Types.ObjectId) {
      doc[key] = doc[key].toHexString()
      continue
    }

    if (doc[key] instanceof Date) {
      doc[key] = doc[key].toISOString()
      continue
    }

    if (doc[key] && typeof doc[key] === 'object') {
      if (Array.isArray(doc[key])) {
        doc[key].forEach((item, index) => {
          if (item instanceof mongoose.Types.ObjectId) {
            doc[key][index] = item.toHexString()
          } else {
            sanitizeDocument(item, true)
          }
        })
      } else {
        sanitizeDocument(doc[key] as Record<string, unknown>, true)
      }
    }
  }
}
