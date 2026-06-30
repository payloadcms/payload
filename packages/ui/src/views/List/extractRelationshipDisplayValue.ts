import type { ClientCollectionConfig, ClientConfig } from 'payload'

// Helper function to extract display value from relationship
export const extractRelationshipDisplayValue = (
  relationship: any,
  clientConfig: ClientConfig,
  relationshipConfig?: ClientCollectionConfig,
): string => {
  if (!relationship) {
    return ''
  }

  // Handle polymorphic relationships
  if (typeof relationship === 'object' && relationship?.relationTo && relationship?.value) {
    const config = clientConfig.collections.find((c) => c.slug === relationship.relationTo)
    const useAsTitle = config?.admin?.useAsTitle || 'id'
    return relationship.value?.[useAsTitle] || ''
  }

  // Handle regular relationships
  if (typeof relationship === 'object' && relationship?.id) {
    const useAsTitle = relationshipConfig?.admin?.useAsTitle || 'id'
    return relationship[useAsTitle] || ''
  }

  return String(relationship)
}
