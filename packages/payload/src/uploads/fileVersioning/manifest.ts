import type {
  ManagedFileIdentity,
  ManagedFileManifest,
  ManagedFileReference,
  ManagedFileRole,
} from './types.js'

import { normalizeStorageKey } from './naming.js'

export const getManagedFileIdentity = ({ backend, key }: ManagedFileIdentity): string => {
  if (!backend || backend.trim() !== backend) {
    throw new Error('A managed file requires a configured storage backend identity')
  }

  return JSON.stringify([backend, normalizeStorageKey({ key })])
}

export const createManagedFileManifest = ({
  references,
}: {
  references: ManagedFileReference[]
}): ManagedFileManifest => {
  const files: ManagedFileManifest = []
  const fileByIdentity = new Map<string, ManagedFileManifest[number]>()

  for (const { backend, key, role } of references) {
    validateRole({ role })

    const normalizedKey = normalizeStorageKey({ key })
    const identity = getManagedFileIdentity({ backend, key: normalizedKey })
    let file = fileByIdentity.get(identity)

    if (!file) {
      file = { backend, key: normalizedKey, roles: [] }
      fileByIdentity.set(identity, file)
      files.push(file)
    }

    if (!file.roles.some((existingRole) => isSameRole({ first: existingRole, second: role }))) {
      file.roles.push(role)
    }
  }

  return files
}

export const hasManagedFile = ({
  backend,
  key,
  manifest,
}: { manifest: ManagedFileManifest } & ManagedFileIdentity): boolean => {
  const identity = getManagedFileIdentity({ backend, key })

  return manifest.some((file) => getManagedFileIdentity(file) === identity)
}

const isSameRole = ({ first, second }: { first: ManagedFileRole; second: ManagedFileRole }) =>
  first.type === second.type &&
  (first.type !== 'size' || (second.type === 'size' && first.sizeKey === second.sizeKey))

const validateRole = ({ role }: { role: ManagedFileRole }): void => {
  if (role.type === 'size' && (!role.sizeKey || role.sizeKey.includes('/'))) {
    throw new Error('A managed size requires a safe size key')
  }
}
