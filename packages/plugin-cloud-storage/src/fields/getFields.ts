import type { CollectionConfig, Field, GroupField, TextField } from 'payload'

import path from 'path'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { getAfterReadHook } from '../hooks/afterRead.js'

interface Args {
  adapter?: GeneratedAdapter
  /**
   * When true, always insert the prefix field regardless of whether a prefix is configured.
   */
  alwaysInsertFields?: boolean
  collection: CollectionConfig
  disablePayloadAccessControl?: true
  generateFileURL?: GenerateFileURL
  prefix?: string
}

export const getFields = ({
  adapter,
  alwaysInsertFields,
  collection,
  disablePayloadAccessControl,
  generateFileURL,
  prefix,
}: Args): Field[] => {
  const baseURLField: TextField = {
    name: 'url',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
  }

  const basePrefixField: TextField = {
    name: 'prefix',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
  }

  const fields = [...collection.fields, ...(adapter?.fields || [])]

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

  // Only add afterRead hook if adapter is provided
  if (adapter) {
    fields.push({
      ...baseURLField,
      ...(existingURLField || {}),
      hooks: {
        afterRead: [
          getAfterReadHook({ adapter, collection, disablePayloadAccessControl, generateFileURL }),
          ...(existingURLField?.hooks?.afterRead || []),
        ],
      },
    } as TextField)
  } else {
    fields.push({
      ...baseURLField,
      ...(existingURLField || {}),
    } as TextField)
  }

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
      fields: collection.upload.imageSizes.map((size) => {
        const existingSizeField = existingSizesField?.fields.find(
          (existingField) => 'name' in existingField && existingField.name === size.name,
        ) as GroupField

        const existingSizeURLField = existingSizeField?.fields.find(
          (existingField) => 'name' in existingField && existingField.name === 'url',
        ) as TextField

        // Only add afterRead hook if adapter is provided
        const sizeURLField: TextField = adapter
          ? ({
              ...(existingSizeURLField || {}),
              ...baseURLField,
              hooks: {
                afterRead: [
                  getAfterReadHook({
                    adapter,
                    collection,
                    disablePayloadAccessControl,
                    generateFileURL,
                    size,
                  }),
                  ...((typeof existingSizeURLField === 'object' &&
                    'hooks' in existingSizeURLField &&
                    existingSizeURLField?.hooks?.afterRead) ||
                    []),
                ],
              },
            } as TextField)
          : ({
              ...(existingSizeURLField || {}),
              ...baseURLField,
            } as TextField)

        return {
          ...existingSizeField,
          name: size.name,
          type: 'group',
          fields: [...(adapter?.fields || []), sizeURLField],
        } as Field
      }),
    }

    fields.push(sizesField)
  }

  // If prefix is enabled or alwaysInsertFields is true, save it to db
  if (typeof prefix !== 'undefined' || alwaysInsertFields) {
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
      defaultValue: prefix ? path.posix.join(prefix) : '',
    } as TextField)
  }

  return fields
}
