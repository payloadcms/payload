type ToSerializable = <T>(value: T) => T

export async function getToSerializable(): Promise<ToSerializable> {
  const serverModule = await import('@payloadcms/tanstack-start/server')

  if (typeof serverModule.toSerializable === 'function') {
    return serverModule.toSerializable
  }

  const defaultExport = (serverModule as { default?: { toSerializable?: unknown } }).default

  if (typeof defaultExport?.toSerializable === 'function') {
    return defaultExport.toSerializable as ToSerializable
  }

  const directModule = await import(
    '../../../packages/tanstack-start/src/utilities/toSerializable.js'
  )

  return directModule.toSerializable
}
