import type { BaseAdminAdapter } from './types.js'

export function createAdminAdapter<T extends BaseAdminAdapter>(args: T): T {
  return args
}
