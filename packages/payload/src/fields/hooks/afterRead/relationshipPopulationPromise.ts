import type { PayloadRequestWithData, Populate, Select } from '../../../types/index.js'
import type { RelationshipField, UploadField } from '../../config/types.js'

import { createDataloaderCacheKey } from '../../../collections/dataloader.js'
import { fieldHasMaxDepth, fieldSupportsMany } from '../../config/types.js'

type PopulateArgs = {
  currentDepth: number
  data: Record<string, unknown>
  dataReference: Record<string, any>
  depth: number
  draft: boolean
  fallbackLocale: null | string
  field: RelationshipField | UploadField
  fieldPopulatePath: string
  index?: number
  key?: string
  locale: null | string
  overrideAccess: boolean
  populateArg?: Populate
  req: PayloadRequestWithData
  showHiddenFields: boolean
}

const populate = async ({
  currentDepth,
  data,
  dataReference,
  depth,
  draft,
  fallbackLocale,
  field,
  fieldPopulatePath,
  index,
  key,
  locale,
  overrideAccess,
  populateArg,
  req,
  showHiddenFields,
}: PopulateArgs) => {
  const dataToUpdate = dataReference
  const relation = Array.isArray(field.relationTo) ? (data.relationTo as string) : field.relationTo
  const relatedCollection = req.payload.collections[relation]

  if (relatedCollection) {
    let id = Array.isArray(field.relationTo) ? data.value : data
    field.defaultPopulate
    let fieldDepth = depth
    let fieldPopulateValue:
      | {
          populate?: Populate
          select?: Select
        }
      | undefined

    if ((populateArg && typeof populateArg === 'object') || field.defaultPopulate) {
      const populateValue = populateArg?.[fieldPopulatePath] ?? field.defaultPopulate

      if (!populateValue) fieldDepth = 0
      else if (typeof populateValue === 'object') {
        const currentPopulateValue = Array.isArray(populateValue)
          ? populateValue.find((each) => each.relationTo === relatedCollection.config.slug)?.value
          : populateValue

        if (!currentPopulateValue) fieldDepth = 0
        else if (typeof currentPopulateValue === 'object') fieldPopulateValue = currentPopulateValue
      }
    }

    let relationshipValue
    const shouldPopulate = fieldDepth && currentDepth <= depth

    if (
      typeof id !== 'string' &&
      typeof id !== 'number' &&
      typeof id?.toString === 'function' &&
      typeof id !== 'object'
    ) {
      id = id.toString()
    }

    if (shouldPopulate) {
      relationshipValue = await req.payloadDataLoader.load(
        createDataloaderCacheKey({
          collectionSlug: relatedCollection.config.slug,
          currentDepth: currentDepth + 1,
          depth,
          docID: id as string,
          draft,
          fallbackLocale,
          locale,
          overrideAccess,
          populate: fieldPopulateValue?.populate,
          select: fieldPopulateValue?.select,
          showHiddenFields,
          transactionID: req.transactionID,
        }),
      )
    }

    if (!relationshipValue) {
      // ids are visible regardless of access controls
      relationshipValue = id
    }

    if (typeof index === 'number' && typeof key === 'string') {
      if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name][key][index].value = relationshipValue
      } else {
        dataToUpdate[field.name][key][index] = relationshipValue
      }
    } else if (typeof index === 'number' || typeof key === 'string') {
      if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name][index ?? key].value = relationshipValue
      } else {
        dataToUpdate[field.name][index ?? key] = relationshipValue
      }
    } else if (Array.isArray(field.relationTo)) {
      dataToUpdate[field.name].value = relationshipValue
    } else {
      dataToUpdate[field.name] = relationshipValue
    }
  }
}

type PromiseArgs = {
  currentDepth: number
  depth: number
  draft: boolean
  fallbackLocale: null | string
  field: RelationshipField | UploadField
  fieldPopulatePath: string
  locale: null | string
  overrideAccess: boolean
  populateArg?: Populate
  req: PayloadRequestWithData
  showHiddenFields: boolean
  siblingDoc: Record<string, any>
}

export const relationshipPopulationPromise = async ({
  currentDepth,
  depth,
  draft,
  fallbackLocale,
  field,
  fieldPopulatePath,
  locale,
  overrideAccess,
  populateArg,
  req,
  showHiddenFields,
  siblingDoc,
}: PromiseArgs): Promise<void> => {
  const resultingDoc = siblingDoc
  const populateDepth = fieldHasMaxDepth(field) && field.maxDepth < depth ? field.maxDepth : depth
  const rowPromises = []

  if (fieldSupportsMany(field) && field.hasMany) {
    if (
      locale === 'all' &&
      typeof siblingDoc[field.name] === 'object' &&
      siblingDoc[field.name] !== null
    ) {
      Object.keys(siblingDoc[field.name]).forEach((key) => {
        if (Array.isArray(siblingDoc[field.name][key])) {
          siblingDoc[field.name][key].forEach((relatedDoc, index) => {
            const rowPromise = async () => {
              await populate({
                currentDepth,
                data: siblingDoc[field.name][key][index],
                dataReference: resultingDoc,
                depth: populateDepth,
                draft,
                fallbackLocale,
                field,
                fieldPopulatePath,
                index,
                key,
                locale,
                overrideAccess,
                populateArg,
                req,
                showHiddenFields,
              })
            }
            rowPromises.push(rowPromise())
          })
        }
      })
    } else if (Array.isArray(siblingDoc[field.name])) {
      siblingDoc[field.name].forEach((relatedDoc, index) => {
        const rowPromise = async () => {
          if (relatedDoc) {
            await populate({
              currentDepth,
              data: relatedDoc,
              dataReference: resultingDoc,
              depth: populateDepth,
              draft,
              fallbackLocale,
              field,
              fieldPopulatePath,
              index,
              locale,
              overrideAccess,
              populateArg,
              req,
              showHiddenFields,
            })
          }
        }

        rowPromises.push(rowPromise())
      })
    }
  } else if (
    typeof siblingDoc[field.name] === 'object' &&
    siblingDoc[field.name] !== null &&
    locale === 'all'
  ) {
    Object.keys(siblingDoc[field.name]).forEach((key) => {
      const rowPromise = async () => {
        await populate({
          currentDepth,
          data: siblingDoc[field.name][key],
          dataReference: resultingDoc,
          depth: populateDepth,
          draft,
          fallbackLocale,
          field,
          fieldPopulatePath,
          key,
          locale,
          overrideAccess,
          populateArg,
          req,
          showHiddenFields,
        })
      }
      rowPromises.push(rowPromise())
    })

    await Promise.all(rowPromises)
  } else if (siblingDoc[field.name]) {
    await populate({
      currentDepth,
      data: siblingDoc[field.name],
      dataReference: resultingDoc,
      depth: populateDepth,
      draft,
      fallbackLocale,
      field,
      fieldPopulatePath,
      locale,
      overrideAccess,
      populateArg,
      req,
      showHiddenFields,
    })
  }
  await Promise.all(rowPromises)
}
