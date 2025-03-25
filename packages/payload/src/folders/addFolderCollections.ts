import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { TextField } from '../fields/config/types.js'
import type { CollectionSlug } from '../index.js'

import { foldersSlug, parentFolderFieldName } from './constants.js'
import { createFolderCollection } from './createFolderCollection.js'

export async function addFolderCollections(config: NonNullable<Config>): Promise<void> {
  if (!config.collections) {
    return
  }

  if (config.folders?.enabled) {
    const enabledCollectionSlugs: CollectionSlug[] = []
    const debug = Boolean(config.folders?.debug)

    for (let i = 0; i < config.collections.length; i++) {
      const collection = config.collections[i]
      if (config.folders.collections[collection.slug]) {
        if (collection) {
          addFieldsToCollection({ collection, debug })
          enabledCollectionSlugs.push(collection.slug)
        }
      }
    }

    if (enabledCollectionSlugs.length) {
      let folderCollection = createFolderCollection({
        collectionSlugs: enabledCollectionSlugs,
        debug,
      })

      if (
        Array.isArray(config.folders.collectionOverrides) &&
        config.folders.collectionOverrides.length
      ) {
        for (const override of config.folders.collectionOverrides) {
          folderCollection = await override({ collection: folderCollection })
        }
      }
      config.collections.push(folderCollection)
    }
  }
}

function addFieldsToCollection({
  collection,
  debug,
}: {
  collection: CollectionConfig
  debug?: boolean
}): void {
  let useAsTitle = collection.admin?.useAsTitle || (collection.upload ? 'filename' : 'id')
  const titleField = collection.fields.find((field): field is TextField => {
    if ('name' in field) {
      useAsTitle = collection.admin?.useAsTitle ?? useAsTitle
      return field.name === useAsTitle
    }
    return false
  })

  collection.fields.push(
    {
      name: parentFolderFieldName,
      type: 'relationship',
      hidden: !debug,
      index: true,
      relationTo: foldersSlug,
    },
    {
      name: '_folderSearch',
      type: 'text',
      access: titleField?.access,
      admin: {
        hidden: !debug,
      },
      hooks: {
        beforeChange: [
          ({ data, operation, originalDoc, value }) => {
            if (operation === 'create' || operation === 'update') {
              if (data && useAsTitle in data) {
                return data[useAsTitle]
              } else if (originalDoc && useAsTitle in originalDoc) {
                return originalDoc[useAsTitle]
              }
              return value
            }
          },
        ],
      },
      index: true,
      localized: titleField?.localized,
    },
  )
}
