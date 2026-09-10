import type { Block, Field, SanitizedConfig } from 'payload'

import type {
  AdminBlockDescriptor,
  AdminFieldDescriptor,
  AdminFieldsDescriptor,
  AdminPageModelDescriptor,
  CreateAdminPageModelOptions,
} from './types.js'

type FieldWithName = {
  name: string
} & Field

const joinPath = (parentPath: string, name: string): string => {
  return parentPath ? `${parentPath}.${name}` : name
}

const hasName = (field: Field): field is FieldWithName => {
  return 'name' in field && typeof field.name === 'string'
}

const getCommonFieldMetadata = (field: FieldWithName, path: string) => {
  const fieldMetadata = field as {
    admin?: { disabled?: boolean; hidden?: boolean; readOnly?: boolean }
    hidden?: boolean
    required?: boolean
  }
  const metadata: {
    admin?: { disabled: boolean; hidden: boolean; readOnly: boolean }
    hidden?: true
    path: string
    required?: true
  } = { path }

  if (fieldMetadata.required) {
    metadata.required = true
  }

  if (fieldMetadata.hidden === true) {
    metadata.hidden = true
  }

  if (
    fieldMetadata.admin?.disabled ||
    fieldMetadata.admin?.hidden ||
    fieldMetadata.admin?.readOnly
  ) {
    metadata.admin = {
      disabled: fieldMetadata.admin?.disabled === true,
      hidden: fieldMetadata.admin?.hidden === true,
      readOnly: fieldMetadata.admin?.readOnly === true,
    }
  }

  return metadata
}

const getBlockLabel = (block: { labels?: { singular?: unknown }; slug: string }): string => {
  return typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug
}

const createFieldsDescriptor = (
  fields: Field[],
  blocksBySlug: Readonly<Record<string, Block>>,
  parentPath = '',
): AdminFieldsDescriptor => {
  const descriptor: AdminFieldsDescriptor = {}

  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      Object.assign(descriptor, createFieldsDescriptor(field.fields, blocksBySlug, parentPath))
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && typeof tab.name === 'string') {
          const path = joinPath(parentPath, tab.name)
          descriptor[tab.name] = {
            type: 'group',
            fields: createFieldsDescriptor(tab.fields, blocksBySlug, path),
            path,
          }
        } else {
          Object.assign(descriptor, createFieldsDescriptor(tab.fields, blocksBySlug, parentPath))
        }
      }
      continue
    }

    if (!hasName(field)) {
      continue
    }

    const path = joinPath(parentPath, field.name)
    const commonMetadata = getCommonFieldMetadata(field, path)
    let fieldDescriptor: AdminFieldDescriptor

    if (field.type === 'text') {
      fieldDescriptor = {
        ...commonMetadata,
        type: 'text',
        hasMany: field.hasMany === true,
      }
    } else if (field.type === 'array') {
      fieldDescriptor = {
        ...commonMetadata,
        type: 'array',
        fields: createFieldsDescriptor(field.fields, blocksBySlug, path),
      }
    } else if (field.type === 'blocks') {
      const blocks: Record<string, AdminBlockDescriptor> = {}

      for (const block of field.blocks) {
        const resolvedBlock = typeof block === 'string' ? blocksBySlug[block] : block

        if (!resolvedBlock) {
          continue
        }

        blocks[resolvedBlock.slug] = {
          slug: resolvedBlock.slug,
          fields: createFieldsDescriptor(resolvedBlock.fields, blocksBySlug, path),
          label: getBlockLabel(resolvedBlock),
        }
      }

      fieldDescriptor = {
        ...commonMetadata,
        type: 'blocks',
        blocks,
      }
    } else if (field.type === 'group') {
      fieldDescriptor = {
        ...commonMetadata,
        type: 'group',
        fields: createFieldsDescriptor(field.fields, blocksBySlug, path),
      }
    } else if (field.type === 'relationship') {
      fieldDescriptor = {
        ...commonMetadata,
        type: 'relationship',
        hasMany: field.hasMany === true,
        relationTo: Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo],
      }
    } else {
      fieldDescriptor = {
        ...commonMetadata,
        type: field.type,
      }
    }

    descriptor[field.name] = fieldDescriptor
  }

  return descriptor
}

export const createAdminPageModelDescriptor = (
  config: SanitizedConfig,
  options: CreateAdminPageModelOptions,
): AdminPageModelDescriptor => {
  const blocksBySlug: Record<string, Block> = {}
  const collections: AdminPageModelDescriptor['collections'] = {}

  for (const block of config.blocks) {
    blocksBySlug[block.slug] = block
  }

  for (const collectionSlug of options.collections) {
    const collection = config.collections.find(({ slug }) => slug === collectionSlug)

    if (!collection) {
      throw new Error(
        `Cannot generate an Admin page model for unknown collection "${collectionSlug}".`,
      )
    }

    collections[collectionSlug] = {
      slug: collection.slug,
      fields: createFieldsDescriptor(collection.fields, blocksBySlug),
    }
  }

  return { collections }
}

export const createAdminPageModelSource = (
  config: SanitizedConfig,
  options: CreateAdminPageModelOptions,
): string => {
  const descriptor = createAdminPageModelDescriptor(config, options)

  return `export const adminPageModel = ${JSON.stringify(descriptor, null, 2)} as const\n`
}
