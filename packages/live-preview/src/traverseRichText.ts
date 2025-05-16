import type { DocumentEvent, FieldSchemaJSON } from 'payload'

import type { PopulationsByCollection } from './types.js'

import { traverseFields } from './traverseFields.js'

export const traverseRichText = ({
  blocksFieldSchema,
  externallyUpdatedRelationship,
  incomingData,
  localeChanged,
  populationsByCollection,
  result,
}: {
  blocksFieldSchema?: FieldSchemaJSON
  externallyUpdatedRelationship?: DocumentEvent
  incomingData: any
  localeChanged: boolean
  populationsByCollection: PopulationsByCollection
  result: any
}): any => {
  if (Array.isArray(incomingData)) {
    if (!result) {
      result = []
    }

    result = incomingData.map((item, index) => {
      if (!result[index]) {
        result[index] = item
      }

      return traverseRichText({
        blocksFieldSchema,
        externallyUpdatedRelationship,
        incomingData: item,
        localeChanged,
        populationsByCollection,
        result: result[index],
      })
    })
  } else if (incomingData && typeof incomingData === 'object') {
    if (!result) {
      result = {}
    }

    // Remove keys from `result` that do not appear in `incomingData`
    // There's likely another way to do this,
    // But recursion and references make this very difficult
    Object.keys(result).forEach((key) => {
      if (!(key in incomingData)) {
        delete result[key]
      }
    })

    // If the incoming data is a block, we need to handle it differently
    if (incomingData.type === 'block') {
      const incomingBlockJSON = blocksFieldSchema?.[incomingData.fields.blockType]
      if (incomingBlockJSON?.fields) {
        result.type = 'block'
        result.version = 2
        result.format = ''
        result.fields = {}

        traverseFields({
          externallyUpdatedRelationship,
          fieldSchema: incomingBlockJSON.fields,
          incomingData: incomingData.fields,
          localeChanged,
          populationsByCollection,
          result: result.fields,
        })

        result.fields.blockType = incomingData.fields.blockType
        return result
      }
    }

    // Iterate over the keys of `incomingData` and populate `result`
    Object.keys(incomingData).forEach((key) => {
      if (!result[key]) {
        // Instantiate the key in `result` if it doesn't exist
        // Ensure its type matches the type of the `incomingData`
        // We don't have a schema to check against here
        result[key] =
          incomingData[key] && typeof incomingData[key] === 'object'
            ? Array.isArray(incomingData[key])
              ? []
              : {}
            : undefined
      }

      const isRelationship = key === 'value' && 'relationTo' in incomingData

      if (isRelationship) {
        // or if there are no keys besides id
        const needsPopulation =
          !result.value ||
          typeof result.value !== 'object' ||
          (typeof result.value === 'object' &&
            Object.keys(result.value).length === 1 &&
            'id' in result.value)

        const hasChanged =
          result &&
          typeof result === 'object' &&
          result.value.id === externallyUpdatedRelationship?.id

        if (needsPopulation || hasChanged) {
          if (!populationsByCollection[incomingData.relationTo]) {
            populationsByCollection[incomingData.relationTo] = []
          }

          populationsByCollection[incomingData.relationTo]?.push({
            id:
              incomingData[key] && typeof incomingData[key] === 'object'
                ? incomingData[key].id
                : incomingData[key],
            accessor: 'value',
            ref: result,
          })
        }
      } else {
        result[key] = traverseRichText({
          blocksFieldSchema,
          externallyUpdatedRelationship,
          incomingData: incomingData[key],
          localeChanged,
          populationsByCollection,
          result: result[key],
        })
      }
    })
  } else {
    result = incomingData
  }

  return result
}
