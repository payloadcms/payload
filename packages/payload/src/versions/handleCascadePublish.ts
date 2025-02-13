import type { TypeWithID } from '../collections/config/types.js'
import type { FlattenedField, RelationshipField } from '../fields/config/types.js'
import type { CollectionSlug } from '../index.js'
import type { JsonObject, Payload, PayloadRequest } from '../types/index.js'

const extractID = (value: unknown): number | string => {
  if (value && typeof value === 'object' && 'id' in value) {
    return value.id as number | string
  }
  return value as number | string
}

type Relation = {
  collectionSlug: CollectionSlug
  id: number | string
}

const collectRelationField = ({
  addRelation,
  field,
  fieldData,
  payload,
}: {
  addRelation: (relation: Relation) => void
  field: RelationshipField
  fieldData: any
  payload: Payload
}) => {
  if (!fieldData) {
    return
  }

  if (field.hasMany) {
    if (!Array.isArray(fieldData)) {
      return
    }

    fieldData.forEach((relation) => {
      if (!relation) {
        return
      }

      if (Array.isArray(field.relationTo)) {
        if (!relation?.relationTo || !relation?.value) {
          return
        }

        if (payload.collections[relation.relationTo]?.config?.versions?.drafts) {
          addRelation({ id: extractID(relation.value), collectionSlug: relation.relationTo })
        }
        return
      }

      if (payload.collections[field.relationTo].config.versions.drafts) {
        addRelation({ id: extractID(relation), collectionSlug: field.relationTo })
      }
    })
    return
  }

  if (Array.isArray(field.relationTo)) {
    if (!fieldData?.relationTo || !fieldData?.value) {
      return
    }

    if (payload.collections[fieldData.relationTo]?.config?.versions?.drafts) {
      addRelation({ id: extractID(fieldData.value), collectionSlug: fieldData.relationTo })
    }
    return
  }

  if (payload.collections[field.relationTo].config.versions.drafts) {
    addRelation({ id: extractID(fieldData), collectionSlug: field.relationTo })
  }
}

const collectRelationsToPublish = ({
  addRelation,
  data,
  fields,
  payload,
}: {
  addRelation: (relation: { collectionSlug: CollectionSlug; id: number | string }) => void
  data: Record<string, unknown>
  fields: FlattenedField[]
  payload: Payload
}) => {
  for (const field of fields) {
    const fieldData = data[field.name]
    if (!fieldData) {
      continue
    }

    switch (field.type) {
      case 'array':
      case 'blocks': {
        if (field.localized && payload.config.localization) {
          if (typeof fieldData !== 'object') {
            break
          }

          for (const locale in fieldData) {
            const localeData = (fieldData as any)[locale]
            if (!Array.isArray(localeData)) {
              continue
            }

            localeData.forEach((item) => {
              if (!item) {
                return
              }

              let fields: FlattenedField[]

              if (field.type === 'blocks') {
                const block = field.blocks.find((each) => each.slug === item.blockType)
                if (!block) {
                  return
                }
                fields = block.flattenedFields
              } else {
                fields = field.flattenedFields
              }

              collectRelationsToPublish({
                addRelation,
                data: item,
                fields,
                payload,
              })
            })
          }
          break
        }

        if (!Array.isArray(fieldData)) {
          break
        }

        fieldData.forEach((item) => {
          if (!item) {
            return
          }

          let fields: FlattenedField[]

          if (field.type === 'blocks') {
            const block = field.blocks.find((each) => each.slug === item.blockType)
            if (!block) {
              return
            }
            fields = block.flattenedFields
          } else {
            fields = field.flattenedFields
          }

          collectRelationsToPublish({
            addRelation,
            data: item,
            fields,
            payload,
          })
        })

        break
      }

      case 'group':
      case 'tab': {
        if (typeof fieldData !== 'object') {
          break
        }

        if (field.localized && payload.config.localization) {
          for (const locale in fieldData) {
            const localeData = (fieldData as any)[locale]
            if (!localeData || typeof localeData !== 'object') {
              continue
            }

            collectRelationsToPublish({
              addRelation,
              data: localeData,
              fields: field.flattenedFields,
              payload,
            })
          }
          break
        }

        collectRelationsToPublish({
          addRelation,
          data: fieldData as any,
          fields: field.flattenedFields,
          payload,
        })

        break
      }

      case 'relationship':
        collectRelationField({ addRelation, field, fieldData, payload })
        break
    }
  }
}

export const handleCascadePublish = async ({
  collectionSlug,
  doc,
  fields,
  publishSpecificLocale,
  req,
}: {
  collectionSlug?: string
  doc: JsonObject
  fields: FlattenedField[]
  publishSpecificLocale?: string
  req: PayloadRequest
}) => {
  const relationsToPublish: Record<CollectionSlug, (number | string)[]> = {}

  const addRelation = (relation: Relation) => {
    // Skip cascade itself
    if (collectionSlug && relation.collectionSlug === collectionSlug && relation.id === doc.id) {
      return
    }

    if (!relationsToPublish[relation.collectionSlug]) {
      relationsToPublish[relation.collectionSlug] = []
    }

    if (relationsToPublish[relation.collectionSlug].some((doc) => doc === relation.id)) {
      return
    }

    relationsToPublish[relation.collectionSlug].push(relation.id)
  }

  collectRelationsToPublish({
    addRelation,
    data: doc,
    fields,
    payload: req.payload,
  })

  if (Object.keys(relationsToPublish).length === 0) {
    return
  }

  for (const collectionSlug in relationsToPublish) {
    await req.payload.update({
      collection: collectionSlug,
      data: {
        _status: 'published',
      },
      depth: 0,
      publishSpecificLocale,
      req,
      where: {
        and: [
          {
            id: {
              in: relationsToPublish[collectionSlug],
            },
          },
          {
            _status: {
              equals: 'draft',
            },
          },
        ],
      },
    })
  }
}
