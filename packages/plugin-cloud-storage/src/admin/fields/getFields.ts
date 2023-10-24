import path from 'path'
import type { GroupField, TextField } from 'payload/dist/fields/config/types'
import type { CollectionConfig, Field } from 'payload/types'

interface Args {
  collection: CollectionConfig
  prefix?: string
}

export const getFields = ({ collection, prefix }: Args): Field[] => {
  const baseURLField: Field = {
    name: 'url',
    label: 'URL',
    type: 'text',
    admin: {
      readOnly: true,
      hidden: true,
    },
  }

  const basePrefixField: Field = {
    name: 'prefix',
    type: 'text',
    admin: {
      readOnly: true,
      hidden: true,
    },
  }

  const fields = [...collection.fields]

  // Inject a hook into all URL fields to generate URLs

  let existingURLFieldIndex = -1

  const existingURLField = fields.find((existingField, i) => {
    if ('name' in existingField && existingField.name === 'url') {
      existingURLFieldIndex = i
      return true
    }
    return false
  }) as TextField

  if (existingURLFieldIndex > -1) {
    fields.splice(existingURLFieldIndex, 1)
  }

  fields.push({
    ...baseURLField,
    ...(existingURLField || {}),
  })

  if (typeof collection.upload === 'object' && collection.upload.imageSizes) {
    let existingSizesFieldIndex = -1

    const existingSizesField = fields.find((existingField, i) => {
      if ('name' in existingField && existingField.name === 'sizes') {
        existingSizesFieldIndex = i
        return true
      }

      return false
    }) as GroupField

    if (existingSizesFieldIndex > -1) {
      fields.splice(existingSizesFieldIndex, 1)
    }

    const sizesField: Field = {
      ...(existingSizesField || {}),
      name: 'sizes',
      type: 'group',
      admin: {
        hidden: true,
      },
      fields: collection.upload.imageSizes.map(size => {
        const existingSizeField = existingSizesField?.fields.find(
          existingField => 'name' in existingField && existingField.name === size.name,
        ) as GroupField

        const existingSizeURLField = existingSizeField?.fields.find(
          existingField => 'name' in existingField && existingField.name === 'url',
        ) as GroupField

        return {
          ...existingSizeField,
          name: size.name,
          type: 'group',
          fields: [
            {
              ...(existingSizeURLField || {}),
              ...baseURLField,
            },
          ],
        }
      }),
    }

    fields.push(sizesField)
  }

  // If prefix is enabled, save it to db
  if (typeof prefix !== 'undefined') {
    let existingPrefixFieldIndex = -1

    const existingPrefixField = fields.find((existingField, i) => {
      if ('name' in existingField && existingField.name === 'prefix') {
        existingPrefixFieldIndex = i
        return true
      }
      return false
    }) as TextField

    if (existingPrefixFieldIndex > -1) {
      fields.splice(existingPrefixFieldIndex, 1)
    }

    fields.push({
      ...basePrefixField,
      ...(existingPrefixField || {}),
      defaultValue: path.posix.join(prefix),
    })
  }

  return fields
}
