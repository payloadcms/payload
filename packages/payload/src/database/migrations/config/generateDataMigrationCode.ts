import type { ConfigChange } from './types.js'

type GenerateOptions = {
  defaultLocale?: string
}

type GenerateResult = {
  downCode: string
  upCode: string
}

export function generateDataMigrationCode(
  changes: ConfigChange[],
  options: GenerateOptions = {},
): GenerateResult {
  const upLines: string[] = []
  const downLines: string[] = []

  for (const change of changes) {
    switch (change.type) {
      case 'drafts_enabled':
        upLines.push(
          `  if (payload.db.migrateVersionsEnabled) await payload.db.migrateVersionsEnabled({ slug: '${change.slug}', entity: '${change.entity}', initialStatus: '${change.initialStatus ?? 'draft'}', req })`,
        )
        downLines.push(
          `  if (payload.db.migrateVersionsDisabled) await payload.db.migrateVersionsDisabled({ slug: '${change.slug}', entity: '${change.entity}', req })`,
        )
        break

      case 'field_delocalized':
        upLines.push(
          `  if (payload.db.migrateFieldDelocalized) await payload.db.migrateFieldDelocalized({ slug: '${change.slug}', entity: '${change.entity}', fieldPath: '${change.fieldPath}', defaultLocale: '${options.defaultLocale ?? ''}', req })`,
        )
        downLines.push(
          `  if (payload.db.migrateFieldLocalized) await payload.db.migrateFieldLocalized({ slug: '${change.slug}', entity: '${change.entity}', fieldPath: '${change.fieldPath}', defaultLocale: '${options.defaultLocale ?? ''}', req })`,
        )
        break

      case 'field_localized':
        upLines.push(
          `  if (payload.db.migrateFieldLocalized) await payload.db.migrateFieldLocalized({ slug: '${change.slug}', entity: '${change.entity}', fieldPath: '${change.fieldPath}', defaultLocale: '${options.defaultLocale ?? ''}', req })`,
        )
        downLines.push(
          `  if (payload.db.migrateFieldDelocalized) await payload.db.migrateFieldDelocalized({ slug: '${change.slug}', entity: '${change.entity}', fieldPath: '${change.fieldPath}', defaultLocale: '${options.defaultLocale ?? ''}', req })`,
        )
        break

      default:
        break
    }
  }

  return {
    downCode: downLines.join('\n'),
    upCode: upLines.join('\n'),
  }
}
