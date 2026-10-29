import type { AllAccessKeys } from '../types.js'

export const collectionAccessKeys: AllAccessKeys = [
  'create',
  'read',
  'update',
  'delete',
  'readVersions',
  'unlock',
  'validate',
] as const
