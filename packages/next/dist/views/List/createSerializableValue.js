// Helper function to create serializable value for client components
export const createSerializableValue = value => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object' && value?.relationTo && value?.value) {
    return `${value.relationTo}:${value.value}`;
  }
  if (typeof value === 'object' && value?.id) {
    return String(value.id);
  }
  return String(value);
};
//# sourceMappingURL=createSerializableValue.js.map