import { definePlugin } from 'payload'

import type { ExifPluginConfig } from './types.js'

import { buildExifFields } from './fields.js'
import { extractExifHook } from './hooks/extractExifHook.js'

export const exifPlugin = definePlugin<ExifPluginConfig>({
  slug: '@payloadcms/plugin-exif',
  plugin: ({ config, options }) => {
    const fieldName = options.fieldName ?? 'exif'
    const exifFields = buildExifFields(fieldName)
    const hook = extractExifHook({ fieldName })

    return {
      ...config,
      collections: (config.collections || []).map((collection) => {
        if (!options.collections.includes(collection.slug)) {
          return collection
        }

        // Always add fields (keeps DB schema stable when disabled).
        const withFields = {
          ...collection,
          fields: [...(collection.fields || []), ...exifFields],
        }

        if (options.disabled) {
          return withFields
        }

        return {
          ...withFields,
          hooks: {
            ...(collection.hooks || {}),
            beforeChange: [...(collection.hooks?.beforeChange || []), hook],
          },
        }
      }),
    }
  },
})

export type { ExifPluginConfig, ExtractedExif } from './types.js'
