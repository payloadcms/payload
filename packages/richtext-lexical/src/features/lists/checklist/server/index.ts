import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../../htmlConverter.js'
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js'
import { CHECK_LIST } from '../markdownTransformers.js'
import { i18n } from './i18n.js'

export const ChecklistFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: '@ruya.sa/richtext-lexical/client#ChecklistFeatureClient',
      i18n,
      markdownTransformers: [CHECK_LIST],
      nodes: shouldRegisterListBaseNodes('checklist', featureProviderMap)
        ? [
            createNode({
              converters: {
                html: ListHTMLConverter as any, // ListHTMLConverter uses a different generic type than ListNode[exportJSON], thus we need to cast as any
              },
              node: ListNode,
            }),
            createNode({
              converters: {
                html: ListItemHTMLConverter as any,
              },
              node: ListItemNode,
            }),
          ]
        : [],
    }
  },
  key: 'checklist',
})
