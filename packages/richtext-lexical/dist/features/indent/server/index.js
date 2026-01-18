import { createServerFeature } from '../../../utilities/createServerFeature.js';
import { i18n } from './i18n.js';
export const IndentFeature = createServerFeature({
  feature: ({
    props
  }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#IndentFeatureClient',
      clientFeatureProps: props,
      i18n
    };
  },
  key: 'indent'
});
//# sourceMappingURL=index.js.map