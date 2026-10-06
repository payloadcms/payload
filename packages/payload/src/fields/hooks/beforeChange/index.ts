import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { ValidationFieldError } from '../../../errors/index.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { hasLocalizeStatusEnabled } from '../../../utilities/getVersionsConfig.js'
import { mergeLocalizedData } from '../../../utilities/mergeLocalizedData.js'
import { getLocaleData } from '../../../versions/getLocaleData.js'
import { traverseFields } from './traverseFields.js'

export type Args<T extends JsonObject> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: T
  doc: T
  docWithLocales: JsonObject
  /**
   * Names of the top-level fields submitted by the caller. When present, validation skips other
   * top-level fields and validates all nested fields below each submitted field.
   */
  fieldsToValidate?: ReadonlySet<string>
  global: null | SanitizedGlobalConfig
  id?: number | string
  onDataProcessed?: (data: T) => void
  /** Retain locale validation until a document-wide publication status is final. */
  onDraftValidation?: (validate: () => Promise<void>) => void
  operation: Operation
  overrideAccess?: boolean
  req: PayloadRequest
  skipValidation?: boolean
  skipValidationByLocale?: Record<string, boolean>
  /** Validate an exempt draft if field hooks transition it to published. */
  validateDraftOnPublish?: boolean
}

/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */

export const beforeChange = async <T extends JsonObject>({
  id,
  collection,
  context,
  data: incomingData,
  doc,
  docWithLocales,
  fieldsToValidate: submittedTopLevelFieldNames,
  global,
  onDataProcessed,
  onDraftValidation,
  operation,
  overrideAccess,
  req,
  skipValidation,
  skipValidationByLocale,
  validateDraftOnPublish,
}: Args<T>): Promise<T> => {
  const { localization } = req.payload.config

  if (req.locale === 'all' && localization) {
    const fields = (collection?.fields || global?.fields)!
    let result: JsonObject = { ...docWithLocales }
    let locales = localization.locales

    if (localization.filterAvailableLocales) {
      locales = await localization.filterAvailableLocales({ locales, req })
    }

    const draftValidationActions: (() => Promise<void>)[] = []
    const shouldValidateLocalesTogether = !hasLocalizeStatusEnabled(collection || global!)
    const publicationStatus = incomingData._status
    let hasPublicationIntent =
      locales.length > 0 && (publicationStatus === 'published' || publicationStatus === 'draft')

    for (const localeDefinition of locales) {
      const locale = typeof localeDefinition === 'string' ? localeDefinition : localeDefinition.code
      const localeReq = Object.assign(Object.create(Object.getPrototypeOf(req)), req, {
        locale,
      }) as PayloadRequest
      const localeData = getLocaleData({ data: incomingData, fields, locale, req: localeReq })
      const localeDoc = getLocaleData({ data: doc || {}, fields, locale, req: localeReq })
      const processed = await beforeChange({
        id,
        collection,
        context,
        data: localeData as T,
        doc: localeDoc as T,
        docWithLocales: result,
        fieldsToValidate: submittedTopLevelFieldNames,
        global,
        onDataProcessed: (data) => {
          hasPublicationIntent &&= data._status === publicationStatus
        },
        onDraftValidation: shouldValidateLocalesTogether
          ? (validate) => draftValidationActions.push(validate)
          : undefined,
        operation,
        overrideAccess,
        req: localeReq,
        skipValidation: skipValidationByLocale?.[locale] ?? skipValidation,
        validateDraftOnPublish: validateDraftOnPublish || Boolean(skipValidationByLocale),
      })

      result = mergeLocalizedData({
        configBlockReferences: req.payload.config.blocks,
        dataWithLocales: processed,
        docWithLocales: result,
        fields,
        localesToUpdate: [locale],
      })
    }

    if (shouldValidateLocalesTogether && result._status === 'published') {
      await Promise.all(draftValidationActions.map((validate) => validate()))
    }

    onDataProcessed?.(
      (hasPublicationIntent ? { ...result, _status: publicationStatus } : result) as T,
    )
    return result as T
  }

  const data = deepCopyObjectSimple(incomingData)
  const mergeLocaleActions: (() => Promise<void> | void)[] = []
  const errors: ValidationFieldError[] = []
  const draftValidationActions:
    | ((validationData?: WeakMap<object, JsonObject>) => Promise<void>)[]
    | undefined = validateDraftOnPublish && skipValidation ? [] : undefined

  await traverseFields({
    id,
    collection,
    context,
    data,
    doc,
    docWithLocales,
    draftValidationActions,
    errors,
    fieldLabelPath: '',
    fields: (collection?.fields || global?.fields)!,
    global,
    mergeLocaleActions,
    operation,
    overrideAccess: overrideAccess!,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    siblingData: data,
    siblingDoc: doc,
    siblingDocWithLocales: docWithLocales,
    skipValidation,
    submittedTopLevelFieldNames,
  })

  const throwValidationErrors = () => {
    if (errors.length > 0) {
      throw new ValidationError(
        { id, collection: collection?.slug, errors, global: global?.slug, req },
        req.t,
      )
    }
  }

  if (draftValidationActions) {
    const validationData = onDraftValidation ? snapshotValidationData({ data }) : undefined
    const validateDraft = async () => {
      if (validationData) {
        validationData.get(data)!._status = 'published'
      }
      await Promise.all(draftValidationActions.map((validate) => validate(validationData)))
      throwValidationErrors()
    }

    if (onDraftValidation) {
      onDraftValidation(validateDraft)
    } else if (data._status === 'published') {
      await validateDraft()
    }
  }

  throwValidationErrors()

  onDataProcessed?.(data)

  for (const action of mergeLocaleActions) {
    await action()
  }

  return data
}

/** Preserve final hook values and their object identities before locale storage merging. */
function snapshotValidationData({ data }: { data: JsonObject }): WeakMap<object, JsonObject> {
  const snapshots = new WeakMap<object, JsonObject>()
  const snapshot = deepCopyObjectSimple(data)

  const remember = (original: unknown, copy: unknown) => {
    if (original && typeof original === 'object' && copy && typeof copy === 'object') {
      snapshots.set(original, copy as JsonObject)
      for (const key of Object.keys(original)) {
        remember((original as JsonObject)[key], (copy as JsonObject)[key])
      }
    }
  }

  remember(data, snapshot)
  return snapshots
}
