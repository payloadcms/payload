import { ListItemNode, ListNode } from '@lexical/list';
import { createServerFeature } from '../../../../utilities/createServerFeature.js';
import { createNode } from '../../../typeUtilities.js';
import { ListHTMLConverter, ListItemHTMLConverter } from '../../htmlConverter.js';
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js';
import { ORDERED_LIST } from '../markdownTransformer.js';
import { i18n } from './i18n.js';
export const OrderedListFeature = createServerFeature({
  feature: ({
    featureProviderMap
  }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#OrderedListFeatureClient',
      i18n,
      markdownTransformers: [ORDERED_LIST],
      nodes: shouldRegisterListBaseNodes('ordered', featureProviderMap) ? [createNode({
        converters: {
          html: ListHTMLConverter
        },
        node: ListNode
      }), createNode({
        converters: {
          html: ListItemHTMLConverter
        },
        node: ListItemNode
      })] : []
    };
  },
  key: 'orderedList'
});
//# sourceMappingURL=index.js.map