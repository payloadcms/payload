import type {
  ClientBlock,
  ClientField,
  Data,
  ValidationFieldError,
  ValidationResult,
} from 'payload'

import {
  fieldAffectsData,
  fieldShouldBeLocalized,
  formatAdminURL,
  tabHasName,
} from 'payload/shared'
import * as qs from 'qs-esm'

import { requests } from '../../utilities/api.js'

type DocumentValidationRequestArgs = {
  body: Data
  endpoint: string
  locales: string[]
  signal?: AbortSignal
}

type ValidationTarget = {
  apiRoute: string
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
}

export function getValidationEndpoint({
  id,
  apiRoute,
  collectionSlug,
  globalSlug,
}: ValidationTarget): string {
  if (!collectionSlug && !globalSlug) {
    throw new Error('Document validation requires a collection or global slug.')
  }

  const encodedID = id === undefined ? '' : `/${encodeURIComponent(String(id))}`
  const path: `/${string}` = globalSlug
    ? `/globals/${encodeURIComponent(globalSlug)}/validate`
    : `/${encodeURIComponent(collectionSlug)}${encodedID}/validate`

  return formatAdminURL({
    apiRoute,
    path,
  })
}

export function projectValidationDataForSiblingLocales({
  blocksMap,
  data,
  fields,
}: {
  blocksMap: Record<string, ClientBlock>
  data: Data
  fields: ClientField[]
}): Data {
  const projectedData = cloneValidationData(data)

  processLocalizedFields({
    blocksMap,
    data: projectedData,
    fields,
    parentIsLocalized: false,
    visitedBlockSlugs: new Set(),
  })

  return projectedData
}

export function hasLocalizedFields({
  blocksMap,
  fields,
}: {
  blocksMap: Record<string, ClientBlock>
  fields: ClientField[]
}): boolean {
  return processLocalizedFields({
    blocksMap,
    fields,
    parentIsLocalized: false,
    visitedBlockSlugs: new Set(),
  })
}

export async function validateDocumentLocales({
  activeLocale,
  blocksMap,
  data,
  endpoint,
  fields,
  locales,
  signal,
}: {
  activeLocale: string
  blocksMap: Record<string, ClientBlock>
  data: Data
  endpoint: string
  fields: ClientField[]
  locales: string[]
  signal?: AbortSignal
}): Promise<ValidationResult> {
  const selectedLocales = locales.filter((locale, index) => locales.indexOf(locale) === index)
  const validationResults: ValidationResult[] = []

  if (selectedLocales.length === 0) {
    throw new Error('Document validation requires at least one locale.')
  }

  if (selectedLocales.includes(activeLocale)) {
    validationResults.push(
      await requestDocumentValidation({
        body: data,
        endpoint,
        locales: [activeLocale],
        signal,
      }),
    )
  }

  const siblingLocales = selectedLocales.filter((locale) => locale !== activeLocale)

  if (siblingLocales.length > 0) {
    validationResults.push(
      await requestDocumentValidation({
        body: projectValidationDataForSiblingLocales({
          blocksMap,
          data,
          fields,
        }),
        endpoint,
        locales: siblingLocales,
        signal,
      }),
    )
  }

  const errors = validationResults.flatMap(({ errors }) => errors)

  return {
    errors,
    valid: validationResults.every(({ valid }) => valid),
  }
}

export async function requestDocumentValidation({
  body,
  endpoint,
  locales,
  signal,
}: DocumentValidationRequestArgs): Promise<ValidationResult> {
  const query = qs.stringify(
    { locale: locales },
    {
      addQueryPrefix: true,
      arrayFormat: 'repeat',
    },
  )
  const response = await requests.post(`${endpoint}${query}`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  })
  const responseData = (await response.json()) as unknown

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(responseData) || response.statusText)
  }

  const result = parseValidationResult(responseData)

  if (result) {
    return result
  }

  throw new Error(getResponseErrorMessage(responseData) || response.statusText)
}

function parseValidationResult(responseData: unknown): null | ValidationResult {
  if (!isObject(responseData)) {
    return null
  }

  if (typeof responseData.valid === 'boolean' && Array.isArray(responseData.errors)) {
    return {
      errors: responseData.errors.filter(isValidationFieldError),
      valid: responseData.valid,
    }
  }

  if (Array.isArray(responseData.errors)) {
    const errors = responseData.errors.flatMap((error) => {
      if (!isObject(error) || !isObject(error.data) || !Array.isArray(error.data.errors)) {
        return []
      }

      return error.data.errors.filter(isValidationFieldError)
    })

    if (errors.length > 0) {
      return {
        errors,
        valid: false,
      }
    }
  }

  return null
}

function getResponseErrorMessage(responseData: unknown): null | string {
  if (!isObject(responseData)) {
    return null
  }

  if (typeof responseData.message === 'string') {
    return responseData.message
  }

  if (Array.isArray(responseData.errors)) {
    const errorWithMessage = responseData.errors.find(
      (error) => isObject(error) && typeof error.message === 'string',
    )

    if (isObject(errorWithMessage) && typeof errorWithMessage.message === 'string') {
      return errorWithMessage.message
    }
  }

  return null
}

function isValidationFieldError(value: unknown): value is ValidationFieldError {
  return (
    isObject(value) &&
    typeof value.message === 'string' &&
    typeof value.path === 'string' &&
    (value.locale === undefined || typeof value.locale === 'string')
  )
}

function cloneValidationData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(cloneValidationData) as T
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, cloneValidationData(childValue)]),
    ) as T
  }

  return value
}

function processLocalizedFields({
  blocksMap,
  data,
  fields,
  parentIsLocalized,
  visitedBlockSlugs,
}: {
  blocksMap: Record<string, ClientBlock>
  data?: Data
  fields: ClientField[]
  parentIsLocalized: boolean
  visitedBlockSlugs: Set<string>
}): boolean {
  let hasLocalizedField = false

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })) {
        hasLocalizedField = true

        if (data) {
          delete data[field.name]
        }

        continue
      }

      const fieldValue = data?.[field.name]

      switch (field.type) {
        case 'array': {
          if (data === undefined) {
            hasLocalizedField =
              processLocalizedFields({
                blocksMap,
                fields: field.fields,
                parentIsLocalized: false,
                visitedBlockSlugs,
              }) || hasLocalizedField
          } else if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (isObject(row)) {
                hasLocalizedField =
                  processLocalizedFields({
                    blocksMap,
                    data: row,
                    fields: field.fields,
                    parentIsLocalized: false,
                    visitedBlockSlugs,
                  }) || hasLocalizedField
              }
            }
          }
          break
        }

        case 'blocks': {
          if (data === undefined) {
            for (const blockOrSlug of field.blocks) {
              if (typeof blockOrSlug === 'string' && visitedBlockSlugs.has(blockOrSlug)) {
                continue
              }

              const block = typeof blockOrSlug === 'string' ? blocksMap[blockOrSlug] : blockOrSlug

              if (typeof blockOrSlug === 'string') {
                visitedBlockSlugs.add(blockOrSlug)
              }

              if (block) {
                hasLocalizedField =
                  processLocalizedFields({
                    blocksMap,
                    fields: block.fields,
                    parentIsLocalized: false,
                    visitedBlockSlugs,
                  }) || hasLocalizedField
              }
            }
          } else if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (!isObject(row) || typeof row.blockType !== 'string') {
                continue
              }

              const blockOrSlug = field.blocks.find((block) => {
                return (typeof block === 'string' ? block : block.slug) === row.blockType
              })
              const block = typeof blockOrSlug === 'string' ? blocksMap[blockOrSlug] : blockOrSlug

              if (block) {
                hasLocalizedField =
                  processLocalizedFields({
                    blocksMap,
                    data: row,
                    fields: block.fields,
                    parentIsLocalized: false,
                    visitedBlockSlugs,
                  }) || hasLocalizedField
              }
            }
          }
          break
        }

        case 'group': {
          if (data === undefined || isObject(fieldValue)) {
            hasLocalizedField =
              processLocalizedFields({
                blocksMap,
                data: isObject(fieldValue) ? fieldValue : undefined,
                fields: field.fields,
                parentIsLocalized: false,
                visitedBlockSlugs,
              }) || hasLocalizedField
          }
          break
        }
      }
    } else {
      switch (field.type) {
        case 'collapsible':
        case 'group':
        case 'row': {
          const isLocalized =
            parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })

          hasLocalizedField = isLocalized || hasLocalizedField
          hasLocalizedField =
            processLocalizedFields({
              blocksMap,
              data,
              fields: field.fields,
              parentIsLocalized: isLocalized,
              visitedBlockSlugs,
            }) || hasLocalizedField
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            const isLocalized =
              parentIsLocalized || fieldShouldBeLocalized({ field: tab, parentIsLocalized })

            hasLocalizedField = isLocalized || hasLocalizedField

            if (tabHasName(tab)) {
              if (isLocalized) {
                if (data) {
                  delete data[tab.name]
                }
              } else if (data === undefined || isObject(data[tab.name])) {
                hasLocalizedField =
                  processLocalizedFields({
                    blocksMap,
                    data: data && isObject(data[tab.name]) ? data[tab.name] : undefined,
                    fields: tab.fields,
                    parentIsLocalized: false,
                    visitedBlockSlugs,
                  }) || hasLocalizedField
              }
            } else {
              hasLocalizedField =
                processLocalizedFields({
                  blocksMap,
                  data,
                  fields: tab.fields,
                  parentIsLocalized: isLocalized,
                  visitedBlockSlugs,
                }) || hasLocalizedField
            }
          }
          break
        }
      }
    }
  }

  return hasLocalizedField
}

function isObject(value: unknown): value is Data {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
