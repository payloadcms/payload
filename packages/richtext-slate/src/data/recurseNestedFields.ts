import type { Field, PayloadRequest } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/types'

import { populate } from './populate.js'
import { recurseRichText } from './richTextRelationshipPromise.js'

type NestedRichTextFieldsArgs = {
  currentDepth?: number
  data: unknown
  depth: number
  fields: Field[]
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseNestedFields = ({
  currentDepth = 0,
  data,
  depth,
  fields,
  overrideAccess = false,
  populationPromises,
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
                populationPromises.push(
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
                populationPromises.push(
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
          if (!('hasMany' in field) || !field.hasMany) {
            const collection = req.payload.collections[data[field.name].relationTo]
            populationPromises.push(
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
      }
      if (typeof data[field.name] !== 'undefined' && typeof field.relationTo === 'string') {
        const collection = req.payload.collections[field.relationTo]
        populationPromises.push(
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
          currentDepth,
          data: data[field.name],
          depth,
          fields: field.fields,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
        })
      } else {
        recurseNestedFields({
          currentDepth,
          data,
          depth,
          fields: field.fields,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        recurseNestedFields({
          currentDepth,
          data,
          depth,
          fields: tab.fields,
          overrideAccess,
          populationPromises,
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
              currentDepth,
              data: data[field.name][i],
              depth,
              fields: block.fields,
              overrideAccess,
              populationPromises,
              req,
              showHiddenFields,
            })
          }
        })
      }

      if (field.type === 'array') {
        data[field.name].forEach((_, i) => {
          recurseNestedFields({
            currentDepth,
            data: data[field.name][i],
            depth,
            fields: field.fields,
            overrideAccess,
            populationPromises,
            req,
            showHiddenFields,
          })
        })
      }
    }

    if (field.type === 'richText' && Array.isArray(data[field.name])) {
      data[field.name].forEach((node) => {
        if (Array.isArray(node.children)) {
          recurseRichText({
            children: node.children,
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
  })
}
