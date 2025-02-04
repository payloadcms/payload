import type { FormState } from 'payload'

export const initialState: FormState = {
  depth: {
    initialValue: 1,
    valid: true,
    value: 1,
  },
  drafts: {
    initialValue: 'include',
    valid: true,
    value: 'include',
  },
  filename: {
    initialValue: 'untitled-collection-export-01-01-2025.csv',
    valid: true,
    value: 'untitled-collection-export-01-01-2025.csv',
  },
  format: {
    initialValue: 'csv',
    valid: true,
    value: 'csv',
  },
  limit: {
    initialValue: 100,
    valid: true,
    value: 100,
  },
  locales: {
    initialValue: ['all'],
    valid: true,
    value: ['all'],
  },
  sortby: {
    initialValue: ['ID'],
    valid: true,
    value: ['ID'],
  },
  useCurrentFilters: {
    initialValue: false,
    valid: true,
    value: false,
  },
  useCurrentSelection: {
    initialValue: false,
    valid: true,
    value: false,
  },
}
