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

export type DocumentValidationRequest = (args: {
  body: Data
  endpoint: string
  locales: string[]
  signal?: AbortSignal
}) => Promise<ValidationResult>

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

  removeLocalizedData({
    blocksMap,
    data: projectedData,
    fields,
    parentIsLocalized: false,
  })

  return projectedData
}

export async function validateDocumentLocales({
  activeLocale,
  blocksMap,
  data,
  endpoint,
  fields,
  locales,
  request = requestDocumentValidation,
  signal,
}: {
  activeLocale: string
  blocksMap: Record<string, ClientBlock>
  data: Data
  endpoint: string
  fields: ClientField[]
  locales: string[]
  request?: DocumentValidationRequest
  signal?: AbortSignal
}): Promise<ValidationResult> {
  const selectedLocales = locales.filter((locale, index) => locales.indexOf(locale) === index)
  const validationResults: ValidationResult[] = []

  if (selectedLocales.includes(activeLocale)) {
    validationResults.push(
      await request({
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
      await request({
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
}: Parameters<DocumentValidationRequest>[0]): Promise<ValidationResult> {
  const search = new URLSearchParams()

  for (const locale of locales) {
    search.append('locale', locale)
  }

  const response = await fetch(`${endpoint}?${search.toString()}`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  })
  const responseData = (await response.json()) as unknown
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

function removeLocalizedData({
  blocksMap,
  data,
  fields,
  parentIsLocalized,
}: {
  blocksMap: Record<string, ClientBlock>
  data: Data
  fields: ClientField[]
  parentIsLocalized: boolean
}): void {
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })) {
        delete data[field.name]
        continue
      }

      const fieldValue = data[field.name]

      switch (field.type) {
        case 'array': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (isObject(row)) {
                removeLocalizedData({
                  blocksMap,
                  data: row,
                  fields: field.fields,
                  parentIsLocalized: false,
                })
              }
            }
          }
          break
        }

        case 'blocks': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (!isObject(row) || typeof row.blockType !== 'string') {
                continue
              }

              const blockOrSlug = field.blocks.find((block) => {
                return (typeof block === 'string' ? block : block.slug) === row.blockType
              })
              const block = typeof blockOrSlug === 'string' ? blocksMap[blockOrSlug] : blockOrSlug

              if (block) {
                removeLocalizedData({
                  blocksMap,
                  data: row,
                  fields: block.fields,
                  parentIsLocalized: false,
                })
              }
            }
          }
          break
        }

        case 'group': {
          if (isObject(fieldValue)) {
            removeLocalizedData({
              blocksMap,
              data: fieldValue,
              fields: field.fields,
              parentIsLocalized: false,
            })
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

          removeLocalizedData({
            blocksMap,
            data,
            fields: field.fields,
            parentIsLocalized: isLocalized,
          })
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            if (tabHasName(tab)) {
              if (parentIsLocalized || fieldShouldBeLocalized({ field: tab, parentIsLocalized })) {
                delete data[tab.name]
              } else if (isObject(data[tab.name])) {
                removeLocalizedData({
                  blocksMap,
                  data: data[tab.name],
                  fields: tab.fields,
                  parentIsLocalized: false,
                })
              }
            } else {
              removeLocalizedData({
                blocksMap,
                data,
                fields: tab.fields,
                parentIsLocalized,
              })
            }
          }
          break
        }
      }
    }
  }
}

function isObject(value: unknown): value is Data {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
