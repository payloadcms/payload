import type { RequestContext, User } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

const sharedValidationRequestProperties = new Set([
  'i18n',
  'payload',
  'server',
  'signal',
  't',
  'transactionID',
])

export function cloneValidationContext({
  context,
}: {
  context: RequestContext | undefined
}): RequestContext | undefined {
  return cloneValidationValue(context)
}

export function cloneValidationData<TData>({ data }: { data: TData }): TData {
  return cloneValidationValue(data)
}

export function cloneValidationRequest({
  request,
}: {
  request: Partial<PayloadRequest> | undefined
}): Partial<PayloadRequest> {
  if (!request) {
    return {}
  }

  const payloadRequest: Partial<PayloadRequest> = request
  const fetchRequest: Request | undefined =
    typeof Request !== 'undefined' && request instanceof Request ? request : undefined
  const canCloneFetchRequest = fetchRequest && !fetchRequest.bodyUsed
  let clonedRequest: Record<string, unknown>

  if (canCloneFetchRequest) {
    clonedRequest = fetchRequest.clone() as unknown as Record<string, unknown>
  } else {
    clonedRequest = {}
  }

  for (const [key, value] of Object.entries(payloadRequest)) {
    if (key === 'payloadDataLoader') {
      continue
    }

    if (key === 'file') {
      clonedRequest.file = cloneValidationFile(payloadRequest.file)
      continue
    }

    if (key === 'files') {
      clonedRequest.files = cloneValidationFiles(payloadRequest.files)
      continue
    }

    clonedRequest[key] = sharedValidationRequestProperties.has(key)
      ? value
      : cloneValidationValue(value)
  }

  Object.assign(clonedRequest, {
    context: cloneValidationValue(payloadRequest.context ?? {}),
    query: cloneValidationValue(payloadRequest.query ?? {}),
    routeParams: cloneValidationValue(payloadRequest.routeParams ?? {}),
  })

  if (!canCloneFetchRequest) {
    Object.assign(clonedRequest, {
      headers: cloneValidationValue(payloadRequest.headers),
      method: payloadRequest.method,
      signal: payloadRequest.signal,
      url: payloadRequest.url,
    })
  }

  return clonedRequest as Partial<PayloadRequest>
}

export function cloneValidationUser({
  user,
}: {
  user: null | undefined | User
}): null | undefined | User {
  return cloneValidationValue(user)
}

function cloneValidationFile(file: PayloadRequest['file']): PayloadRequest['file'] {
  if (!file) {
    return file
  }

  const { data, ...metadata } = file

  return {
    ...cloneValidationValue(metadata),
    data,
  }
}

function cloneValidationFiles(files: PayloadRequest['files']): PayloadRequest['files'] {
  if (!files) {
    return files
  }

  return Object.fromEntries(
    Object.entries(files).map(([fieldName, fileOrFiles]) => [
      fieldName,
      Array.isArray(fileOrFiles)
        ? fileOrFiles.map((file) => cloneValidationFile(file)!)
        : cloneValidationFile(fileOrFiles)!,
    ]),
  )
}

function cloneValidationValue<T>(value: T, cache = new WeakMap<object, unknown>()): T {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
    return value
  }

  if (typeof value === 'function' || value instanceof Promise) {
    return value
  }

  const objectValue = value as object
  const cachedValue = cache.get(objectValue)

  if (cachedValue) {
    return cachedValue as T
  }

  if (value instanceof Headers) {
    return new Headers(value) as T
  }

  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value) as T
  }

  if (value instanceof URL) {
    return new URL(value) as T
  }

  if (value instanceof Date) {
    return new Date(value) as T
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T
  }

  if (value instanceof ArrayBuffer) {
    return value.slice(0) as T
  }

  if (ArrayBuffer.isView(value)) {
    if (Buffer.isBuffer(value)) {
      return Buffer.from(value) as T
    }

    if (value instanceof DataView) {
      return new DataView(value.buffer.slice(0), value.byteOffset, value.byteLength) as T
    }

    return new (value.constructor as new (input: typeof value) => typeof value)(value)
  }

  if (value instanceof Map) {
    const clonedMap = new Map()
    cache.set(objectValue, clonedMap)
    for (const [key, mapValue] of value) {
      clonedMap.set(cloneValidationValue(key, cache), cloneValidationValue(mapValue, cache))
    }
    return clonedMap as T
  }

  if (value instanceof Set) {
    const clonedSet = new Set()
    cache.set(objectValue, clonedSet)
    for (const setValue of value) {
      clonedSet.add(cloneValidationValue(setValue, cache))
    }
    return clonedSet as T
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return value
  }

  const prototype = Object.getPrototypeOf(value)

  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return value
  }

  const clonedValue: Record<PropertyKey, unknown> | unknown[] = Array.isArray(value)
    ? []
    : Object.create(prototype)
  cache.set(objectValue, clonedValue)

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)

    if (descriptor?.enumerable) {
      ;(clonedValue as Record<PropertyKey, unknown>)[key] = cloneValidationValue(
        (value as Record<PropertyKey, unknown>)[key],
        cache,
      )
    }
  }

  return clonedValue as T
}
