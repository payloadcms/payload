import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { ValidationResult } from '../types/validation.js'

import { beforeChange } from '../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from './deepCopyObject.js'
import { deepMergeWithSourceArraysIgnoringUndefined } from './deepMerge.js'
import { toValidationResult } from './toValidationResult.js'

type EntityArgs =
  | {
      collection: null
      global: SanitizedGlobalConfig
      id?: never
    }
  | {
      collection: SanitizedCollectionConfig
      global: null
      id?: number | string
    }

export type ValidationSourceData = {
  docWithLocales: JsonObject
  originalDoc: JsonObject
  originalLocale: string
}

type RunValidationLifecycleArgs = {
  beforeValidation?: (args: { data: JsonObject }) => Promise<void> | void
  docWithLocales: JsonObject
  incomingData: JsonObject | undefined
  onValidationData?: (data: JsonObject) => void
  originalDoc: JsonObject
  overrideAccess: boolean
  req: PayloadRequest
  skipMutationHooks?: boolean
  validateData?: (args: { data: JsonObject }) => Promise<void> | void
  validationOperation?: 'create' | 'update' | 'validate'
} & EntityArgs

/**
 * Runs the hook and field-validation lifecycle shared by collection and global on-demand
 * validation after the operation has loaded its source document.
 */
export async function runValidationLifecycle(
  args: RunValidationLifecycleArgs,
): Promise<ValidationResult> {
  const {
    id,
    beforeValidation,
    collection,
    docWithLocales,
    global,
    incomingData,
    onValidationData,
    originalDoc,
    overrideAccess,
    req,
    skipMutationHooks = false,
    validateData,
    validationOperation = 'validate',
  } = args
  let data = deepCopyObjectSimple(incomingData ?? {})

  try {
    onValidationData?.(deepMergeWithSourceArraysIgnoringUndefined<JsonObject>(originalDoc, data))
    if (!skipMutationHooks) {
      await beforeValidation?.({ data })

      data = await beforeValidate({
        id,
        collection,
        context: req.context,
        data,
        doc: originalDoc,
        global,
        operation: validationOperation,
        overrideAccess,
        req,
      })
      onValidationData?.(data)

      if (collection) {
        for (const hook of collection.hooks.beforeValidate ?? []) {
          data =
            (await hook({
              collection,
              context: req.context,
              data,
              operation: validationOperation,
              originalDoc,
              req,
            })) || data
        }

        for (const hook of collection.hooks.beforeChange ?? []) {
          data =
            (await hook({
              collection,
              context: req.context,
              data,
              operation: validationOperation,
              originalDoc,
              req,
            })) || data
        }
      } else {
        if (validationOperation === 'create') {
          throw new Error('Global validation does not support the create operation.')
        }

        for (const hook of global.hooks.beforeValidate ?? []) {
          data =
            (await hook({
              context: req.context,
              data,
              global,
              operation: validationOperation,
              originalDoc,
              overrideAccess,
              req,
            })) || data
        }

        for (const hook of global.hooks.beforeChange ?? []) {
          data =
            (await hook({
              context: req.context,
              data,
              global,
              operation: validationOperation,
              originalDoc,
              overrideAccess,
              req,
            })) || data
        }
      }

      onValidationData?.(data)
    }

    let processedData = data

    await beforeChange({
      id,
      collection,
      context: req.context,
      data: id === undefined ? data : { ...data, id },
      doc: originalDoc,
      docWithLocales,
      global,
      isValidationOperation: true,
      onDataProcessed: (result) => {
        processedData = deepCopyObjectSimple(result)
      },
      operation: validationOperation,
      overrideAccess,
      req,
      skipHooks: skipMutationHooks,
    })

    const validationData = deepMergeWithSourceArraysIgnoringUndefined<JsonObject>(
      originalDoc,
      processedData,
    )
    onValidationData?.(validationData)
    await validateData?.({ data: validationData })
  } catch (error) {
    return toValidationResult({ error, req })
  }

  return {
    errors: [],
    valid: true,
  }
}
