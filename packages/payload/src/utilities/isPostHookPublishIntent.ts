type Args = {
  locale?: null | string
  publishAllLocales: boolean
  status: unknown
  unpublishAllLocales?: boolean
}

export function isPostHookPublishIntent({
  locale,
  publishAllLocales,
  status,
  unpublishAllLocales,
}: Args): boolean {
  if (unpublishAllLocales) {
    return false
  }

  if (publishAllLocales || status === 'published') {
    return true
  }

  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return false
  }

  const localizedStatus = status as Record<string, unknown>

  if (locale === 'all') {
    return Object.values(localizedStatus).some((localeStatus) => localeStatus === 'published')
  }

  if (!locale) {
    return false
  }

  return localizedStatus[locale] === 'published'
}
