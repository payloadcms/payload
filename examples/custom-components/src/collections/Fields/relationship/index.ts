import type { CollectionConfig } from 'payload'

export const relationshipFields: CollectionConfig['fields'] = [
  {
    name: 'relationshipFieldServerComponent',
    type: 'relationship',
    admin: {
      components: {
        Field:
          '@/collections/Fields/relationship/components/server/Field#CustomRelationshipFieldServer',
        Label:
          '@/collections/Fields/relationship/components/server/Label#CustomRelationshipFieldLabelServer',
      },
    },
    relationTo: 'custom-fields',
  },
  {
    name: 'relationshipFieldClientComponent',
    type: 'relationship',
    admin: {
      components: {
        Field:
          '@/collections/Fields/relationship/components/client/Field#CustomRelationshipFieldClient',
        Label:
          '@/collections/Fields/relationship/components/client/Label#CustomRelationshipFieldLabelClient',
      },
    },
    relationTo: 'custom-fields',
  },
]
