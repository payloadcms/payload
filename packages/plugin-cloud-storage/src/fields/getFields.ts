import type { CollectionConfig, Field, GroupField, TextField } from 'payload'

import path from 'path'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { getAfterReadHook } from '../hooks/afterRead.js'
import { getBeforeChangeHook } from '../hooks/beforeChange.js'
import { getNormalizeUploadPrefixFieldHook } from '../hooks/normalizeUploadPrefix.js'

interface Args {
  adapter?: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: true
  generateFileURL?: GenerateFileURL
  prefix?: string
  /**
   * When true, do not default the `prefix` field to the collection prefix; the
   * document field holds only the document-level segment.
   */
  useCompositePrefixes?: boolean
}

export const getFields = ({
  adapter,
  collection,
  disablePayloadAccessControl,
  generateFileURL,
  prefix,
  useCompositePrefixes = false,
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

  // Server-owned key segment; hidden from the API and admin, read internally via showHiddenFields.
  const baseObjectKeyField: TextField = {
    name: '_objectKey',
    type: 'text',
    hidden: true,
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
        beforeChange: [
          getBeforeChangeHook({
            adapter,
            collection,
            disablePayloadAccessControl,
            generateFileURL,
          }),
          ...(existingURLField?.hooks?.beforeChange || []),
        ],
      },
    } as TextField)
  } else {
    fields.push({
      ...baseURLField,
      ...(existingURLField || {}),
    } as TextField)
  }

  let existingThumbnailURLFieldIndex = -1

  const existingThumbnailURLField = fields.find((existingField, i) => {
    if ('name' in existingField && existingField.name === 'thumbnailURL') {
      existingThumbnailURLFieldIndex = i
      return true
    }
    return false
  }) as TextField

  if (existingThumbnailURLField && adapter) {
    fields.splice(existingThumbnailURLFieldIndex, 1)

    fields.push({
      ...existingThumbnailURLField,
      hooks: {
        afterRead: [
          getAfterReadHook({ adapter, collection, disablePayloadAccessControl, generateFileURL }),
          ...(existingThumbnailURLField?.hooks?.afterRead || []),
        ],
        beforeChange: [
          getBeforeChangeHook({
            adapter,
            collection,
            disablePayloadAccessControl,
            generateFileURL,
          }),
          ...(existingThumbnailURLField.hooks?.beforeChange || []),
        ],
      },
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
                beforeChange: [
                  getBeforeChangeHook({
                    adapter,
                    collection,
                    disablePayloadAccessControl,
                    generateFileURL,
                    size,
                  }),
                  ...((typeof existingSizeURLField === 'object' &&
                    'hooks' in existingSizeURLField &&
                    existingSizeURLField?.hooks?.beforeChange) ||
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

  // Always insert the prefix field so the schema stays consistent regardless of
  // whether the plugin is enabled or a prefix is configured.
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
    defaultValue:
      existingPrefixField?.defaultValue ??
      (useCompositePrefixes ? '' : prefix ? path.posix.join(prefix) : ''),
    hooks: {
      ...existingPrefixField?.hooks,
      beforeChange: [
        ...(existingPrefixField?.hooks?.beforeChange || []),
        getNormalizeUploadPrefixFieldHook({ collectionPrefix: prefix, useCompositePrefixes }),
      ],
    },
  } as TextField)

  const existingObjectKeyFieldIndex = fields.findIndex(
    (existingField) => 'name' in existingField && existingField.name === '_objectKey',
  )
  if (existingObjectKeyFieldIndex > -1) {
    fields.splice(existingObjectKeyFieldIndex, 1)
  }

  fields.push({ ...baseObjectKeyField } as TextField)

  return fields
}
