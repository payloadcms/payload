// @ts-strict-ignore
import type { CollectionConfig } from '../collections/config/types.js'
import type { Field, TabAsField } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'

type TraverseFieldsArgs = {
  data: Record<string, unknown>
  fields: (Field | TabAsField)[]
  result: Record<string, unknown>
}
const traverseFields = ({
  data,
  // parent,
  fields,
  result,
}: TraverseFieldsArgs) => {
  fields.forEach((field) => {
    switch (field.type) {
      case 'collapsible':
      case 'row': {
        traverseFields({
          data,
          fields: field.fields,
          result,
        })
        break
      }
      case 'group': {
        let targetResult
        if (typeof field.saveToJWT === 'string') {
          targetResult = field.saveToJWT
          result[field.saveToJWT] = data[field.name]
        } else if (field.saveToJWT) {
          targetResult = field.name
          result[field.name] = data[field.name]
        }
        const groupData: Record<string, unknown> = data[field.name] as Record<string, unknown>
        const groupResult = (targetResult ? result[targetResult] : result) as Record<
          string,
          unknown
        >
        traverseFields({
          data: groupData,
          fields: field.fields,
          result: groupResult,
        })
        break
      }
      case 'tab': {
        if (tabHasName(field)) {
          let targetResult
          if (typeof field.saveToJWT === 'string') {
            targetResult = field.saveToJWT
            result[field.saveToJWT] = data[field.name]
          } else if (field.saveToJWT) {
            targetResult = field.name
            result[field.name] = data[field.name]
          }
          const tabData: Record<string, unknown> = data[field.name] as Record<string, unknown>
          const tabResult = (targetResult ? result[targetResult] : result) as Record<
            string,
            unknown
          >
          traverseFields({
            data: tabData,
            fields: field.fields,
            result: tabResult,
          })
        } else {
          traverseFields({
            data,
            fields: field.fields,
            result,
          })
        }
        break
      }
      case 'tabs': {
        traverseFields({
          data,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          result,
        })
        break
      }
      default:
        if (fieldAffectsData(field)) {
          if (field.saveToJWT) {
            if (typeof field.saveToJWT === 'string') {
              result[field.saveToJWT] = data[field.name]
              delete result[field.name]
            } else {
              result[field.name] = data[field.name] as Record<string, unknown>
            }
          } else if (field.saveToJWT === false) {
            delete result[field.name]
          }
        }
    }
  })
  return result
}
export const getFieldsToSign = (args: {
  collectionConfig: CollectionConfig
  email: string
  user: PayloadRequest['user']
}): Record<string, unknown> => {
  const { collectionConfig, email, user } = args

  const result: Record<string, unknown> = {
    id: user?.id,
    collection: collectionConfig.slug,
    email,
  }

  traverseFields({
    data: user,
    fields: collectionConfig.fields,
    result,
  })

  return result
}
