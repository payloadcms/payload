'use client'
import type { ClientField } from 'payload'

import { fieldAffectsData } from 'payload/shared'

export const buildPathSegments = (fields: ClientField[]): (`${string}.` | string)[] => {
  return fields.reduce((acc: (`${string}.` | string)[], field) => {
    const fields: ClientField[] = 'fields' in field ? field.fields : undefined

    if (fields) {
      if (fieldAffectsData(field)) {
        // group, block, array
        acc.push(`${field.name}.`)
      } else {
        // rows, collapsibles, unnamed-tab
        acc.push(...buildPathSegments(fields))
      }
    } else if (field.type === 'tabs') {
      // tabs
      if ('tabs' in field) {
        field.tabs?.forEach((tab) => {
          if ('name' in tab) {
            acc.push(`${tab.name}.`)
          } else {
            acc.push(...buildPathSegments(tab.fields))
          }
        })
      }
    } else if (fieldAffectsData(field)) {
      // text, number, date, etc.
      acc.push(field.name)
    }

    return acc
  }, [])
}
