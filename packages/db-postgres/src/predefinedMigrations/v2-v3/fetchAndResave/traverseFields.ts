import type { Field } from 'payload/types'

import { tabHasName } from 'payload/types'

type Args = {
  doc: Record<string, unknown>
  fields: Field[]
  path: string
  rows: Record<string, unknown>[]
}

export const traverseFields = ({ doc, fields, path, rows }: Args) => {
  fields.forEach((field) => {
    switch (field.type) {
      case 'group': {
        const newDoc = doc?.[field.name]
        if (typeof newDoc === 'object' && newDoc !== null) {
          return traverseFields({
            doc: newDoc as Record<string, unknown>,
            fields: field.fields,
            path: `${path ? `${path}.` : ''}${field.name}`,
            rows,
          })
        }

        break
      }

      case 'row':
      case 'collapsible': {
        return traverseFields({
          doc,
          fields: field.fields,
          path,
          rows,
        })
      }

      case 'array': {
        const rowData = doc?.[field.name]

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

      case 'tabs': {
        return field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            const newDoc = doc?.[tab.name]

            if (typeof newDoc === 'object' && newDoc !== null) {
              return traverseFields({
                doc: newDoc as Record<string, unknown>,
                fields: tab.fields,
                path: `${path ? `${path}.` : ''}${tab.name}`,
                rows,
              })
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

      case 'relationship':
      case 'upload': {
      }
    }
  })
}
