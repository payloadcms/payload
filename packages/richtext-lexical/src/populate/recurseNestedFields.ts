import type { SerializedEditorState } from 'lexical'
import type { Field, PayloadRequest, RichTextField } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/types'

import type { AfterReadPromise } from '../field/features/types'
import type { AdapterProps } from '../types'

import { populate } from './populate'
import { recurseRichText } from './richTextRelationshipPromise'

type NestedRichTextFieldsArgs = {
  afterReadPromises: Map<string, Array<AfterReadPromise>>
  currentDepth?: number
  data: unknown
  depth: number
  fields: Field[]
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseNestedFields = ({
  afterReadPromises,
  currentDepth = 0,
  data,
  depth,
  fields,
  overrideAccess = false,
  promises,
  req,
  showHiddenFields,
}: NestedRichTextFieldsArgs): void => {
  fields.forEach((field) => {
    if (field.type === 'relationship' || field.type === 'upload') {
      if (field.type === 'relationship') {
        if (field.hasMany && Array.isArray(data[field.name])) {
          if (Array.isArray(field.relationTo)) {
            data[field.name].forEach(({ relationTo, value }, i) => {
              const collection = req.payload.collections[relationTo]
              if (collection) {
                promises.push(
                  populate({
                    id: value,
                    collection,
                    currentDepth,
                    data: data[field.name],
                    depth,
                    field,
                    key: i,
                    overrideAccess,
                    req,
                    showHiddenFields,
                  }),
                )
              }
            })
          } else {
            data[field.name].forEach((id, i) => {
              const collection = req.payload.collections[field.relationTo as string]
              if (collection) {
                promises.push(
                  populate({
                    id,
                    collection,
                    currentDepth,
                    data: data[field.name],
                    depth,
                    field,
                    key: i,
                    overrideAccess,
                    req,
                    showHiddenFields,
                  }),
                )
              }
            })
          }
        } else if (
          Array.isArray(field.relationTo) &&
          data[field.name]?.value &&
          data[field.name]?.relationTo
        ) {
          const collection = req.payload.collections[data[field.name].relationTo]
          promises.push(
            populate({
              id: data[field.name].value,
              collection,
              currentDepth,
              data: data[field.name],
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
      if (typeof data[field.name] !== 'undefined' && typeof field.relationTo === 'string') {
        const collection = req.payload.collections[field.relationTo]
        promises.push(
          populate({
            id: data[field.name],
            collection,
            currentDepth,
            data,
            depth,
            field,
            key: field.name,
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
    } else if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        recurseNestedFields({
          afterReadPromises,
          currentDepth,
          data: data[field.name],
          depth,
          fields: field.fields,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        })
      } else {
        recurseNestedFields({
          afterReadPromises,
          currentDepth,
          data,
          depth,
          fields: field.fields,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        recurseNestedFields({
          afterReadPromises,
          currentDepth,
          data,
          depth,
          fields: tab.fields,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        data[field.name].forEach((row, i) => {
          const block = field.blocks.find(({ slug }) => slug === row?.blockType)
          if (block) {
            recurseNestedFields({
              afterReadPromises,
              currentDepth,
              data: data[field.name][i],
              depth,
              fields: block.fields,
              overrideAccess,
              promises,
              req,
              showHiddenFields,
            })
          }
        })
      }

      if (field.type === 'array') {
        data[field.name].forEach((_, i) => {
          recurseNestedFields({
            afterReadPromises,
            currentDepth,
            data: data[field.name][i],
            depth,
            fields: field.fields,
            overrideAccess,
            promises,
            req,
            showHiddenFields,
          })
        })
      }
    }

    if (field.type === 'richText' && Array.isArray(data[field.name])) {
      ;(data[field.name] as SerializedEditorState).root.children.forEach((node) => {
        if ('children' in node && Array.isArray(node.children)) {
          // This assumes that the richText editor is using lexical and not slate.
          // TODO: Throw an error if Slate is used. That would be cursed, who'd do that?
          recurseRichText({
            afterReadPromises,
            children: node.children,
            currentDepth,
            depth,
            field: field as RichTextField<AdapterProps>,
            overrideAccess,
            promises,
            req,
            showHiddenFields,
          })
        }
      })
    }
  })
}
