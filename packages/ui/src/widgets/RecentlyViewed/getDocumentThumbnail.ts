import type { Field, SanitizedCollectionConfig } from 'payload'

export const getValueAtPath = ({ path, value }: { path: string; value: unknown }): unknown => {
  return path.split('.').reduce<unknown>((current, key) => {
    const object = Array.isArray(current) ? current[0] : current
    return object && typeof object === 'object' ? object[key] : undefined
  }, value)
}

export const getDocumentThumbnail = ({
  collection,
  doc,
}: {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
}): string | undefined => {
  if (collection.upload) {
    return getImageURL({ value: doc })
  }
  const path = collection.admin.useAsThumbnail || findUploadPath({ fields: collection.fields })
  return path ? getImageURL({ value: getValueAtPath({ path, value: doc }) }) : undefined
}

function getImageURL({ value }: { value: unknown }): string | undefined {
  if (Array.isArray(value)) {
    return getImageURL({ value: value[0] })
  }
  if (!value || typeof value !== 'object') {
    return undefined
  }
  if ('value' in value) {
    return getImageURL({ value: value.value })
  }
  if ('thumbnailURL' in value && typeof value.thumbnailURL === 'string') {
    return value.thumbnailURL
  }
  if (
    'mimeType' in value &&
    typeof value.mimeType === 'string' &&
    value.mimeType.startsWith('image/') &&
    'url' in value &&
    typeof value.url === 'string'
  ) {
    return value.url
  }
  return undefined
}

function findUploadPath({
  fields,
  prefix = '',
}: {
  fields: Field[]
  prefix?: string
}): string | undefined {
  for (const field of fields) {
    const path = 'name' in field ? `${prefix}${field.name}` : prefix.replace(/\.$/, '')
    if (field.type === 'upload') {
      return path
    }
    if ('fields' in field) {
      const result = findUploadPath({ fields: field.fields, prefix: path ? `${path}.` : '' })
      if (result) {
        return result
      }
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const result = findUploadPath({
          fields: tab.fields,
          prefix: 'name' in tab && tab.name ? `${prefix}${tab.name}.` : prefix,
        })
        if (result) {
          return result
        }
      }
    }
  }
  return undefined
}
