import type { Field, PayloadRequest, RichTextAdapter } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/types'

import type { PopulationPromise } from '../field/features/types'

import { populate } from './populate'

type NestedRichTextFieldsArgs = {
  currentDepth?: number
  data: unknown
  depth: number
  fields: Field[]
  overrideAccess: boolean
  populationPromises: Map<string, Array<PopulationPromise>>
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

export const recurseNestedFields = ({
  currentDepth = 0,
  data,
  depth,
  fields,
  overrideAccess = false,
  populationPromises,
  promises,
  req,
  showHiddenFields,
  siblingDoc,
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
          currentDepth,
          data: data[field.name],
          depth,
          fields: field.fields,
          overrideAccess,
          populationPromises,
          promises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      } else {
        recurseNestedFields({
          currentDepth,
          data,
          depth,
          fields: field.fields,
          overrideAccess,
          populationPromises,
          promises,
          req,
          showHiddenFields,
          siblingDoc,
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
          promises,
          req,
          showHiddenFields,
          siblingDoc,
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
              promises,
              req,
              showHiddenFields,
              siblingDoc: data[field.name][i], // This has to be scoped to the blocks's fields, otherwise there may be population issues, e.g. for a relationship field with Blocks Node, with a Blocks Field, with a RichText Field, With Relationship Node. The last richtext field would try to find itself using siblingDoc[field.nane], which only works if the siblingDoc is scoped to the blocks's fields
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
            promises,
            req,
            showHiddenFields,
            siblingDoc, // TODO: if there's any population issues, this might have to be data[field.name][i] as well
          })
        })
      }
    }

    if (field.type === 'richText') {
      const editor: RichTextAdapter = field?.editor

      if (editor?.populationPromise) {
        const afterReadPromise = editor.populationPromise({
          currentDepth,
          depth,
          field,
          overrideAccess,
          req,
          showHiddenFields,
          siblingDoc,
        })

        if (afterReadPromise) {
          promises.push(afterReadPromise)
        }
      }
    }
  })
}
