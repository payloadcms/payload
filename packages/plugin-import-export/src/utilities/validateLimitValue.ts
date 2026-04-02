import type { TFunction } from '@payloadcms/translations'

export const validateLimitValue = (
  value: null | number | undefined,
  t: TFunction,
): string | undefined => {
  if (value && value < 0) {
    return t('validation:lessThanMin', { label: t('general:value'), min: 0, value })
  }

  return undefined
}
