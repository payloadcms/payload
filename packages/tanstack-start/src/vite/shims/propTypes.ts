type PropTypeValidator = ((...args: unknown[]) => PropTypeValidator) & {
  isRequired: PropTypeValidator
}

const validatorCache = new Map<string | symbol, PropTypeValidator>()

const getValidator = (key: string | symbol): PropTypeValidator => {
  const cached = validatorCache.get(key)

  if (cached) {
    return cached
  }

  const validator = ((..._args: unknown[]) => validator) as PropTypeValidator
  validator.isRequired = validator

  validatorCache.set(key, validator)

  return validator
}

const noop = () => {}

const PropTypes = new Proxy(
  {},
  {
    get(_target, key: string | symbol) {
      if (key === 'checkPropTypes' || key === 'resetWarningCache') {
        return noop
      }

      return getValidator(key)
    },
  },
) as {
  checkPropTypes: typeof noop
  resetWarningCache: typeof noop
} & Record<string, PropTypeValidator>

export const checkPropTypes = noop
export default PropTypes
export const resetWarningCache = noop
