import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { PayloadRequest } from '../../../types/index.js'

import { isConcurrentShadowOperationError } from '../../../branching/createShadowRow.js'
import { refreshBranchState, resetBranchState } from '../../../branching/resolveBranch.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import {
  createIsolatedDeferredCleanupContext,
  deferredCleanupScopeContextKey,
} from '../../../utilities/transactionCallbacks.js'

type RetryCloneGraph = {
  clonesByOriginal: WeakMap<object, object>
  isRetrySafe: boolean
  originalsByClone: WeakMap<object, object>
}

type OperationRetryRequest = {
  isRetrySafe: boolean
  req: PayloadRequest
}

type RetryRequestState = {
  originalReq: PayloadRequest
  originalsByClone: WeakMap<object, object>
}

const createRetryCloneGraph = (): RetryCloneGraph => ({
  clonesByOriginal: new WeakMap(),
  isRetrySafe: true,
  originalsByClone: new WeakMap(),
})

const recordRetryClone = ({
  clone,
  graph,
  original,
}: {
  clone: object
  graph: RetryCloneGraph
  original: object
}): void => {
  graph.clonesByOriginal.set(original, clone)
  graph.originalsByClone.set(clone, original)
}

const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype) as object
const maximumRetrySafeIndexedPropertyCount = 65_536

const markValueAsRetryUnsafe = ({
  graph,
  value,
}: {
  graph: RetryCloneGraph
  value: object
}): void => {
  graph.isRetrySafe = false
  recordRetryClone({ clone: value, graph, original: value })
}

const isArrayIndexProperty = (key: PropertyKey): boolean => {
  if (typeof key !== 'string' || key === '') {
    return false
  }

  const index = Number(key)

  return Number.isInteger(index) && index >= 0 && index < 4_294_967_295 && String(index) === key
}

const isSupportedArrayBufferViewPrototype = ({ value }: { value: ArrayBufferView }): boolean => {
  const prototype = Object.getPrototypeOf(value) as object

  if (Buffer.isBuffer(value)) {
    return prototype === Buffer.prototype
  }

  if (value instanceof DataView) {
    return prototype === DataView.prototype
  }

  return Object.getPrototypeOf(prototype) === typedArrayPrototype
}

const markUnsupportedSpecialObjectAsRetryUnsafe = ({
  expectedPrototype,
  graph,
  isAllowedOwnProperty = () => false,
  value,
}: {
  expectedPrototype?: object
  graph: RetryCloneGraph
  isAllowedOwnProperty?: (args: { descriptor: PropertyDescriptor; key: PropertyKey }) => boolean
  value: object
}): boolean => {
  const hasSupportedPrototype = expectedPrototype
    ? Object.getPrototypeOf(value) === expectedPrototype
    : isSupportedArrayBufferViewPrototype({ value: value as ArrayBufferView })

  if (!hasSupportedPrototype) {
    markValueAsRetryUnsafe({ graph, value })

    return true
  }

  const hasUnsupportedOwnProperty = Reflect.ownKeys(value).some((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)

    return !descriptor || !isAllowedOwnProperty({ descriptor, key })
  })

  if (!hasUnsupportedOwnProperty) {
    return false
  }

  markValueAsRetryUnsafe({ graph, value })

  return true
}

const cloneRetrySafeValue = <Value>(
  value: Value,
  graph: RetryCloneGraph = createRetryCloneGraph(),
): Value => {
  if (typeof value === 'function') {
    graph.isRetrySafe = false

    return value
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const existingClone = graph.clonesByOriginal.get(value)

  if (existingClone) {
    return existingClone as Value
  }

  if (value instanceof Date) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: Date.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new Date(value)

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (value instanceof RegExp) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: RegExp.prototype,
        graph,
        isAllowedOwnProperty: ({ descriptor, key }) => key === 'lastIndex' && 'value' in descriptor,
        value,
      })
    ) {
      return value
    }

    const clone = new RegExp(value.source, value.flags)

    clone.lastIndex = value.lastIndex
    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (value instanceof Headers) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: Headers.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new Headers(value)

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (value instanceof URL) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: URL.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new URL(value)

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (value instanceof URLSearchParams) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: URLSearchParams.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new URLSearchParams(value)

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (isSharedArrayBuffer(value)) {
    graph.isRetrySafe = false
    recordRetryClone({ clone: value, graph, original: value })

    return value
  }

  if (value instanceof ArrayBuffer) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: ArrayBuffer.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = structuredClone(value)

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (ArrayBuffer.isView(value)) {
    if (isSharedArrayBuffer(value.buffer)) {
      graph.isRetrySafe = false
      recordRetryClone({ clone: value, graph, original: value })

      return value
    }

    if (!isSupportedArrayBufferViewPrototype({ value })) {
      markValueAsRetryUnsafe({ graph, value })

      return value
    }

    const indexedPropertyCount =
      'length' in value && typeof value.length === 'number' ? value.length : 0

    if (indexedPropertyCount > maximumRetrySafeIndexedPropertyCount) {
      markValueAsRetryUnsafe({ graph, value })

      return value
    }

    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        graph,
        isAllowedOwnProperty: ({ descriptor, key }) =>
          isArrayIndexProperty(key) && 'value' in descriptor,
        value,
      })
    ) {
      return value
    }

    const clonedBuffer = cloneRetrySafeValue(value.buffer, graph)
    const clone = createArrayBufferView({ buffer: clonedBuffer, source: value })

    recordRetryClone({ clone, graph, original: value })

    return clone as Value
  }

  if (Array.isArray(value)) {
    if (value.length > maximumRetrySafeIndexedPropertyCount) {
      markValueAsRetryUnsafe({ graph, value })

      return value
    }

    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: Array.prototype,
        graph,
        isAllowedOwnProperty: ({ descriptor, key }) =>
          (key === 'length' || isArrayIndexProperty(key)) && 'value' in descriptor,
        value,
      })
    ) {
      return value
    }

    const clone: unknown[] = []

    recordRetryClone({ clone, graph, original: value })

    for (const entry of value) {
      clone.push(cloneRetrySafeValue(entry, graph))
    }

    mirrorObjectIntegrity({ source: value, target: clone })

    return clone as Value
  }

  if (value instanceof Map) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: Map.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new Map()

    recordRetryClone({ clone, graph, original: value })

    for (const [key, entry] of value) {
      clone.set(cloneRetrySafeValue(key, graph), cloneRetrySafeValue(entry, graph))
    }

    return clone as Value
  }

  if (value instanceof Set) {
    if (
      markUnsupportedSpecialObjectAsRetryUnsafe({
        expectedPrototype: Set.prototype,
        graph,
        value,
      })
    ) {
      return value
    }

    const clone = new Set()

    recordRetryClone({ clone, graph, original: value })

    for (const entry of value) {
      clone.add(cloneRetrySafeValue(entry, graph))
    }

    return clone as Value
  }

  if (hasUncloneableInternalState({ value })) {
    graph.isRetrySafe = false
    recordRetryClone({ clone: value, graph, original: value })

    return value
  }

  const clone = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>

  recordRetryClone({ clone, graph, original: value })

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)

    if (!descriptor) {
      continue
    }

    if (!('value' in descriptor)) {
      graph.isRetrySafe = false
    } else {
      descriptor.value = cloneRetrySafeValue(descriptor.value, graph)
    }

    Object.defineProperty(clone, key, descriptor)
  }

  mirrorObjectIntegrity({ source: value, target: clone })

  return clone as Value
}

const isSharedArrayBuffer = (value: unknown): value is SharedArrayBuffer =>
  typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer

const hasUncloneableInternalState = ({ value }: { value: object }): boolean => {
  let prototype = Object.getPrototypeOf(value)

  while (prototype && prototype !== Object.prototype) {
    const constructor = prototype.constructor
    const constructorSource =
      typeof constructor === 'function' ? Function.prototype.toString.call(constructor) : ''

    const hasPrototypeMethods = Reflect.ownKeys(prototype).some((key) => key !== 'constructor')

    if (
      constructorSource.includes('[native code]') ||
      /#[a-z_$]/i.test(constructorSource) ||
      hasPrototypeMethods
    ) {
      return true
    }

    prototype = Object.getPrototypeOf(prototype)
  }

  return false
}

const createArrayBufferView = ({
  buffer,
  source,
}: {
  buffer: ArrayBuffer
  source: ArrayBufferView
}): ArrayBufferView => {
  if (Buffer.isBuffer(source)) {
    return Buffer.from(buffer, source.byteOffset, source.byteLength)
  }

  if (source instanceof DataView) {
    return new DataView(buffer, source.byteOffset, source.byteLength)
  }

  const TypedArray = source.constructor as new (
    buffer: ArrayBuffer,
    byteOffset: number,
    length: number,
  ) => ArrayBufferView

  return new TypedArray(buffer, source.byteOffset, (source as Uint8Array).length)
}

const mirrorObjectIntegrity = ({ source, target }: { source: object; target: object }): void => {
  if (Object.isFrozen(source)) {
    Object.freeze(target)
  } else if (Object.isSealed(source)) {
    Object.seal(target)
  } else if (!Object.isExtensible(source)) {
    Object.preventExtensions(target)
  }
}

const synchronizeRetrySafeValue = <Value>({
  allowUnprovenTargetReuse = false,
  deleteMissingProperties = true,
  originalsByClone,
  preservedMissingTargetKeys,
  source,
  synchronizedTargets = new WeakMap<object, object>(),
  target,
}: {
  allowUnprovenTargetReuse?: boolean
  deleteMissingProperties?: boolean
  originalsByClone: WeakMap<object, object>
  preservedMissingTargetKeys?: ReadonlySet<PropertyKey>
  source: Value
  synchronizedTargets?: WeakMap<object, object>
  target: Value
}): Value => {
  if (!source || typeof source !== 'object') {
    return source
  }

  const synchronizedTarget = synchronizedTargets.get(source)
  const originalValue = originalsByClone.get(source)
  const targetValue = (originalValue ?? (allowUnprovenTargetReuse ? target : undefined)) as Value

  if (source instanceof ArrayBuffer) {
    const synchronizedBuffer =
      synchronizedTarget instanceof ArrayBuffer &&
      synchronizedTarget.byteLength === source.byteLength
        ? synchronizedTarget
        : targetValue instanceof ArrayBuffer && targetValue.byteLength === source.byteLength
          ? targetValue
          : new ArrayBuffer(source.byteLength)

    synchronizedTargets.set(source, synchronizedBuffer)
    new Uint8Array(synchronizedBuffer).set(new Uint8Array(source))

    return synchronizedBuffer as Value
  }

  if (synchronizedTarget) {
    return synchronizedTarget as Value
  }

  if (Object.is(source, targetValue)) {
    synchronizedTargets.set(source, targetValue as object)

    return targetValue
  }

  if (source instanceof Date) {
    const synchronizedDate = targetValue instanceof Date ? targetValue : new Date(source)

    synchronizedTargets.set(source, synchronizedDate)
    synchronizedDate.setTime(source.getTime())

    return synchronizedDate as Value
  }

  if (source instanceof RegExp) {
    const synchronizedRegExp =
      targetValue instanceof RegExp &&
      targetValue.source === source.source &&
      targetValue.flags === source.flags
        ? targetValue
        : new RegExp(source.source, source.flags)

    synchronizedTargets.set(source, synchronizedRegExp)
    synchronizedRegExp.lastIndex = source.lastIndex

    return synchronizedRegExp as Value
  }

  if (source instanceof Headers) {
    const synchronizedHeaders = targetValue instanceof Headers ? targetValue : new Headers()

    synchronizedTargets.set(source, synchronizedHeaders)
    for (const key of [...synchronizedHeaders.keys()]) {
      synchronizedHeaders.delete(key)
    }
    for (const [key, value] of source) {
      synchronizedHeaders.append(key, value)
    }

    return synchronizedHeaders as Value
  }

  if (source instanceof URL) {
    const synchronizedURL = targetValue instanceof URL ? targetValue : new URL(source)

    synchronizedTargets.set(source, synchronizedURL)
    synchronizedURL.href = source.href

    return synchronizedURL as Value
  }

  if (source instanceof URLSearchParams) {
    const synchronizedSearchParams =
      targetValue instanceof URLSearchParams ? targetValue : new URLSearchParams()

    synchronizedTargets.set(source, synchronizedSearchParams)
    for (const key of [...synchronizedSearchParams.keys()]) {
      synchronizedSearchParams.delete(key)
    }
    for (const [key, value] of source) {
      synchronizedSearchParams.append(key, value)
    }

    return synchronizedSearchParams as Value
  }

  if (ArrayBuffer.isView(source)) {
    const sourceBuffer = source.buffer as ArrayBuffer
    const synchronizedBufferFromGraph = synchronizedTargets.get(sourceBuffer)
    const originalBuffer = originalsByClone.get(sourceBuffer)
    const synchronizedBuffer =
      synchronizedBufferFromGraph instanceof ArrayBuffer
        ? synchronizedBufferFromGraph
        : ArrayBuffer.isView(targetValue) && targetValue.buffer instanceof ArrayBuffer
          ? targetValue.buffer
          : originalBuffer instanceof ArrayBuffer
            ? originalBuffer
            : new ArrayBuffer(sourceBuffer.byteLength)

    synchronizedTargets.set(sourceBuffer, synchronizedBuffer)
    const synchronizedView =
      ArrayBuffer.isView(targetValue) &&
      targetValue.constructor === source.constructor &&
      targetValue.byteLength === source.byteLength &&
      targetValue.byteOffset === source.byteOffset
        ? targetValue
        : createArrayBufferView({ buffer: synchronizedBuffer, source })

    synchronizedTargets.set(source, synchronizedView)
    new Uint8Array(
      synchronizedView.buffer,
      synchronizedView.byteOffset,
      synchronizedView.byteLength,
    ).set(new Uint8Array(source.buffer, source.byteOffset, source.byteLength))

    return synchronizedView as Value
  }

  if (Array.isArray(source)) {
    const synchronizedArray = Array.isArray(targetValue) ? targetValue : []

    synchronizedTargets.set(source, synchronizedArray)

    for (let index = 0; index < source.length; index++) {
      const synchronizedEntry = synchronizeRetrySafeValue({
        originalsByClone,
        source: source[index],
        synchronizedTargets,
        target: synchronizedArray[index],
      })

      setSynchronizedProperty({ key: index, target: synchronizedArray, value: synchronizedEntry })
    }
    setSynchronizedProperty({ key: 'length', target: synchronizedArray, value: source.length })
    mirrorObjectIntegrity({ source, target: synchronizedArray })

    return synchronizedArray as Value
  }

  if (source instanceof Map) {
    const synchronizedMap = targetValue instanceof Map ? targetValue : new Map()

    synchronizedTargets.set(source, synchronizedMap)
    const synchronizedEntries: [unknown, unknown][] = []
    for (const [key, entry] of source) {
      const synchronizedKey = synchronizeRetrySafeValue({
        originalsByClone,
        source: key,
        synchronizedTargets,
        target: undefined,
      })
      const synchronizedEntry = synchronizeRetrySafeValue({
        originalsByClone,
        source: entry,
        synchronizedTargets,
        target: synchronizedMap.get(synchronizedKey),
      })

      synchronizedEntries.push([synchronizedKey, synchronizedEntry])
    }

    synchronizedMap.clear()
    for (const [key, entry] of synchronizedEntries) {
      synchronizedMap.set(key, entry)
    }

    return synchronizedMap as Value
  }

  if (source instanceof Set) {
    const synchronizedSet = targetValue instanceof Set ? targetValue : new Set()

    synchronizedTargets.set(source, synchronizedSet)
    const synchronizedEntries: unknown[] = []
    for (const entry of source) {
      synchronizedEntries.push(
        synchronizeRetrySafeValue({
          originalsByClone,
          source: entry,
          synchronizedTargets,
          target: undefined,
        }),
      )
    }

    synchronizedSet.clear()
    for (const entry of synchronizedEntries) {
      synchronizedSet.add(entry)
    }

    return synchronizedSet as Value
  }

  if (hasUncloneableInternalState({ value: source })) {
    synchronizedTargets.set(source, source)

    return source
  }

  const synchronizedObject =
    targetValue &&
    typeof targetValue === 'object' &&
    Object.getPrototypeOf(source) === Object.getPrototypeOf(targetValue)
      ? targetValue
      : Object.create(Object.getPrototypeOf(source))

  synchronizedTargets.set(source, synchronizedObject)

  const sourceRecord = source as Record<PropertyKey, unknown>
  const targetRecord = synchronizedObject as Record<PropertyKey, unknown>

  if (deleteMissingProperties) {
    for (const key of Reflect.ownKeys(targetRecord)) {
      if (!Object.hasOwn(sourceRecord, key) && !preservedMissingTargetKeys?.has(key)) {
        const descriptor = Object.getOwnPropertyDescriptor(targetRecord, key)

        if (descriptor?.configurable !== false) {
          delete targetRecord[key]
        }
      }
    }
  }

  for (const key of Reflect.ownKeys(sourceRecord)) {
    const synchronizedValue = synchronizeRetrySafeValue({
      originalsByClone,
      source: sourceRecord[key],
      synchronizedTargets,
      target: targetRecord[key],
    })

    setSynchronizedProperty({ key, target: targetRecord, value: synchronizedValue })
  }

  mirrorObjectIntegrity({ source, target: synchronizedObject })

  return synchronizedObject
}

const setSynchronizedProperty = ({
  key,
  target,
  value,
}: {
  key: PropertyKey
  target: object
  value: unknown
}): void => {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  const currentValue = Reflect.get(target, key)

  if (Object.is(currentValue, value)) {
    return
  }

  if (
    !descriptor ||
    ('value' in descriptor ? descriptor.writable !== false : descriptor.set !== undefined)
  ) {
    Reflect.set(target, key, value)
  }
}

const retryRequestStateByRequest = new WeakMap<PayloadRequest, RetryRequestState>()

export const shouldRetryOperationRequest = ({
  didOwnAttemptTransaction,
  didReachFinalCommit,
  error,
  hasCallerTransaction,
  isRetrySafe,
}: {
  didOwnAttemptTransaction: boolean
  didReachFinalCommit: boolean
  error: unknown
  hasCallerTransaction: boolean
  isRetrySafe: boolean
}): boolean =>
  isRetrySafe &&
  !hasCallerTransaction &&
  didOwnAttemptTransaction &&
  (didReachFinalCommit || isConcurrentShadowOperationError(error))

/** Applies mutable request changes from an attempt only after its database work succeeds. */
export const commitOperationRetryRequestContext = ({ req }: { req: PayloadRequest }): void => {
  const retryRequestState = retryRequestStateByRequest.get(req)

  if (!retryRequestState) {
    return
  }

  const { originalReq, originalsByClone } = retryRequestState

  try {
    const synchronizedTargets = new WeakMap<object, object>()

    originalReq.context = synchronizeRetrySafeValue({
      allowUnprovenTargetReuse: true,
      originalsByClone,
      preservedMissingTargetKeys: new Set([deferredCleanupScopeContextKey]),
      source: createIsolatedDeferredCleanupContext({ req }),
      synchronizedTargets,
      target: originalReq.context,
    })

    if (req.responseHeaders) {
      originalReq.responseHeaders = synchronizeRetrySafeValue({
        originalsByClone,
        source: req.responseHeaders,
        synchronizedTargets,
        target: originalReq.responseHeaders,
      })
    } else {
      delete originalReq.responseHeaders
    }
  } catch (err) {
    originalReq.payload.logger.error({
      err,
      msg: 'Failed to apply request state changes after committing an operation retry.',
    })
  } finally {
    refreshBranchState(originalReq)
    retryRequestStateByRequest.delete(req)
  }
}

/** Creates a request whose mutable operation state cannot leak into another transaction attempt. */
export const createOperationRetryRequest = async ({
  copyFileTempPath = false,
  req,
}: {
  copyFileTempPath?: boolean
  req: PayloadRequest
}): Promise<OperationRetryRequest> => {
  req.context ??= {}
  const cloneGraph = createRetryCloneGraph()
  const retryReq = isolateObjectProperty(req, [
    'branch',
    'context',
    'data',
    'fallbackLocale',
    'file',
    'files',
    'headers',
    'locale',
    'payloadDataLoader',
    'payloadUploadSizes',
    'query',
    'responseHeaders',
    'routeParams',
    'searchParams',
    'transactionID',
    'user',
  ])

  retryReq.context = cloneRetrySafeValue(createIsolatedDeferredCleanupContext({ req }), cloneGraph)
  retryReq.data = cloneRetrySafeValue(req.data, cloneGraph)
  retryReq.file = cloneRetrySafeValue(req.file, cloneGraph)
  retryReq.files = cloneRetrySafeValue(req.files, cloneGraph)
  retryReq.headers = cloneRetrySafeValue(req.headers, cloneGraph)
  retryReq.query = cloneRetrySafeValue(req.query, cloneGraph)
  retryReq.responseHeaders = cloneRetrySafeValue(req.responseHeaders, cloneGraph)
  retryReq.routeParams = cloneRetrySafeValue(req.routeParams, cloneGraph)
  Reflect.set(retryReq, 'searchParams', cloneRetrySafeValue(req.searchParams, cloneGraph))
  retryReq.user = cloneRetrySafeValue(req.user, cloneGraph)

  if (!cloneGraph.isRetrySafe) {
    return { isRetrySafe: false, req }
  }

  delete (retryReq as Partial<PayloadRequest>).payloadDataLoader
  delete retryReq.payloadUploadSizes
  delete retryReq.transactionID
  resetBranchState(retryReq)

  const fallbackLocale =
    req.fallbackLocale === false || typeof req.fallbackLocale === 'string'
      ? req.fallbackLocale
      : undefined
  const preparedReq = await createPayloadRequest({
    fallbackLocale,
    payload: req.payload,
    req: retryReq,
  })
  const sourceTempFilePath = preparedReq.file?.tempFilePath

  if (copyFileTempPath && sourceTempFilePath) {
    const extension = path.extname(sourceTempFilePath)
    const attemptTempFilePath = path.join(
      path.dirname(sourceTempFilePath),
      `${path.basename(sourceTempFilePath, extension)}-${randomUUID()}${extension}`,
    )

    await fs.copyFile(sourceTempFilePath, attemptTempFilePath, constants.COPYFILE_EXCL)
    preparedReq.file!.tempFilePath = attemptTempFilePath
  }

  retryRequestStateByRequest.set(preparedReq, {
    originalReq: req,
    originalsByClone: cloneGraph.originalsByClone,
  })

  return { isRetrySafe: true, req: preparedReq }
}
