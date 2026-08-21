import type { Auth } from './types.js'

type LocalStrategyConfig = Auth['localStrategy']

export const isLocalStrategyEnabled = (localStrategy: LocalStrategyConfig): boolean => {
  if (localStrategy === undefined || localStrategy === true) {
    return true
  }
  if (localStrategy === false) {
    return false
  }
  return localStrategy.enabled
}

export const shouldIncludeAuthFields = (localStrategy: LocalStrategyConfig): boolean => {
  if (typeof localStrategy === 'object' && localStrategy !== null) {
    if (localStrategy.disableFields === true) {
      return false
    }
    if (localStrategy.disableFields === false) {
      return true
    }
    return localStrategy.enabled
  }
  return isLocalStrategyEnabled(localStrategy)
}

export const hasOptionalPassword = (localStrategy: LocalStrategyConfig): boolean => {
  if (typeof localStrategy === 'object' && localStrategy !== null) {
    return localStrategy.optionalPassword === true
  }
  return false
}
