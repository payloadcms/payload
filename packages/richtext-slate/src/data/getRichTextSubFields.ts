import type {
  FieldsWithData,
  PayloadRequestWithData,
  RelationshipField,
  RichTextField,
} from 'payload/types'

import type { AdapterArguments } from '../types.js'

export type Args = {
  allSubFields: FieldsWithData[]
  field: RichTextField<any[], AdapterArguments, AdapterArguments>
  req: PayloadRequestWithData
  siblingDoc: Record<string, unknown>
}

export type RecurseRichTextArgs = {
  allSubFields: FieldsWithData[]
  children: unknown[]
  field: RichTextField<any[], AdapterArguments, AdapterArguments>
  req: PayloadRequestWithData
}

export const recurseRichText = ({
  allSubFields,
  children,
  field,
  req,
}: RecurseRichTextArgs): void => {
  if (Array.isArray(children)) {
    ;(children as any[]).forEach((element) => {
      if ((element.type === 'relationship' || element.type === 'upload') && element?.value?.id) {
        const collection = req.payload.collections[element?.relationTo]

        if (collection) {
          const relationshipField: RelationshipField = {
            name: 'relationship',
            type: 'relationship',
            localized: false,
            relationTo: collection.config.slug,
          }

          const valueContainer = {
            relationship: element.value.id,
          }

          // makes sure that whatever is later modifying the value will mutate the original node here
          const valueProxy = new Proxy(valueContainer, {
            get(target, prop) {
              if (prop === 'relationship') {
                return element.value.id
              }
              return {
                relationship: element.value.id,
              }
            },
            set(target, prop, newValue) {
              if (prop === 'relationship') {
                element.value = newValue
              } else {
                element.value = newValue.relationship
              }
              return true
            },
          })

          allSubFields.push({
            data: valueProxy,
            fields: [relationshipField],
            originalData: {
              relationship: element.value.id,
            },
            originalDataWithLocales: {
              relationship: element.value.id,
            },
          })
        }
        if (
          element.type === 'upload' &&
          Array.isArray(field.admin?.upload?.collections?.[element?.relationTo]?.fields)
        ) {
          allSubFields.push({
            data: element.fields || {},
            fields: field.admin.upload.collections[element.relationTo].fields,
            originalData: element.fields || {},
            originalDataWithLocales: element.fields || {},
          })
        }
      }

      if (element.type === 'link') {
        if (element?.doc?.value && element?.doc?.relationTo) {
          const collection = req.payload.collections[element?.doc?.relationTo]

          if (collection) {
            const relationshipField: RelationshipField = {
              name: 'relationship',
              type: 'relationship',
              localized: false,
              relationTo: collection.config.slug,
            }

            const valueContainer = {
              relationship: {
                value: element.doc.value,
              },
            }

            // makes sure that whatever is later modifying the value will mutate the original node here
            const valueProxy = new Proxy(valueContainer, {
              get(target, prop) {
                if (prop === 'relationship') {
                  return element.doc.value
                }
                return {
                  relationship: element.doc.value,
                }
              },
              set(target, prop, newValue) {
                if (prop === 'relationship') {
                  element.doc.value = newValue
                } else {
                  element.doc.value = newValue.relationship
                }
                return true
              },
            })

            allSubFields.push({
              data: valueProxy,
              fields: [relationshipField],
              originalData: {
                relationship: element.doc.value,
              },
              originalDataWithLocales: {
                relationship: element.doc.value,
              },
            })
          }
        }

        if (Array.isArray(field.admin?.link?.fields)) {
          allSubFields.push({
            data: element.fields || {},
            fields: field.admin.link.fields,
            originalData: element.fields || {},
            originalDataWithLocales: element.fields || {},
          })
        }
      }

      if (element?.children) {
        recurseRichText({
          allSubFields,
          children: element.children,
          field,
          req,
        })
      }
    })
  }
}

export const richTextConstructSubFields = ({ allSubFields, field, req, siblingDoc }: Args) => {
  recurseRichText({
    allSubFields,
    children: siblingDoc[field.name] as unknown[],
    field,
    req,
  })
}
