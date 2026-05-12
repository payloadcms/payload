import type { SanitizedConfig } from '../../../config/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { ConfigEntityState, ConfigSnapshot } from './types.js'

function collectFieldPaths(fields: Field[], prefix = ''): Record<string, { localized: boolean }> {
  const result: Record<string, { localized: boolean }> = {}

  for (const field of fields) {
    if (!('name' in field)) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if ('fields' in tab) {
            Object.assign(result, collectFieldPaths(tab.fields, prefix))
          }
        }
      } else if (field.type === 'row' || field.type === 'collapsible') {
        Object.assign(result, collectFieldPaths((field as any).fields, prefix))
      }
      continue
    }

    const path = prefix ? `${prefix}.${field.name}` : field.name
    result[path] = { localized: Boolean((field as any).localized) }

    if ((field.type === 'group' || field.type === 'array') && 'fields' in field) {
      Object.assign(result, collectFieldPaths((field as any).fields, path))
    }
    if (field.type === 'blocks' && 'blocks' in field) {
      for (const block of (field as any).blocks) {
        Object.assign(result, collectFieldPaths(block.fields, `${path}[]`))
      }
    }
  }

  return result
}

function serializeEntityState(entity: { fields: Field[]; versions?: any }): ConfigEntityState {
  const versions = entity.versions
  const hasDrafts = Boolean(versions && typeof versions === 'object' && versions.drafts)
  const hasAutosave =
    hasDrafts && typeof versions.drafts === 'object' && Boolean(versions.drafts.autosave)

  return {
    autosave: Boolean(hasAutosave),
    drafts: hasDrafts,
    fields: collectFieldPaths(entity.fields ?? []),
    localizeStatus: Boolean(versions?.localizeStatus),
    versions: Boolean(versions),
  }
}

export function serializeConfig(
  config: Pick<SanitizedConfig, 'collections' | 'globals' | 'localization'>,
): ConfigSnapshot {
  const collections: ConfigSnapshot['collections'] = {}
  for (const collection of config.collections ?? []) {
    collections[collection.slug] = serializeEntityState(collection)
  }

  const globals: ConfigSnapshot['globals'] = {}
  for (const global of config.globals ?? []) {
    globals[global.slug] = serializeEntityState(global as any)
  }

  const localization = config.localization || null

  const locales = localization?.locales?.map((l: any) => (typeof l === 'string' ? l : l.code)) ?? []

  return {
    collections,
    globals,
    localization: {
      defaultLocale: localization?.defaultLocale ?? '',
      locales,
    },
    version: 1,
  }
}
