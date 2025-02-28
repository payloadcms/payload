import type { FlattenedBlock, FlattenedField } from 'payload'

type Args = {
  doc: Record<string, unknown>
  fields: FlattenedField[]
  locale?: string
  path: string
  rows: Record<string, unknown>[]
}

export const traverseFields = ({ doc, fields, locale, path, rows }: Args) => {
  fields.forEach((field) => {
    switch (field.type) {
      case 'array': {
        const rowData = doc?.[field.name]

        if (field.localized && typeof rowData === 'object' && rowData !== null) {
          Object.entries(rowData).forEach(([locale, localeRows]) => {
            if (Array.isArray(localeRows)) {
              localeRows.forEach((row, i) => {
                return traverseFields({
                  doc: row as Record<string, unknown>,
                  fields: field.flattenedFields,
                  locale,
                  path: `${path ? `${path}.` : ''}${field.name}.${i}`,
                  rows,
                })
              })
            }
          })
        }

        if (Array.isArray(rowData)) {
          rowData.forEach((row, i) => {
            return traverseFields({
              doc: row as Record<string, unknown>,
              fields: field.flattenedFields,
              path: `${path ? `${path}.` : ''}${field.name}.${i}`,
              rows,
            })
          })
        }

        break
      }

      case 'blocks': {
        const rowData = doc?.[field.name]

        if (field.localized && typeof rowData === 'object' && rowData !== null) {
          Object.entries(rowData).forEach(([locale, localeRows]) => {
            if (Array.isArray(localeRows)) {
              localeRows.forEach((row, i) => {
                // Can ignore string blocks, as those were added in v3 and don't need to be migrated
                const matchedBlock = field.blocks.find(
                  (block) => typeof block !== 'string' && block.slug === row.blockType,
                ) as FlattenedBlock | undefined

                if (matchedBlock) {
                  return traverseFields({
                    doc: row as Record<string, unknown>,
                    fields: matchedBlock.flattenedFields,
                    locale,
                    path: `${path ? `${path}.` : ''}${field.name}.${i}`,
                    rows,
                  })
                }
              })
            }
          })
        }

        if (Array.isArray(rowData)) {
          rowData.forEach((row, i) => {
            // Can ignore string blocks, as those were added in v3 and don't need to be migrated
            const matchedBlock = field.blocks.find(
              (block) => typeof block !== 'string' && block.slug === row.blockType,
            ) as FlattenedBlock | undefined

            if (matchedBlock) {
              return traverseFields({
                doc: row as Record<string, unknown>,
                fields: matchedBlock.flattenedFields,
                path: `${path ? `${path}.` : ''}${field.name}.${i}`,
                rows,
              })
            }
          })
        }

        break
      }

      case 'group':
      case 'tab': {
        const newPath = `${path ? `${path}.` : ''}${field.name}`
        const newDoc = doc?.[field.name]

        if (typeof newDoc === 'object' && newDoc !== null) {
          if (field.localized) {
            Object.entries(newDoc).forEach(([locale, localeDoc]) => {
              return traverseFields({
                doc: localeDoc,
                fields: field.flattenedFields,
                locale,
                path: newPath,
                rows,
              })
            })
          } else {
            return traverseFields({
              doc: newDoc as Record<string, unknown>,
              fields: field.flattenedFields,
              path: newPath,
              rows,
            })
          }
        }

        break
      }

      case 'relationship':
      // falls through
      case 'upload': {
        if (typeof field.relationTo === 'string') {
          if (field.type === 'upload' || !field.hasMany) {
            const relationshipPath = `${path ? `${path}.` : ''}${field.name}`

            if (field.localized) {
              const matchedRelationshipsWithLocales = rows.filter(
                (row) => row.path === relationshipPath,
              )

              if (matchedRelationshipsWithLocales.length && !doc[field.name]) {
                doc[field.name] = {}
              }

              const newDoc = doc[field.name] as Record<string, unknown>

              matchedRelationshipsWithLocales.forEach((localeRow) => {
                if (typeof localeRow.locale === 'string') {
                  const [, id] = Object.entries(localeRow).find(
                    ([key, val]) =>
                      val !== null && !['id', 'locale', 'order', 'parent_id', 'path'].includes(key),
                  )

                  newDoc[localeRow.locale] = id
                }
              })
            } else {
              const matchedRelationship = rows.find((row) => {
                const matchesPath = row.path === relationshipPath

                if (locale) {
                  return matchesPath && locale === row.locale
                }

                return row.path === relationshipPath
              })

              if (matchedRelationship) {
                const [, id] = Object.entries(matchedRelationship).find(
                  ([key, val]) =>
                    val !== null && !['id', 'locale', 'order', 'parent_id', 'path'].includes(key),
                )

                doc[field.name] = id
              }
            }
          }
        }
        break
      }
    }
  })
}
