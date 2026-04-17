import type { AccessResult } from '../config/types.js'
import type { Permission } from './index.js'

export const extractAccessFromPermission = (hasPermission: boolean | Permission): AccessResult => {
  if (typeof hasPermission === 'boolean') {
    return hasPermission
  }

  const { permission, where } = hasPermission
  if (!permission) {
    return false
  }
  if (where && typeof where === 'object') {
    return where
  }
  return true
}
