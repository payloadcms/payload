import { ListItemNode, ListNode } from '@lexical/list'
import { CHECK_LIST } from '@lexical/markdown'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { listItemNodeJSONSchema, listNodeJSONSchema } from '../../shared/schema.js'
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js'
import { i18n } from './i18n.js'

export const ChecklistFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#ChecklistFeatureClient',
      i18n,
      markdownTransformers: [CHECK_LIST],
      nodes: shouldRegisterListBaseNodes('checklist', featureProviderMap)
        ? [
            createNode({
              jsonSchema: listNodeJSONSchema,
              node: ListNode,
            }),
            createNode({
              jsonSchema: listItemNodeJSONSchema,
              node: ListItemNode,
            }),
          ]
        : [],
    }
  },
  key: 'checklist',
})
