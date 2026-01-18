/**
 * Safely resolves a deeply nested value from a document using dot-notation accessor paths.
 *
 * Used in list views to retrieve field values, especially for fields hoisted from nested structures
 * like groups, where the accessor may be in the form of `group.someField`.
 *
 * @param doc - The document object to retrieve the value from.
 * @param path - A dot-separated accessor string (e.g., "group.someField").
 * @returns The resolved value at the specified path, or undefined if any segment is missing.
 */export const findValueFromPath = (doc, path) => {
  return path.split('.').reduce((acc, key) => acc?.[key], doc);
};
//# sourceMappingURL=findValueFromPath.js.map