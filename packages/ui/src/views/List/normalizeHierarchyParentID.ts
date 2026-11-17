import { APIError } from 'payload'

export function normalizeHierarchyParentID({ value }: { value: unknown }): null | number | string {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new APIError('Invalid hierarchy parent ID.', 400)
  }

  return value
}
