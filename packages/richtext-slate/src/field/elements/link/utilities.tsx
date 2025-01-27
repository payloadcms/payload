import type { i18n } from 'i18next'
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'
import type { Editor } from 'slate'

import { Element, Range, Transforms } from 'slate'

import { getBaseFields } from './LinkDrawer/baseFields'

export const unwrapLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, { match: (n) => Element.isElement(n) && n.type === 'link' })
}

export const wrapLink = (editor: Editor): void => {
  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)

  const link = {
    children: isCollapsed ? [{ text: '' }] : [],
    newTab: false,
    type: 'link',
    url: undefined,
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

export const withLinks = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor
  const { isInline } = editor

  editor.isInline = (element) => {
    if (element.type === 'link') {
      return true
    }

    return isInline(element)
  }

  return editor
}

/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export function transformExtraFields(
  customFieldSchema:
    | ((args: { config: SanitizedConfig; defaultFields: Field[]; i18n: i18n }) => Field[])
    | Field[],
  config: SanitizedConfig,
  i18n: i18n,
): Field[] {
  const baseFields: Field[] = getBaseFields(config)

  const fields =
    typeof customFieldSchema === 'function'
      ? customFieldSchema({ config, defaultFields: baseFields, i18n })
      : baseFields

  // Wrap fields which are not part of the base schema in a group named 'fields' - otherwise they will be rendered but not saved
  const extraFields = []
  for (let i = fields.length - 1; i >= 0; i--) {
    const field = fields[i]

    if ('name' in field) {
      if (
        !baseFields.find((baseField) => !('name' in baseField) || baseField.name === field.name)
      ) {
        if (field.name !== 'fields' && field.type !== 'group') {
          extraFields.push(field)
          // Remove from fields from now, as they need to be part of the fields group below
          fields.splice(fields.indexOf(field), 1)
        }
      }
    }
  }

  if (Array.isArray(customFieldSchema) || fields.length > 0) {
    fields.push({
      name: 'fields',
      admin: {
        style: {
          borderBottom: 0,
          borderTop: 0,
          margin: 0,
          padding: 0,
        },
      },
      fields: Array.isArray(customFieldSchema)
        ? customFieldSchema.concat(extraFields)
        : extraFields,
      type: 'group',
    })
  }
  return fields
}
