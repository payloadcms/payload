export type Permission = {
  permission: boolean
  where?: Record<string, unknown>
}

export type CollectionPermission = {
  create: Permission
  read: Permission
  update: Permission
  delete: Permission
  fields: {
    [field: string]: {
      create: {
        permission: boolean
      }
      read: {
        permission: boolean
      }
      update: {
        permission: boolean
      }
      delete: {
        permission: boolean
      }
    }
  }
}

export type GlobalPermission = {
  read: Permission
  update: Permission
  fields: {
    [field: string]: {
      read: {
        permission: boolean
      }
      update: {
        permission: boolean
      }
    }
  }
}

export type Permissions = {
  canAccessAdmin: boolean
  license?: string
  collections: CollectionPermission[]
  globals?: GlobalPermission[]
}

export type User = {
  id: string
  email: string
  [key: string]: unknown
}
