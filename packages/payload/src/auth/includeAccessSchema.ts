import { getTranslation } from '@payloadcms/translations'

import type { FlattenedField } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { SanitizedDocumentPermissions, SanitizedPermissions } from './types.js'

import { filterFieldsByAccess } from '../utilities/entityInputSchema/filterFieldsByAccess.js'
import { toWords } from '../utilities/formatLabels.js'

type AccessSchemaField = {
  label: string
  path: string
  type: FlattenedField['type']
}

export const includeAccessSchema = ({
  permissions,
  req,
}: {
  permissions: SanitizedPermissions
  req: PayloadRequest
}) => {
  const { collections, globals } = req.payload.config

  return {
    ...permissions,
    ...(permissions.collections && {
      collections: addEntitySchemas({
        entities: collections,
        permissions: permissions.collections,
        req,
      }),
    }),
    ...(permissions.globals && {
      globals: addEntitySchemas({ entities: globals, permissions: permissions.globals, req }),
    }),
  }
}

function addEntitySchemas<TPermissions extends SanitizedDocumentPermissions>({
  entities,
  permissions,
  req,
}: {
  entities: { flattenedFields: FlattenedField[]; slug: string }[]
  permissions: Record<string, TPermissions>
  req: PayloadRequest
}): Record<string, { schema?: AccessSchemaField[] } & TPermissions> {
  const result: Record<string, { schema?: AccessSchemaField[] } & TPermissions> = { ...permissions }

  for (const { slug, flattenedFields } of entities) {
    const entityPermissions = permissions[slug]

    if (!entityPermissions || !hasReadPermission({ read: entityPermissions.read })) {
      continue
    }

    const readableFields = filterFieldsByAccess({
      blocks: req.payload.config.blocks,
      fields: flattenedFields,
      // Conditional collection reads grant schema discovery without checking individual documents.
      permissions: { ...entityPermissions, read: true },
      shouldExcludeField: ({ read }) => !read,
    })

    result[slug] = {
      ...entityPermissions,
      schema: describeFields({ fields: readableFields, i18n: req.i18n }),
    }
  }

  return result
}

function hasReadPermission({ read }: { read: unknown }): boolean {
  return (
    read === true ||
    (typeof read === 'object' && read !== null && 'permission' in read && read.permission === true)
  )
}

function describeFields({
  fields,
  i18n,
  parentPath,
}: {
  fields: FlattenedField[]
  i18n: PayloadRequest['i18n']
  parentPath?: string
}): AccessSchemaField[] {
  const schema: AccessSchemaField[] = []

  for (const field of fields) {
    if ('hidden' in field && field.hidden) {
      continue
    }

    const path = parentPath ? `${parentPath}.${field.name}` : field.name

    if (field.type === 'group' || field.type === 'tab') {
      schema.push(...describeFields({ fields: field.flattenedFields, i18n, parentPath: path }))
      continue
    }

    const label = field.label ? getTranslation(field.label, i18n) : undefined
    schema.push({
      type: field.type,
      label: typeof label === 'string' ? label : toWords(field.name),
      path,
    })
  }

  return schema
}
