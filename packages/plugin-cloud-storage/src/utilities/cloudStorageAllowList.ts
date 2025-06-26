export type AllowList = Array<{
  hostname: string
  pathname?: string
  port?: string
  protocol?: 'http' | 'https'
  search?: string
}>

export const cloudStorageAllowList: AllowList = [
  // Localhost
  { hostname: 'localhost' },
]
