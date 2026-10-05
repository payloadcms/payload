import type { ClientBlock, ClientField, JsonObject } from 'payload'

type Args = {
  blocks?: ClientBlock[]
  data: JsonObject
  fields: ClientField[]
  locale: string
  mode: 'unwrap' | 'wrap'
}

/** Converts single-locale form values to and from the locale-keyed API shape. */
export function formatLocalizedFormData({ blocks, data, fields, locale, mode }: Args): JsonObject {
  const result = { ...data }

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          if (result[tab.name] !== undefined) {
            result[tab.name] = tab.localized
              ? formatValue({ locale, mode, value: result[tab.name] })
              : formatLocalizedFormData({
                  blocks,
                  data: result[tab.name],
                  fields: tab.fields,
                  locale,
                  mode,
                })
          }
        } else {
          Object.assign(
            result,
            formatLocalizedFormData({ blocks, data: result, fields: tab.fields, locale, mode }),
          )
        }
      }
      continue
    }

    if (!('name' in field) || !field.name) {
      if ('fields' in field) {
        Object.assign(
          result,
          formatLocalizedFormData({ blocks, data: result, fields: field.fields, locale, mode }),
        )
      }
      continue
    }

    const value = result[field.name]

    if (value === undefined) {
      continue
    }

    if ('localized' in field && field.localized) {
      result[field.name] = formatValue({ locale, mode, value })
      continue
    }

    if (field.type === 'group' && value && typeof value === 'object') {
      result[field.name] = formatLocalizedFormData({
        blocks,
        data: value,
        fields: field.fields,
        locale,
        mode,
      })
    } else if (field.type === 'array' && Array.isArray(value)) {
      result[field.name] = value.map((row) =>
        formatLocalizedFormData({ blocks, data: row, fields: field.fields, locale, mode }),
      )
    } else if (field.type === 'blocks' && Array.isArray(value)) {
      result[field.name] = value.map((row) => {
        const block =
          blocks?.find((block) => block.slug === row.blockType) ??
          field.blocks.find((block) => typeof block !== 'string' && block.slug === row.blockType)

        return block && typeof block !== 'string'
          ? formatLocalizedFormData({ blocks, data: row, fields: block.fields, locale, mode })
          : row
      })
    }
  }

  return result
}

function formatValue({
  locale,
  mode,
  value,
}: {
  locale: string
  mode: Args['mode']
  value: unknown
}): unknown {
  return mode === 'wrap'
    ? { [locale]: value }
    : value && typeof value === 'object'
      ? (value as Record<string, unknown>)[locale]
      : value
}
