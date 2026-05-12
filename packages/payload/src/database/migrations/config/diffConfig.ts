import type { ConfigChange, ConfigEntityState, ConfigSnapshot } from './types.js'

function diffEntityState(
  slug: string,
  entity: 'collection' | 'global',
  prev: ConfigEntityState,
  next: ConfigEntityState,
): ConfigChange[] {
  const changes: ConfigChange[] = []

  if (!prev.versions && next.versions) {
    changes.push({ slug, type: 'versions_enabled', entity })
  }
  if (prev.versions && !next.versions) {
    changes.push({ slug, type: 'versions_disabled', entity })
  }
  if (!prev.drafts && next.drafts) {
    changes.push({ slug, type: 'drafts_enabled', entity, initialStatus: 'draft' })
  }
  if (prev.drafts && !next.drafts) {
    changes.push({ slug, type: 'drafts_disabled', entity })
  }
  if (!prev.autosave && next.autosave) {
    changes.push({ slug, type: 'autosave_enabled', entity })
  }
  if (!prev.localizeStatus && next.localizeStatus) {
    changes.push({ slug, type: 'localize_status_enabled', entity })
  }

  const allPaths = new Set([...Object.keys(next.fields), ...Object.keys(prev.fields)])
  for (const fieldPath of allPaths) {
    const prevLocalized = prev.fields[fieldPath]?.localized ?? false
    const nextLocalized = next.fields[fieldPath]?.localized ?? false
    if (!prevLocalized && nextLocalized) {
      changes.push({ slug, type: 'field_localized', entity, fieldPath })
    }
    if (prevLocalized && !nextLocalized) {
      changes.push({ slug, type: 'field_delocalized', entity, fieldPath })
    }
  }

  return changes
}

const emptyEntityState: ConfigEntityState = {
  autosave: false,
  drafts: false,
  fields: {},
  localizeStatus: false,
  versions: false,
}

export function diffConfig(prev: ConfigSnapshot, next: ConfigSnapshot): ConfigChange[] {
  const changes: ConfigChange[] = []

  const allCollectionSlugs = new Set([
    ...Object.keys(next.collections),
    ...Object.keys(prev.collections),
  ])
  for (const slug of allCollectionSlugs) {
    changes.push(
      ...diffEntityState(
        slug,
        'collection',
        prev.collections[slug] ?? emptyEntityState,
        next.collections[slug] ?? emptyEntityState,
      ),
    )
  }

  const allGlobalSlugs = new Set([...Object.keys(next.globals), ...Object.keys(prev.globals)])
  for (const slug of allGlobalSlugs) {
    changes.push(
      ...diffEntityState(
        slug,
        'global',
        prev.globals[slug] ?? emptyEntityState,
        next.globals[slug] ?? emptyEntityState,
      ),
    )
  }

  const prevLocales = new Set(prev.localization.locales)
  const nextLocales = new Set(next.localization.locales)
  for (const locale of nextLocales) {
    if (!prevLocales.has(locale)) {
      changes.push({ type: 'locale_added', locale })
    }
  }
  for (const locale of prevLocales) {
    if (!nextLocales.has(locale)) {
      changes.push({ type: 'locale_removed', locale })
    }
  }
  if (
    prev.localization.defaultLocale !== next.localization.defaultLocale &&
    next.localization.defaultLocale
  ) {
    changes.push({
      type: 'default_locale_changed',
      from: prev.localization.defaultLocale,
      to: next.localization.defaultLocale,
    })
  }

  return changes
}
