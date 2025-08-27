import type { TFunction } from '@payloadcms/translations'

export const validateLimitValue = (
  value: null | number | undefined,
  t: TFunction,
  step = 100,
): string | undefined => {
  if (value && value < 0) {
    return t('validation:lessThanMin', { label: t('general:value'), min: 0, value })
  }

  if (value && value % step !== 0) {
    return `Limit must be a multiple of ${step}`
  }

  return undefined
}
