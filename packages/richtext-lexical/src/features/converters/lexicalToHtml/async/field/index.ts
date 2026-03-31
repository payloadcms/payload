import type { SerializedEditorState } from 'lexical'
import type { Field, FieldAdmin } from 'payload'

import type { HTMLConvertersAsync, HTMLConvertersFunctionAsync } from '../types.js'

import { getPayloadPopulateFn } from '../../../utilities/payloadPopulateFn.js'
import { convertLexicalToHTMLAsync } from '../index.js'

type Args = {
  /**
   * Admin config for the lexicalHTML field
   *
   * The `editorOptions` property will be omitted and set to `{ language: 'html' }` by default.
   * @since v3.62.0
   */
  admin?: Omit<FieldAdmin, 'editorOptions'>
  converters?: HTMLConvertersAsync | HTMLConvertersFunctionAsync
  /**
   * Whether the lexicalHTML field should be hidden in the admin panel
   *
   * @deprecated since v3.62.0 - use the `admin` property instead
   * @todo remove deprecated hidden property in 4.0
   *
   * @default true
   */
  hidden?: boolean
  htmlFieldName: string
  /**
   * A string which matches the lexical field name you want to convert to HTML.
   *
   * This has to be a sibling field of this lexicalHTML field - otherwise, it won't be able to find the lexical field.
   **/
  lexicalFieldName: string
  /**
   * Whether the HTML should be stored in the database
   *
   * @default false
   */
  storeInDB?: boolean
}

/**
 *
 * Field that converts a sibling lexical field to HTML
 *
 * @todo will be renamed to lexicalHTML in 4.0, replacing the deprecated `lexicalHTML` converter
 */
export const lexicalHTMLField: (args: Args) => Field = (args) => {
  const {
    admin,
    converters,
    hidden = true, // TODO: remove deprecated `hidden` property in 4.0
    htmlFieldName,
    lexicalFieldName,
    storeInDB = false,
  } = args

  const field: Field = {
    name: htmlFieldName,
    type: 'code',
    admin: {
      ...{
        disableListColumn: true, // Disable list column by default for HTML field
        hidden, // TODO: remove deprecated `hidden` property in 4.0
        ...(admin || {}),
      },
      editorOptions: {
        language: 'html',
      },
    },
    hooks: {
      afterRead: [
        async ({
          currentDepth,
          depth,
          draft,
          overrideAccess,
          req,
          showHiddenFields,
          siblingData,
        }) => {
          const lexicalFieldData: SerializedEditorState = siblingData[lexicalFieldName]

          if (!lexicalFieldData) {
            return ''
          }

          const htmlPopulateFn = await getPayloadPopulateFn({
            currentDepth: currentDepth ?? 0,
            depth: depth ?? req.payload.config.defaultDepth,
            draft: draft ?? false,
            overrideAccess: overrideAccess ?? false,
            req,
            showHiddenFields: showHiddenFields ?? false,
          })

          return await convertLexicalToHTMLAsync({
            converters,
            data: lexicalFieldData,
            populate: htmlPopulateFn,
          })
        },
      ],
    },
  }

  if (!storeInDB) {
    field.hooks = field.hooks ?? {}
    field.hooks.beforeChange = [
      ({ siblingData }) => {
        delete siblingData[htmlFieldName]
        return null
      },
    ]
  }

  return field
}
