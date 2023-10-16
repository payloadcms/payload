import type { RichTextAdapter } from '../exports/types'
import type {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  DateField,
  EmailField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RelationshipValue,
  RichTextField,
  SelectField,
  TextField,
  TextareaField,
  UploadField,
  Validate,
} from './config/types'

import canUseDOM from '../utilities/canUseDOM'
import { getIDType } from '../utilities/getIDType'
import { isValidID } from '../utilities/isValidID'
import { fieldAffectsData } from './config/types'

export const number: Validate<unknown, unknown, NumberField> = (
  value: number | number[],
  { hasMany, max, maxRows, min, minRows, required, t },
) => {
  const toValidate: number[] = Array.isArray(value) ? value : [value]

  // eslint-disable-next-line no-restricted-syntax
  for (const valueToValidate of toValidate) {
    const floatValue = parseFloat(valueToValidate as unknown as string)
    if (
      (value && typeof floatValue !== 'number') ||
      (required && Number.isNaN(floatValue)) ||
      (value && Number.isNaN(floatValue))
    ) {
      return t('validation:enterNumber')
    }

    if (typeof max === 'number' && floatValue > max) {
      return t('validation:greaterThanMax', { label: t('value'), max, value })
    }

    if (typeof min === 'number' && floatValue < min) {
      return t('validation:lessThanMin', { label: t('value'), min, value })
    }

    if (required && typeof floatValue !== 'number') {
      return t('validation:required')
    }
  }

  if (required && toValidate.length === 0) {
    return t('validation:required')
  }

  if (hasMany === true) {
    if (minRows && toValidate.length < minRows) {
      return t('validation:lessThanMin', {
        label: t('rows'),
        min: minRows,
        value: toValidate.length,
      })
    }

    if (maxRows && toValidate.length > maxRows) {
      return t('validation:greaterThanMax', {
        label: t('rows'),
        max: maxRows,
        value: toValidate.length,
      })
    }
  }

  return true
}

export const text: Validate<unknown, unknown, TextField> = (
  value: string,
  { config, maxLength: fieldMaxLength, minLength, payload, required, t },
) => {
  let maxLength: number

  if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength
  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength })
  }

  if (value && minLength && value?.length < minLength) {
    return t('validation:longerThanMin', { minLength })
  }

  if (required) {
    if (typeof value !== 'string' || value?.length === 0) {
      return t('validation:required')
    }
  }

  return true
}

export const password: Validate<unknown, unknown, TextField> = (
  value: string,
  { config, maxLength: fieldMaxLength, minLength, payload, required, t },
) => {
  let maxLength: number

  if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength

  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength })
  }

  if (value && minLength && value.length < minLength) {
    return t('validation:longerThanMin', { minLength })
  }

  if (required && !value) {
    return t('validation:required')
  }

  return true
}

export const email: Validate<unknown, unknown, EmailField> = (value: string, { required, t }) => {
  if ((value && !/\S[^\s@]*@\S+\.\S+/.test(value)) || (!value && required)) {
    return t('validation:emailAddress')
  }

  return true
}

export const textarea: Validate<unknown, unknown, TextareaField> = (
  value: string,
  { config, maxLength: fieldMaxLength, minLength, payload, required, t },
) => {
  let maxLength: number

  if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength
  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength })
  }

  if (value && minLength && value.length < minLength) {
    return t('validation:longerThanMin', { minLength })
  }

  if (required && !value) {
    return t('validation:required')
  }

  return true
}

export const code: Validate<unknown, unknown, CodeField> = (value: string, { required, t }) => {
  if (required && value === undefined) {
    return t('validation:required')
  }

  return true
}

export const json: Validate<unknown, unknown, JSONField & { jsonError?: string }> = (
  value: string,
  { jsonError, required, t },
) => {
  if (required && !value) {
    return t('validation:required')
  }

  if (jsonError !== undefined) {
    return t('validation:invalidInput')
  }

  return true
}

export const checkbox: Validate<unknown, unknown, CheckboxField> = (
  value: boolean,
  { required, t },
) => {
  if ((value && typeof value !== 'boolean') || (required && typeof value !== 'boolean')) {
    return t('validation:trueOrFalse')
  }

  return true
}

export const date: Validate<unknown, unknown, DateField> = (value, { required, t }) => {
  if (value && !isNaN(Date.parse(value.toString()))) {
    /* eslint-disable-line */
    return true
  }

  if (value) {
    return t('validation:notValidDate', { value })
  }

  if (required) {
    return t('validation:required')
  }

  return true
}

export const richText: Validate<object, unknown, RichTextField, RichTextField> = async (
  value,
  options,
) => {
  const editor: RichTextAdapter = options?.editor

  return await editor.validate(value, options)
}

const validateFilterOptions: Validate = async (
  value,
  { id, data, filterOptions, payload, relationTo, siblingData, t, user },
) => {
  if (!canUseDOM && typeof filterOptions !== 'undefined' && value) {
    const options: {
      [collection: string]: (number | string)[]
    } = {}

    const collections = typeof relationTo === 'string' ? [relationTo] : relationTo
    const values = Array.isArray(value) ? value : [value]

    await Promise.all(
      collections.map(async (collection) => {
        const optionFilter =
          typeof filterOptions === 'function'
            ? await filterOptions({
                id,
                data,
                relationTo: collection,
                siblingData,
                user,
              })
            : filterOptions

        const valueIDs: (number | string)[] = []

        values.forEach((val) => {
          if (typeof val === 'object' && val?.value) {
            valueIDs.push(val.value)
          }

          if (typeof val === 'string' || typeof val === 'number') {
            valueIDs.push(val)
          }
        })

        if (valueIDs.length > 0) {
          const findWhere = {
            and: [{ id: { in: valueIDs } }],
          }

          if (optionFilter) findWhere.and.push(optionFilter)

          const result = await payload.find({
            collection,
            depth: 0,
            limit: 0,
            pagination: false,
            where: findWhere,
          })

          options[collection] = result.docs.map((doc) => doc.id)
        } else {
          options[collection] = []
        }
      }),
    )

    const invalidRelationships = values.filter((val) => {
      let collection: string
      let requestedID: number | string

      if (typeof relationTo === 'string') {
        collection = relationTo

        if (typeof val === 'string' || typeof val === 'number') {
          requestedID = val
        }
      }

      if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
        collection = val.relationTo
        requestedID = val.value
      }

      return options[collection].indexOf(requestedID) === -1
    })

    if (invalidRelationships.length > 0) {
      return invalidRelationships.reduce((err, invalid, i) => {
        return `${err} ${JSON.stringify(invalid)}${
          invalidRelationships.length === i + 1 ? ',' : ''
        } `
      }, t('validation:invalidSelections')) as string
    }

    return true
  }

  return true
}

export const upload: Validate<unknown, unknown, UploadField> = (value: string, options) => {
  if (!value && options.required) {
    return options.t('validation:required')
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const idField = options?.config?.collections
      ?.find((collection) => collection.slug === options.relationTo)
      ?.fields?.find((field) => fieldAffectsData(field) && field.name === 'id')

    const type = getIDType(idField, options?.payload?.db?.defaultIDType)

    if (!isValidID(value, type)) {
      return options.t('validation:validUploadID')
    }
  }

  return validateFilterOptions(value, options)
}

export const relationship: Validate<unknown, unknown, RelationshipField> = async (
  value: RelationshipValue,
  options,
) => {
  const { config, maxRows, minRows, payload, relationTo, required, t } = options

  if ((!value || (Array.isArray(value) && value.length === 0)) && required) {
    return t('validation:required')
  }

  if (Array.isArray(value)) {
    if (minRows && value.length < minRows) {
      return t('validation:lessThanMin', { label: t('rows'), min: minRows, value: value.length })
    }

    if (maxRows && value.length > maxRows) {
      return t('validation:greaterThanMax', { label: t('rows'), max: maxRows, value: value.length })
    }
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const values = Array.isArray(value) ? value : [value]

    const invalidRelationships = values.filter((val) => {
      let collectionSlug: string
      let requestedID

      if (typeof relationTo === 'string') {
        collectionSlug = relationTo

        // custom id
        if (val) {
          requestedID = val
        }
      }

      if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
        collectionSlug = val.relationTo
        requestedID = val.value
      }

      if (requestedID === null) return false

      const idField = config?.collections
        ?.find((collection) => collection.slug === collectionSlug)
        ?.fields?.find((field) => fieldAffectsData(field) && field.name === 'id')

      const type = getIDType(idField, payload?.db?.defaultIDType)

      return !isValidID(requestedID, type)
    })

    if (invalidRelationships.length > 0) {
      return `This relationship field has the following invalid relationships: ${invalidRelationships
        .map((err, invalid) => {
          return `${err} ${JSON.stringify(invalid)}`
        })
        .join(', ')}`
    }
  }

  return validateFilterOptions(value, options)
}

export const array: Validate<unknown, unknown, ArrayField> = (
  value,
  { maxRows, minRows, required, t },
) => {
  const arrayLength = Array.isArray(value) ? value.length : 0

  if (minRows && arrayLength < minRows) {
    return t('validation:requiresAtLeast', { count: minRows, label: t('rows') })
  }

  if (maxRows && arrayLength > maxRows) {
    return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') })
  }

  if (!arrayLength && required) {
    return t('validation:requiresAtLeast', { count: 1, label: t('row') })
  }

  return true
}

export const select: Validate<unknown, unknown, SelectField> = (
  value,
  { hasMany, options, required, t },
) => {
  if (
    Array.isArray(value) &&
    value.some(
      (input) =>
        !options.some(
          (option) => option === input || (typeof option !== 'string' && option?.value === input),
        ),
    )
  ) {
    return t('validation:invalidSelection')
  }

  if (
    typeof value === 'string' &&
    !options.some(
      (option) => option === value || (typeof option !== 'string' && option.value === value),
    )
  ) {
    return t('validation:invalidSelection')
  }

  if (
    required &&
    (typeof value === 'undefined' ||
      value === null ||
      (hasMany && Array.isArray(value) && (value as [])?.length === 0))
  ) {
    return t('validation:required')
  }

  return true
}

export const radio: Validate<unknown, unknown, RadioField> = (value, { options, required, t }) => {
  if (value) {
    const valueMatchesOption = options.some(
      (option) => option === value || (typeof option !== 'string' && option.value === value),
    )
    return valueMatchesOption || t('validation:invalidSelection')
  }

  return required ? t('validation:required') : true
}

export const blocks: Validate<unknown, unknown, BlockField> = (
  value,
  { maxRows, minRows, required, t },
) => {
  const arrayLength = Array.isArray(value) ? value.length : 0

  if (minRows && arrayLength < minRows) {
    return t('validation:requiresAtLeast', { count: minRows, label: t('rows') })
  }

  if (maxRows && arrayLength > maxRows) {
    return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') })
  }

  if (!arrayLength && required) {
    return t('validation:requiresAtLeast', { count: 1, label: t('row') })
  }

  return true
}

export const point: Validate<unknown, unknown, PointField> = (
  value: [number | string, number | string] = ['', ''],
  { required, t },
) => {
  const lng = parseFloat(String(value[0]))
  const lat = parseFloat(String(value[1]))
  if (
    required &&
    ((value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number') ||
      Number.isNaN(lng) ||
      Number.isNaN(lat) ||
      (Array.isArray(value) && value.length !== 2))
  ) {
    return t('validation:requiresTwoNumbers')
  }

  if ((value[1] && Number.isNaN(lng)) || (value[0] && Number.isNaN(lat))) {
    return t('validation:invalidInput')
  }

  return true
}

export default {
  array,
  blocks,
  checkbox,
  code,
  date,
  email,
  json,
  number,
  password,
  point,
  radio,
  relationship,
  richText,
  select,
  text,
  textarea,
  upload,
}
