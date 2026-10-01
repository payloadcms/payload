import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { PayloadRequest } from '../../../types/index.js'

import { resetBranchState } from '../../../branching/resolveBranch.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { createIsolatedDeferredCleanupContext } from '../../../utilities/transactionCallbacks.js'

const cloneFile = (
  file: NonNullable<PayloadRequest['file']>,
): NonNullable<PayloadRequest['file']> => ({
  ...file,
  data: Buffer.from(file.data),
})

const cloneRetrySafeValue = <Value>(
  value: Value,
  clones = new WeakMap<object, unknown>(),
): Value => {
  if (!value || typeof value !== 'object') {
    return value
  }

  const existingClone = clones.get(value)

  if (existingClone) {
    return existingClone as Value
  }

  if (Buffer.isBuffer(value)) {
    return Buffer.from(value) as Value
  }

  if (value instanceof Date) {
    return new Date(value) as Value
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as Value
  }

  if (Array.isArray(value)) {
    const clone: unknown[] = []

    clones.set(value, clone)

    for (const entry of value) {
      clone.push(cloneRetrySafeValue(entry, clones))
    }

    return clone as Value
  }

  if (value instanceof Map) {
    const clone = new Map()

    clones.set(value, clone)

    for (const [key, entry] of value) {
      clone.set(cloneRetrySafeValue(key, clones), cloneRetrySafeValue(entry, clones))
    }

    return clone as Value
  }

  if (value instanceof Set) {
    const clone = new Set()

    clones.set(value, clone)

    for (const entry of value) {
      clone.add(cloneRetrySafeValue(entry, clones))
    }

    return clone as Value
  }

  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    return value
  }

  const clone = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>

  clones.set(value, clone)

  for (const key of Reflect.ownKeys(value)) {
    clone[key] = cloneRetrySafeValue((value as Record<PropertyKey, unknown>)[key], clones)
  }

  return clone as Value
}

/** Creates a request whose mutable operation state cannot leak into another transaction attempt. */
export const createOperationRetryRequest = async ({
  copyFileTempPath = false,
  req,
}: {
  copyFileTempPath?: boolean
  req: PayloadRequest
}): Promise<PayloadRequest> => {
  const retryReq = isolateObjectProperty(req, [
    'branch',
    'context',
    'data',
    'file',
    'files',
    'payloadDataLoader',
    'payloadUploadSizes',
    'query',
    'routeParams',
    'transactionID',
  ])

  retryReq.context = cloneRetrySafeValue(createIsolatedDeferredCleanupContext({ req }))
  retryReq.data = req.data ? deepCopyObjectSimple(req.data) : undefined
  retryReq.file = req.file ? cloneFile(req.file) : undefined
  retryReq.files = req.files
    ? Object.fromEntries(
        Object.entries(req.files).map(([fieldName, files]) => [
          fieldName,
          Array.isArray(files) ? files.map(cloneFile) : cloneFile(files),
        ]),
      )
    : undefined
  retryReq.query = deepCopyObjectSimple(req.query)
  retryReq.routeParams = req.routeParams ? deepCopyObjectSimple(req.routeParams) : undefined
  delete (retryReq as Partial<PayloadRequest>).payloadDataLoader
  delete retryReq.payloadUploadSizes
  delete retryReq.transactionID
  resetBranchState(retryReq)

  const preparedReq = await createPayloadRequest({ payload: req.payload, req: retryReq })
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

  return preparedReq
}
