import type { CollectionConfig, Field } from 'payload'

export const relatedSlug = 'related-docs'
export const virtualFieldsSlug = 'virtual-fields'

const relatedFields: Field[] = [
  { name: 'title', type: 'text' },
  { name: 'description', type: 'text' },
]

const relatedFieldNames = relatedFields
  .filter((f): f is { name: string } & Field => 'name' in f)
  .map((f) => f.name)

const populateVirtualFromRelation = async ({ doc, req }) => {
  if (!doc.relation) {
    const embedded: Record<string, unknown> = {}
    for (const name of relatedFieldNames) {
      embedded[name] = null
    }
    return { ...doc, embedded }
  }

  const relationId = typeof doc.relation === 'string' ? doc.relation : doc.relation.id
  const related = await req.payload.findByID({ collection: relatedSlug, id: relationId })

  const embedded: Record<string, unknown> = {}
  for (const name of relatedFieldNames) {
    embedded[name] = related[name]
  }

  return { ...doc, embedded }
}

export const RelatedCollection: CollectionConfig = {
  slug: relatedSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: relatedFields,
}

export const VirtualFieldsCollection: CollectionConfig = {
  slug: virtualFieldsSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  hooks: {
    afterRead: [populateVirtualFromRelation],
  },
  fields: [
    { name: 'relation', type: 'relationship', relationTo: relatedSlug },
    {
      name: 'embedded',
      type: 'group',
      virtual: true,
      fields: relatedFields,
    },
  ],
}
