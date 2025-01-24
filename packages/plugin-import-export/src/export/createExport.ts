import type { PayloadRequest, SelectType, TraverseFieldsCallback } from 'payload'

import { Buffer } from 'buffer'
import { stringify } from 'csv-stringify/sync'
import { traverseFields } from 'payload'

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

  // TODO: handle globals

  // TODO: handle more than one collection

  if (collections.length === 1 && format === 'csv') {
    const { slug, fields } = collections[0] as { fields?: string[]; slug: string }
    const collection = payload.config.collections.find((collection) => collection.slug === slug)
    if (!collection) {
      throw new Error(`Collection with slug ${slug} not found`)
    }

    const select: SelectType = {}
    let selectRef = select
    let headers: Record<string, string> = {}

    /**
      reduce fields to filter:
      input will be: ['id', 'title', 'group.value', 'createdAt', 'updatedAt']
      select will be:
      {
        id: true,
        title: true,
        group: {
          value: true,
        },
        createdAt: true,
        updatedAt: true
      }

      field headers will be:
      {
        id: 'id',
        title: 'title',
        group_value: 'group.value',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
       }
      */

    const traverseFieldsCallback: TraverseFieldsCallback<Record<string, unknown>> = ({
      field,
      parentRef,
      ref,
    }) => {
      // always false because we are using flattenedFields but useful for type narrowing
      if (!('name' in field)) {
        return
      }

      if (field.type === 'group') {
        selectRef = select[field.name] = {}
        ref._name = field.name
      }
      const prefix =
        typeof parentRef === 'object' && parentRef?._name && typeof parentRef._name === 'string'
          ? `${parentRef._name}.`
          : ''

      // when fields aren't defined we assume all fields are included
      if (
        fields &&
        'name' in field &&
        !fields.some((f) => {
          const segment = f.indexOf('.') > -1 ? f.substring(0, f.indexOf('.')) : f
          return segment === `${prefix}${field.name}`
        })
      ) {
        return
      }

      if (field.name) {
        selectRef[field.name] = true
      }
    }

    if (fields) {
      headers = fields.reduce((acc: Record<string, string>, field) => {
        const segments = field.split('.')
        let selectRef = select
        segments.forEach((segment, i) => {
          if (i === segments.length - 1) {
            selectRef[segment] = true
          } else {
            if (!selectRef[segment]) {
              selectRef[segment] = {}
            }
            selectRef = selectRef[segment] as SelectType
          }
        })
        acc[field.replaceAll(/\./g, '_')] = field
        return acc
      }, {})
    } else {
      traverseFields({
        callback: traverseFieldsCallback,
        fields: collection.flattenedFields,
        fillEmpty: false,
      })
    }

    const { docs } = await payload.find({
      collection: slug,
      select,
      // default limit of 1000, need to handle streams for larger exports
      limit: 1000,
      locale,
      req,
      user,
    })

    // TODO: handle relationship subfields
    // TODO: build array index headers for arrays/blocks/hasMany fields

    const csvInput = docs.map((doc) => {
      const data: Record<string, unknown> = {}
      Object.entries(headers).forEach(([key, value]) => {
        const segments = value.split('.')
        let docRef = doc

        segments.forEach((segment, i) => {
          if (i === segments.length - 1) {
            data[key] = docRef[segment]
          } else {
            docRef = docRef[segment]
          }
        })
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
