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
        siblingData,
      },
    },
  }) => {
    const finalLinkFields = transformExtraFields(
      props.fields,
      config,
      i18n,
      props.enabledCollections,
      props.disabledCollections,
    )

    for (const field of finalLinkFields) {
      if ('validate' in field && typeof field.validate === 'function' && field.validate) {
        const fieldValue = 'name' in field ? node.fields[field.name] : null

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
          siblingData,
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
