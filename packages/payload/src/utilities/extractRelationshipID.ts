export const extractRelationshipID = ({
  relationship,
}: {
  relationship: unknown
}): number | string | undefined => {
  if (typeof relationship === 'number' || typeof relationship === 'string') {
    return relationship
  }

  if (relationship && typeof relationship === 'object' && 'value' in relationship) {
    const relationshipID = relationship.value

    if (typeof relationshipID === 'number' || typeof relationshipID === 'string') {
      return relationshipID
    }
  }

  return undefined
}
