import { createServerFeature } from '../../utilities/createServerFeature.js';
import { i18n } from './i18n.js';
/**
 * Allows you to store key-value attributes within TextNodes and define inline styles for each combination.
 * Inline styles are not part of the editorState, reducing the JSON size and allowing you to easily migrate or adapt styles later.
 *
 * This feature can be used, among other things, to add colors to text.
 *
 * For more information and examples, see the JSdocs for the "state" property that this feature receives as a parameter.
 *
 * @experimental There may be breaking changes to this API
 */
export const TextStateFeature = createServerFeature({
  feature: ({
    props
  }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextStateFeatureClient',
      clientFeatureProps: {
        state: props?.state
      },
      i18n
    };
  },
  key: 'textState'
});
//# sourceMappingURL=feature.server.js.map