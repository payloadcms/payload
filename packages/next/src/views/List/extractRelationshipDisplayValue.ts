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
    return relationship.value?.[config?.admin?.useAsTitle || 'id'] || ''
  }

  // Handle regular relationships
  if (typeof relationship === 'object' && relationship?.id) {
    return relationship[relationshipConfig?.admin?.useAsTitle || 'id'] || ''
  }

  return String(relationship)
}
