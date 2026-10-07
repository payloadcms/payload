import type {
  ClientBlock,
  ClientField,
  Data,
  ValidationFieldError,
  ValidationResult,
} from 'payload'

import {
  deepCopyObjectSimple,
  fieldAffectsData,
  fieldShouldBeLocalized,
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

function projectValidationDataForSiblingLocales({
  blocksMap,
  data,
  fields,
}: {
  blocksMap: Record<string, ClientBlock>
  data: Data
  fields: ClientField[]
}): Data {
  const projectedData = deepCopyObjectSimple(data)
  const status = projectedData._status

  removeLocalizedFieldValues({
    blocksMap,
    data: projectedData,
    fields,
    parentIsLocalized: false,
  })

  if (status !== undefined) {
    projectedData._status = status
  }

  return projectedData
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

async function requestDocumentValidation({
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

function removeLocalizedFieldValues({
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
                removeLocalizedFieldValues({
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
                removeLocalizedFieldValues({
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
            removeLocalizedFieldValues({
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

          removeLocalizedFieldValues({
            blocksMap,
            data,
            fields: field.fields,
            parentIsLocalized: isLocalized,
          })
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            const isLocalized =
              parentIsLocalized || fieldShouldBeLocalized({ field: tab, parentIsLocalized })

            if (tabHasName(tab)) {
              if (isLocalized) {
                delete data[tab.name]
              } else if (isObject(data[tab.name])) {
                removeLocalizedFieldValues({
                  blocksMap,
                  data: data[tab.name],
                  fields: tab.fields,
                  parentIsLocalized: false,
                })
              }
            } else {
              removeLocalizedFieldValues({
                blocksMap,
                data,
                fields: tab.fields,
                parentIsLocalized: isLocalized,
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
