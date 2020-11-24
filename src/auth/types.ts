export type Permission = {
  permission: boolean
  where?: Record<string, unknown>
}

export type Permissions = {
  [key: string]: boolean | {
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
}

export type User = {
  id: string
  email: string
  [key: string]: unknown
}
