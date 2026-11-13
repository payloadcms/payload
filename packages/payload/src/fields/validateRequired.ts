import type { Field, Validate } from './config/types.js'

/** Checks presence independently of custom field validation. Editors define rich text emptiness. */
export const validateRequired: Validate<unknown, unknown, unknown, Field> = (value, options) => {
  if (!options.required) {
    return true
  }

  const {
    req: { t },
  } = options

  const isEmpty =
    value === undefined ||
    value === null ||
    (value === '' &&
      (options.type !== 'select' ||
        !options.options.some(
          (option) => option === '' || (typeof option !== 'string' && option.value === ''),
        ))) ||
    ((options.type === 'array' || options.type === 'blocks') && !value) ||
    (options.type !== 'json' &&
      options.type !== 'point' &&
      Array.isArray(value) &&
      value.length === 0)

  if (isEmpty) {
    return t('validation:required')
  }

  if (options.type === 'richText' && options.editor && typeof options.editor !== 'function') {
    if (options.editor.isEmpty) {
      return options.editor.isEmpty({ value: value as null | object | undefined })
        ? t('validation:required')
        : true
    }

    // Third-party editors without an emptiness predicate retain their own required validation.
    return options.editor.validate(value as null | object | undefined, options)
  }

  if (options.type === 'point' && Array.isArray(value)) {
    if (value.length !== 2 || value.some((coordinate) => coordinate === '' || coordinate == null)) {
      return t('validation:requiresTwoNumbers')
    }
  }

  return true
}
