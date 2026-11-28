import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { listItemNodeJSONSchema, listNodeJSONSchema } from '../../shared/schema.js'
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js'
import { listItemValidation, listValidation } from '../../shared/validate.js'
import { PAYLOAD_CHECK_LIST } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export const ChecklistFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#ChecklistFeatureClient',
      i18n,
      markdownTransformers: [PAYLOAD_CHECK_LIST],
      nodes: shouldRegisterListBaseNodes('checklist', featureProviderMap)
        ? [
            createNode({
              jsonSchema: listNodeJSONSchema,
              node: ListNode,
              validations: [listValidation],
            }),
            createNode({
              jsonSchema: listItemNodeJSONSchema,
              node: ListItemNode,
              validations: [listItemValidation],
            }),
          ]
        : [],
    }
  },
  key: 'checklist',
})
