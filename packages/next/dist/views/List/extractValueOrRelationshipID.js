// Helper function to extract value or relationship ID for database queries
export const extractValueOrRelationshipID = relationship => {
  if (!relationship || typeof relationship !== 'object') {
    return relationship;
  }
  // For polymorphic relationships, preserve structure but ensure IDs are strings
  if (relationship?.relationTo && relationship?.value) {
    return {
      relationTo: relationship.relationTo,
      value: String(relationship.value?.id || relationship.value)
    };
  }
  // For regular relationships, extract ID
  if (relationship?.id) {
    return String(relationship.id);
  }
  return relationship;
};
//# sourceMappingURL=extractValueOrRelationshipID.js.map