'use client';

import { fieldAffectsData } from 'payload/shared';
export const createNestedClientFieldPath = (parentPath, field) => {
  if (parentPath) {
    if (fieldAffectsData(field) && field.name) {
      return `${parentPath}.${field.name}`;
    }
    return parentPath;
  }
  if (fieldAffectsData(field)) {
    return field.name;
  }
  return '';
};
//# sourceMappingURL=createNestedClientFieldPath.js.map