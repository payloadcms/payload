import path from 'path'
import type { GroupField, TextField } from 'payload/dist/fields/config/types'
import type { CollectionConfig, Field } from 'payload/types'
import { getAfterReadHook } from '../hooks/afterRead'
import type { GeneratedAdapter } from '../types'

interface Args {
  collection: CollectionConfig
  disablePayloadAccessControl?: true
  prefix?: string
  adapter: GeneratedAdapter
}

export const getFields = ({
  adapter,
  collection,
  disablePayloadAccessControl,
  prefix,
}: Args): Field[] => {
  const baseURLField: Field = {
    name: 'url',
    label: 'URL',
    type: 'text',
    admin: {
      readOnly: true,
      disabled: true,
    },
  }

  const fields = [...collection.fields]

  // If Payload access control is disabled,
  // inject a hook into all URL fields to point directly to the cloud source
  if (disablePayloadAccessControl) {
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
      hooks: {
        afterRead: [
          getAfterReadHook({ adapter, collection }),
          ...(existingURLField?.hooks?.afterRead || []),
        ],
      },
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
          disabled: true,
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
                hooks: {
                  afterRead: [
                    getAfterReadHook({ adapter, collection, size }),
                    ...(existingSizeURLField?.hooks?.afterRead || []),
                  ],
                },
              },
            ],
          }
        }),
      }

      fields.push(sizesField)
    }
  }

  // If prefix is enabled, save it to db
  if (prefix) {
    fields.push({
      name: 'prefix',
      type: 'text',
      defaultValue: path.posix.join(prefix),
      admin: {
        readOnly: true,
        disabled: true,
      },
    })
  }

  return fields
}
