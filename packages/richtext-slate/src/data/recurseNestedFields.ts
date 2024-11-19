import type { Field, PayloadRequest, PopulateType, RichTextAdapter, RichTextField } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType, tabHasName } from 'payload/shared'

import type { AdapterArguments } from '../types.js'

import { populate } from './populate.js'

type NestedRichTextFieldsArgs = {
  currentDepth?: number
  data: unknown
  depth: number
  draft: boolean
  fields: Field[]
  overrideAccess: boolean
  populateArg?: PopulateType
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseNestedFields = ({
  currentDepth = 0,
  data,
  depth,
  draft,
  fields,
  overrideAccess = false,
  populateArg,
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
                    draft,
                    field,
                    key: i,
                    overrideAccess,
                    req,
                    select:
                      populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
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
                    draft,
                    field,
                    key: i,
                    overrideAccess,
                    req,
                    select:
                      populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
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
                draft,
                field,
                key: 'value',
                overrideAccess,
                req,
                select: populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
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
            draft,
            field,
            key: field.name,
            overrideAccess,
            req,
            select: populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
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
          draft,
          fields: field.fields,
          overrideAccess,
          populateArg,
          populationPromises,
          req,
          showHiddenFields,
        })
      } else {
        recurseNestedFields({
          currentDepth,
          data,
          depth,
          draft,
          fields: field.fields,
          overrideAccess,
          populateArg,
          populationPromises,
          req,
          showHiddenFields,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        recurseNestedFields({
          currentDepth,
          data: tabHasName(tab) ? data[tab.name] : data,
          depth,
          draft,
          fields: tab.fields,
          overrideAccess,
          populateArg,
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
              draft,
              fields: block.fields,
              overrideAccess,
              populateArg,
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
            draft,
            fields: field.fields,
            overrideAccess,
            populateArg,
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
            draft,
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
