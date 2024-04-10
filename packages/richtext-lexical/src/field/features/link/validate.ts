import { sanitizeFields } from 'payload/config'

import type { NodeValidation } from '../types.js'
import type { LinkFeatureServerProps } from './feature.server.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from './nodes/types.js'

import { transformExtraFields } from './plugins/floatingLinkEditor/utilities.js'

export const linkValidation = (
  props: LinkFeatureServerProps,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
): NodeValidation<SerializedAutoLinkNode | SerializedLinkNode> => {
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  const linkValidation: NodeValidation<SerializedAutoLinkNode | SerializedLinkNode> = async ({
    node,
    validation: {
      options: {
        id,
        operation,
        req,
        req: {
          i18n,
          payload: { config },
          user,
        },
      },
    },
  }) => {
    const transformedLinkFields = transformExtraFields(
      props.fields,
      config,
      i18n,
      props.enabledCollections,
      props.disabledCollections,
    )

    // TODO: Sanitization should happen sometime before this, so that it doesn't need to re-sanitize every time a field is validated
    const validRelationships = config.collections.map((c) => c.slug) || []
    // TODO: Might need a deepCopy. Does it sanitize already-sanitized fields?
    const sanitizedFields = sanitizeFields({
      config,
      fields: transformedLinkFields,
      requireFieldLevelRichTextEditor: true,
      validRelationships,
    })

    for (const field of sanitizedFields) {
      if ('validate' in field && typeof field.validate === 'function' && field.validate) {
        if ('name' in field && field.name === 'text') {
          continue // Skip text field validation, as the text field value is not included in the node data. It should only be validated within the link drawer on the frontend.
        }
        const fieldValue = 'name' in field ? node?.fields?.[field.name] : null

        const passesCondition = field.admin?.condition
          ? Boolean(
              field.admin.condition(fieldValue, node.fields, {
                user,
              }),
            )
          : true
        if (!passesCondition) {
          continue // Fixes https://github.com/payloadcms/payload/issues/4000. Do not validate fields without their conditions fulfilled
        }

        const validationResult = await field.validate(fieldValue, {
          ...field,
          id,
          data: fieldValue,
          operation,
          req,
          siblingData: node.fields,
        })

        if (validationResult !== true) {
          return validationResult
        }
      }
    }

    return true
  }

  return linkValidation
}
