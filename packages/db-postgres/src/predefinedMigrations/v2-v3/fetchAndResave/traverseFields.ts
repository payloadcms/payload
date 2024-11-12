import type { Field } from 'payload'

import { tabHasName } from 'payload/shared'

type Args = {
  doc: Record<string, unknown>
  fields: Field[]
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
                  fields: field.fields,
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
              fields: field.fields,
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
                const matchedBlock = field.blocks.find((block) => block.slug === row.blockType)

                if (matchedBlock) {
                  return traverseFields({
                    doc: row as Record<string, unknown>,
                    fields: matchedBlock.fields,
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
            const matchedBlock = field.blocks.find((block) => block.slug === row.blockType)

            if (matchedBlock) {
              return traverseFields({
                doc: row as Record<string, unknown>,
                fields: matchedBlock.fields,
                path: `${path ? `${path}.` : ''}${field.name}.${i}`,
                rows,
              })
            }
          })
        }

        break
      }
      case 'collapsible':
      // falls through
      case 'row': {
        return traverseFields({
          doc,
          fields: field.fields,
          path,
          rows,
        })
      }

      case 'group': {
        const newPath = `${path ? `${path}.` : ''}${field.name}`
        const newDoc = doc?.[field.name]

        if (typeof newDoc === 'object' && newDoc !== null) {
          if (field.localized) {
            Object.entries(newDoc).forEach(([locale, localeDoc]) => {
              return traverseFields({
                doc: localeDoc,
                fields: field.fields,
                locale,
                path: newPath,
                rows,
              })
            })
          } else {
            return traverseFields({
              doc: newDoc as Record<string, unknown>,
              fields: field.fields,
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
      case 'tabs': {
        return field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            const newDoc = doc?.[tab.name]
            const newPath = `${path ? `${path}.` : ''}${tab.name}`

            if (typeof newDoc === 'object' && newDoc !== null) {
              if (tab.localized) {
                Object.entries(newDoc).forEach(([locale, localeDoc]) => {
                  return traverseFields({
                    doc: localeDoc,
                    fields: tab.fields,
                    locale,
                    path: newPath,
                    rows,
                  })
                })
              } else {
                return traverseFields({
                  doc: newDoc as Record<string, unknown>,
                  fields: tab.fields,
                  path: newPath,
                  rows,
                })
              }
            }
          } else {
            traverseFields({
              doc,
              fields: tab.fields,
              path,
              rows,
            })
          }
        })
      }
    }
  })
}
