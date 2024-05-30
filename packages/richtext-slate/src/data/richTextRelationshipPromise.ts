import type { PayloadRequest, RichTextAdapter, RichTextField } from 'payload/types'

import type { AdapterArguments } from '../types'

import { populate } from './populate'
import { recurseNestedFields } from './recurseNestedFields'

export type Args = Parameters<RichTextAdapter<any[], AdapterArguments>['populationPromise']>[0]

type RecurseRichTextArgs = {
  children: unknown[]
  currentDepth: number
  depth: number
  draft: boolean
  field: RichTextField<any[], AdapterArguments, AdapterArguments>
  overrideAccess: boolean
  promises: Promise<void>[]
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
  promises,
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
          promises.push(
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
            promises,
            req,
            showHiddenFields,
          })
        }
      }

      if (element.type === 'link') {
        if (element?.doc?.value && element?.doc?.relationTo) {
          const collection = req.payload.collections[element?.doc?.relationTo]

          if (collection) {
            promises.push(
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
            promises,
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
          promises,
          req,
          showHiddenFields,
        })
      }
    })
  }
}

export const richTextRelationshipPromise = async ({
  currentDepth,
  depth,
  draft,
  field,
  overrideAccess,
  req,
  showHiddenFields,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  recurseRichText({
    children: siblingDoc[field.name] as unknown[],
    currentDepth,
    depth,
    draft,
    field,
    overrideAccess,
    promises,
    req,
    showHiddenFields,
  })

  await Promise.all(promises)
}
