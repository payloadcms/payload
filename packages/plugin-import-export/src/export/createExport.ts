import type { PayloadRequest } from 'payload'

import { Buffer } from 'buffer'
import { stringify } from 'csv-stringify/sync'

type Export = {
  collections: {
    fields?: string[]
    slug: string
  }[]
  format: 'csv' | 'json'
  globals?: string[]
  id: number | string
}

type Args = {
  data: Export
  req: PayloadRequest
}

export const createExport = async (args: Args) => {
  const {
    data: { collections = [], format, globals },
    req: { locale, payload, user },
    req,
  } = args

  if (collections.length === 1 && format === 'csv') {
    const { slug, fields } = collections[0]
    const collection = payload.config.collections.find((collection) => collection.slug === slug)
    if (!collection) {
      throw new Error(`Collection with slug ${slug} not found`)
    }

    // TODO: filter fields to only those requested in the export
    const fieldsToExport = fields
      ? collection.flattenedFields.filter((field) => fields.includes(field.name))
      : collection.flattenedFields

    //TODO: add select to only get the fields requested
    const { docs } = await payload.find({
      collection: slug,
      // default limit of 1000, need to handle streams for larger exports
      limit: 1000,
      locale,
      // req,
      user,
    })

    // TODO: handle relationship subfields

    const csvInput = docs.map((doc) => {
      const data = {}
      fieldsToExport.forEach((field) => {
        data[field.name] = doc[field.name]
      })
      return data
    })

    const csv = stringify(csvInput, {
      header: true,
    })

    req.file = {
      name: `${collection.slug}.csv`,
      data: Buffer.from(csv),
      mimetype: 'text/csv',
      size: csv.length,
    }
  }
}
