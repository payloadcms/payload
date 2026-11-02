/**
 * Draft saves never publish all locales. Otherwise, saves publish all locales unless localize
 * status is enabled for one specific locale or the caller explicitly disables it. Shared by
 * create, and the collection and global update operations, so the formula has one owner instead
 * of three copies that can drift apart.
 */
export function resolvePublishAllLocales({
  draft,
  hasLocalizeStatusEnabled,
  locale,
  publishAllLocalesArg,
}: {
  draft: boolean | undefined
  hasLocalizeStatusEnabled: boolean
  locale?: null | string
  publishAllLocalesArg: boolean | undefined
}): boolean {
  return !draft && (publishAllLocalesArg ?? !(hasLocalizeStatusEnabled && locale !== 'all'))
}
