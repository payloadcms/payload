import type { PayloadRequest, RichTextAdapter, RichTextField } from 'payload/types'

import type { AdapterArguments } from '../types.js'

import { populate } from './populate.js'
import { recurseNestedFields } from './recurseNestedFields.js'

export type Args = Parameters<RichTextAdapter<any[], AdapterArguments>['populationPromises']>[0]

type RecurseRichTextArgs = {
  children: unknown[]
  currentDepth: number
  depth: number
  field: RichTextField<any[], AdapterArguments, AdapterArguments>
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseRichText = ({
  children,
  currentDepth = 0,
  depth,
  field,
  overrideAccess = false,
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
              field,
              key: 'value',
              overrideAccess,
              req,
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
            fields: field.admin.upload.collections[element.relationTo].fields,
            overrideAccess,
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
                field,
                key: 'value',
                overrideAccess,
                req,
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
            fields: field.admin?.link?.fields,
            overrideAccess,
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
          field,
          overrideAccess,
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
  field,
  overrideAccess,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args) => {
  recurseRichText({
    children: siblingDoc[field.name] as unknown[],
    currentDepth,
    depth,
    field,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  })
}
