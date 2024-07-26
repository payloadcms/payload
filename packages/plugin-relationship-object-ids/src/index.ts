import type { Config, Field, FieldHook } from 'payload'

import { getAfterReadHook } from './hooks/afterRead.js'
import { getBeforeChangeHook } from './hooks/beforeChange.js'

interface TraverseFieldsArgs {
  config: Config
  fields: Field[]
  keepAfterRead: boolean
}

const traverseFields = ({ config, fields, keepAfterRead }: TraverseFieldsArgs): Field[] => {
  return fields.map((field) => {
    if (field.type === 'relationship' || field.type === 'upload') {
      const afterRead: FieldHook[] = [...(field.hooks?.afterRead || [])]

      if (!keepAfterRead) {
        afterRead.unshift(getAfterReadHook({ config, field }))
      }

      return {
        ...field,
        hooks: {
          ...(field.hooks || {}),
          afterRead,
          beforeChange: [
            ...(field.hooks?.beforeChange || []),
            getBeforeChangeHook({ config, field }),
          ],
        },
      }
    }

    if ('fields' in field) {
      return {
        ...field,
        fields: traverseFields({ config, fields: field.fields, keepAfterRead }),
      }
    }

    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab) => {
          return {
            ...tab,
            fields: traverseFields({ config, fields: tab.fields, keepAfterRead }),
          }
        }),
      }
    }

    if (field.type === 'blocks') {
      return {
        ...field,
        blocks: field.blocks.map((block) => {
          return {
            ...block,
            fields: traverseFields({ config, fields: block.fields, keepAfterRead }),
          }
        }),
      }
    }

    return field
  })
}

interface Args {
  /*
    If you want to keep ObjectIDs as ObjectIDs after read, you can enable this flag.
    By default, all relationship ObjectIDs are stringified within the AfterRead hook.
  */
  keepAfterRead?: boolean
}

export const relationshipsAsObjectID =
  (args?: Args) =>
  (config: Config): Config => {
    const keepAfterRead = typeof args?.keepAfterRead === 'boolean' ? args.keepAfterRead : false

    return {
      ...config,
      collections: (config.collections || []).map((collection) => {
        return {
          ...collection,
          fields: traverseFields({
            config,
            fields: collection.fields,
            keepAfterRead,
          }),
        }
      }),
      globals: (config.globals || []).map((global) => {
        return {
          ...global,
          fields: traverseFields({
            config,
            fields: global.fields,
            keepAfterRead,
          }),
        }
      }),
    }
  }
