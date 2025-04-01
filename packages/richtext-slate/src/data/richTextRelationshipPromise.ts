import type {
  CollectionConfig,
  PayloadRequest,
  PopulateType,
  RichTextAdapter,
  RichTextField,
} from 'payload'

import type { AdapterArguments } from '../types.js'

import { populate } from './populate.js'
import { recurseNestedFields } from './recurseNestedFields.js'

export type Args = Parameters<
  RichTextAdapter<any[], AdapterArguments>['graphQLPopulationPromises']
>[0]

type RecurseRichTextArgs = {
  children: unknown[]
  currentDepth: number
  depth: number
  draft: boolean
  field: RichTextField<any[], any, any>
  overrideAccess: boolean
  populateArg?: PopulateType
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseRichText = ({
  children,
  currentDepth = 0,
  depth,
  draft,
  field,
  overrideAccess = false,
  populateArg,
  populationPromises,
  req,
  showHiddenFields,
}: RecurseRichTextArgs): void => {
  if (depth <= 0 || currentDepth > depth) {
    return
  }

  if (Array.isArray(children)) {
    ;(children as any[]).forEach((element) => {
      if ((element.type === 'relationship' || element.type === 'upload') && element?.value?.id) {
        const collection = req.payload.collections[element?.relationTo]

        if (collection) {
          populationPromises.push(
            populate({
              id: element.value.id,
              collection,
              currentDepth,
              data: element,
              depth,
              draft,
              field,
              key: 'value',
              overrideAccess,
              req,
              select:
                req.payloadAPI !== 'GraphQL'
                  ? (populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate)
                  : undefined,
              showHiddenFields,
            }),
          )
        }
        if (
          element.type === 'upload' &&
          Array.isArray(field.admin?.upload?.collections?.[element?.relationTo]?.fields)
        ) {
          recurseNestedFields({
            currentDepth,
            data: element.fields || {},
            depth,
            draft,
            fields: field.admin.upload.collections[element.relationTo].fields,
            overrideAccess,
            populateArg,
            populationPromises,
            req,
            showHiddenFields,
          })
        }
      }

      if (element.type === 'link') {
        if (element?.doc?.value && element?.doc?.relationTo) {
          const collection = req.payload.collections[element?.doc?.relationTo]

          if (collection) {
            populationPromises.push(
              populate({
                id: element.doc.value,
                collection,
                currentDepth,
                data: element.doc,
                depth,
                draft,
                field,
                key: 'value',
                overrideAccess,
                req,
                select:
                  req.payloadAPI !== 'GraphQL'
                    ? (populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate)
                    : undefined,
                showHiddenFields,
              }),
            )
          }
        }

        if (Array.isArray(field.admin?.link?.fields)) {
          recurseNestedFields({
            currentDepth,
            data: element.fields || {},
            depth,
            draft,
            fields: field.admin?.link?.fields,
            overrideAccess,
            populateArg,
            populationPromises,
            req,
            showHiddenFields,
          })
        }
      }

      if (element?.children) {
        recurseRichText({
          children: element.children,
          currentDepth,
          depth,
          draft,
          field,
          overrideAccess,
          populateArg,
          populationPromises,
          req,
          showHiddenFields,
        })
      }
    })
  }
}

export const richTextRelationshipPromise = ({
  currentDepth,
  depth,
  draft,
  field,
  overrideAccess,
  parentIsLocalized,
  populateArg,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args) => {
  recurseRichText({
    children: siblingDoc[field.name] as unknown[],
    currentDepth,
    depth,
    draft,
    field,
    overrideAccess,
    populateArg,
    populationPromises,
    req,
    showHiddenFields,
  })
}
