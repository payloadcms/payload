import type { SerializedEditorState } from 'lexical'
import type { Field, FieldAffectingData, RichTextField } from 'payload'

import type { SanitizedServerEditorConfig } from '../../../../lexical/config/types.js'
import type { AdapterProps, LexicalRichTextAdapter } from '../../../../types.js'
import type { HTMLConverter } from '../converter/types.js'
import type { HTMLConverterFeatureProps } from '../index.js'

import { defaultHTMLConverters } from '../converter/defaultConverters.js'
import { convertLexicalToHTML } from '../converter/index.js'

type Props = {
  /**
   * Whether the lexicalHTML field should be hidden in the admin panel
   *
   * @default true
   */
  hidden?: boolean
  name: string
  /**
   * Whether the HTML should be stored in the database
   *
   * @default false
   */
  storeInDB?: boolean
}

/**
 * Combines the default HTML converters with HTML converters found in the features, and with HTML converters configured in the htmlConverter feature.
 *
 * @param editorConfig
 */
export const consolidateHTMLConverters = ({
  editorConfig,
}: {
  editorConfig: SanitizedServerEditorConfig
}): HTMLConverter[] => {
  const htmlConverterFeature = editorConfig.resolvedFeatureMap.get('htmlConverter')
  const htmlConverterFeatureProps: HTMLConverterFeatureProps =
    htmlConverterFeature?.sanitizedServerFeatureProps

  const defaultConvertersWithConvertersFromFeatures = [...defaultHTMLConverters]

  for (const converter of editorConfig.features.converters.html) {
    defaultConvertersWithConvertersFromFeatures.push(converter)
  }

  const finalConverters =
    htmlConverterFeatureProps?.converters &&
    typeof htmlConverterFeatureProps?.converters === 'function'
      ? htmlConverterFeatureProps.converters({
          defaultConverters: defaultConvertersWithConvertersFromFeatures,
        })
      : (htmlConverterFeatureProps?.converters as HTMLConverter[]) ||
        defaultConvertersWithConvertersFromFeatures

  // filter converters by nodeTypes. The last converter in the list wins. If there are multiple converters for the same nodeType, the last one will be used and the node types will be removed from
  // previous converters. If previous converters do not have any nodeTypes left, they will be removed from the list.
  // This guarantees that user-added converters which are added after the default ones will always have precedence
  const foundNodeTypes: string[] = []
  const filteredConverters: HTMLConverter[] = []
  for (const converter of finalConverters.reverse()) {
    if (!converter.nodeTypes?.length) {
      continue
    }
    const newConverter: HTMLConverter = {
      converter: converter.converter,
      nodeTypes: [...converter.nodeTypes],
    }
    newConverter.nodeTypes = newConverter.nodeTypes.filter((nodeType) => {
      if (foundNodeTypes.includes(nodeType)) {
        return false
      }
      foundNodeTypes.push(nodeType)
      return true
    })

    if (newConverter.nodeTypes.length) {
      filteredConverters.push(newConverter)
    }
  }

  return filteredConverters
}

// find the path of this field, as well as its sibling fields, by looking for this `field` in fields and traversing it recursively
function findFieldPathAndSiblingFields(
  fields: Field[],
  path: string[],
  field: FieldAffectingData,
): {
  path: string[]
  siblingFields: Field[]
} {
  for (const curField of fields) {
    if (curField === field) {
      return {
        path: [...path, curField.name],
        siblingFields: fields,
      }
    }

    if ('fields' in curField) {
      const result = findFieldPathAndSiblingFields(
        curField.fields,
        'name' in curField ? [...path, curField.name] : [...path],
        field,
      )
      if (result) {
        return result
      }
    } else if ('tabs' in curField) {
      for (const tab of curField.tabs) {
        const result = findFieldPathAndSiblingFields(
          tab.fields,
          'name' in tab ? [...path, tab.name] : [...path],
          field,
        )
        if (result) {
          return result
        }
      }
    } else if ('blocks' in curField) {
      for (const block of curField.blocks) {
        if (block?.fields?.length) {
          const result = findFieldPathAndSiblingFields(
            block.fields,
            [...path, curField.name, block.slug],
            field,
          )
          if (result) {
            return result
          }
        }
      }
    }
  }

  return null
}

export const lexicalHTML: (
  /**
   * A string which matches the lexical field name you want to convert to HTML.
   *
   * This has to be a SIBLING field of this lexicalHTML field - otherwise, it won't be able to find the lexical field.
   **/
  lexicalFieldName: string,
  props: Props,
) => Field = (lexicalFieldName, props) => {
  const { name = 'lexicalHTML', hidden = true, storeInDB = false } = props
  return {
    name,
    type: 'code',
    admin: {
      editorOptions: {
        language: 'html',
      },
      hidden,
    },
    hooks: {
      afterRead: [
        async ({
          collection,
          draft,
          field,
          global,
          overrideAccess,
          req,
          showHiddenFields,
          siblingData,
        }) => {
          const fields = collection ? collection.fields : global.fields

          const foundSiblingFields = findFieldPathAndSiblingFields(fields, [], field)

          if (!foundSiblingFields)
            throw new Error(
              `Could not find sibling fields of current lexicalHTML field with name ${field?.name}`,
            )

          const { siblingFields } = foundSiblingFields
          const lexicalField: RichTextField<SerializedEditorState, AdapterProps> =
            siblingFields.find(
              (field) => 'name' in field && field.name === lexicalFieldName,
            ) as RichTextField<SerializedEditorState, AdapterProps>

          const lexicalFieldData: SerializedEditorState = siblingData[lexicalFieldName]

          if (!lexicalFieldData) {
            return ''
          }

          if (!lexicalField) {
            throw new Error(
              'You cannot use the lexicalHTML field because the referenced lexical field was not found',
            )
          }

          const config = (lexicalField?.editor as LexicalRichTextAdapter)?.editorConfig

          if (!config) {
            throw new Error(
              'The linked lexical field does not have an editorConfig. This is needed for the lexicalHTML field.',
            )
          }

          if (!config?.resolvedFeatureMap?.has('htmlConverter')) {
            throw new Error(
              'You cannot use the lexicalHTML field because the linked lexical field does not have a HTMLConverterFeature',
            )
          }

          const finalConverters = consolidateHTMLConverters({
            editorConfig: config,
          })

          return await convertLexicalToHTML({
            converters: finalConverters,
            data: lexicalFieldData,
            draft,
            overrideAccess,
            req,
            showHiddenFields,
          })
        },
      ],
      beforeChange: [
        ({ siblingData, value }) => {
          if (storeInDB) {
            return value
          }
          delete siblingData[name]
          return null
        },
      ],
    },
  }
}
