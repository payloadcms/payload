'use client'
import type { ClientField } from 'payload'

import { fieldAffectsData } from 'payload/shared'

export const buildPathSegments = (
  parentPath: (number | string)[],
  fields: ClientField[],
): string[] => {
  const pathNames = fields.reduce((acc, field) => {
    const fields: ClientField[] = 'fields' in field ? field.fields : undefined

    if (fields) {
      if (fieldAffectsData(field)) {
        // group, block, array
        const name = 'name' in field ? field.name : 'unnamed'
        acc.push(...[...parentPath, name])
      } else {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(parentPath, fields))
      }
    } else if (field.type === 'tabs') {
      // tabs
      if ('tabs' in field) {
        field.tabs?.forEach((tab) => {
          let tabPath = parentPath
          if ('name' in tab) {
            tabPath = [...parentPath, tab.name]
          }
          acc.push(...buildPathSegments(tabPath, tab.fields))
        })
      }
    } else if (fieldAffectsData(field)) {
      // text, number, date, etc.
      const name = 'name' in field ? field.name : 'unnamed'
      acc.push(...[...parentPath, name])
    }

    return acc
  }, [])

  return pathNames
}
