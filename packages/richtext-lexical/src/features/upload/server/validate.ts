import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'
import { isValidID } from 'payload'

import type { NodeValidation } from '../../typesServer.js'
import type { UploadFeatureProps } from './feature.server.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

export const uploadValidation = (
  props: UploadFeatureProps,
): NodeValidation<SerializedUploadNode> => {
  return async ({
    node,
    validation: {
      options: {
        id,
        operation,
        preferences,
        req,
        req: { payload, t },
      },
    },
  }) => {
    const idType = payload.collections[node.relationTo].customIDType || payload.db.defaultIDType
    // @ts-expect-error
    const nodeID = node?.value?.id || node?.value // for backwards-compatibility

    if (!isValidID(nodeID, idType)) {
      return t('validation:validUploadID')
    }

    if (!props?.collections) {
      return true
    }

    if (Object.keys(props?.collections).length === 0) {
      return true
    }

    const collection = props?.collections[node.relationTo]

    if (!collection?.fields?.length) {
      return true
    }

    const result = await fieldSchemasToFormState({
      id,
      collectionSlug: node.relationTo,
      data: node?.fields ?? {},
      fields: collection.fields,
      fieldSchemaMap: undefined,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      permissions: {},
      preferences,
      renderAllFields: false,
      req,
      schemaPath: '',
    })

    let errorPaths: string[] = []
    for (const fieldKey in result) {
      if (result[fieldKey].errorPaths) {
        errorPaths = errorPaths.concat(result[fieldKey].errorPaths)
      }
    }

    if (errorPaths.length) {
      return 'The following fields are invalid: ' + errorPaths.join(', ')
    }

    return true
  }
}
