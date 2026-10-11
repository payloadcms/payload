/** Validates and returns a complete, canonical key supplied by the storage path builder or provider. */
export const normalizeStorageKey = ({ key }: { key: string }): string => {
  if (
    !key ||
    key.startsWith('/') ||
    key.includes('\\') ||
    key.includes('\0') ||
    key.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Unsafe managed storage key')
  }

  return key
}

export const getOriginalFilename = ({ filename }: { filename: string }): string =>
  insertSuffix({ filename, suffix: 'original' })

export const getArchivedFilename = ({
  filename,
  versionID,
}: {
  filename: string
  versionID: number | string
}): string => {
  const id = String(versionID)

  if (!id) {
    throw new Error('An archived file requires a version ID')
  }

  const safeID = /^[\w-]+$/.test(id) ? id : `~${Buffer.from(id).toString('base64url')}`

  return insertSuffix({ filename, suffix: safeID })
}

const insertSuffix = ({ filename, suffix }: { filename: string; suffix: string }): string => {
  const { extension, stem } = splitFilename({ filename })

  return `${stem}-${suffix}${extension}`
}

const splitFilename = ({ filename }: { filename: string }): { extension: string; stem: string } => {
  assertSafeFilename({ filename })

  const extensionIndex = filename.lastIndexOf('.')

  return extensionIndex > 0
    ? { extension: filename.slice(extensionIndex), stem: filename.slice(0, extensionIndex) }
    : { extension: '', stem: filename }
}

const assertSafeFilename = ({ filename }: { filename: string }): void => {
  if (
    !filename ||
    filename === '.' ||
    filename === '..' ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('\0')
  ) {
    throw new Error('Unsafe managed filename')
  }
}
