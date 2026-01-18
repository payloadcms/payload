import { createServerFeature } from '../../../utilities/createServerFeature.js';
import { defaultSlateConverters } from './converter/defaultConverters.js';
import { convertSlateToLexical } from './converter/index.js';
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js';
/**
 * Enables on-the-fly conversion of Slate data to Lexical format through an afterRead hook.
 * Used for testing migrations before running the permanent migration script.
 * Only converts data that is in Slate format (arrays); Lexical data passes through unchanged.
 *
 * @example
 * ```ts
 * lexicalEditor({
 *   features: ({ defaultFeatures }) => [
 *     ...defaultFeatures,
 *     SlateToLexicalFeature({
 *       converters: [...defaultSlateConverters, MyCustomConverter],
 *       disableHooks: false, // Set to true during migration script
 *     }),
 *   ],
 * })
 * ```
 */
export const SlateToLexicalFeature = createServerFeature({
  feature: ({
    props
  }) => {
    if (!props) {
      props = {};
    }
    let converters = [];
    if (props?.converters && typeof props?.converters === 'function') {
      converters = props.converters({
        defaultConverters: defaultSlateConverters
      });
    } else if (props.converters && typeof props?.converters !== 'function') {
      converters = props.converters;
    } else {
      converters = defaultSlateConverters;
    }
    props.converters = converters;
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#SlateToLexicalFeatureClient',
      hooks: props.disableHooks ? undefined : {
        afterRead: [({
          value
        }) => {
          if (!value || !Array.isArray(value) || 'root' in value) {
            // incomingEditorState null or not from Slate
            return value;
          }
          // Slate => convert to lexical
          return convertSlateToLexical({
            converters: props.converters,
            slateData: value
          });
        }]
      },
      nodes: [{
        node: UnknownConvertedNode
      }],
      sanitizedServerFeatureProps: {
        converters
      }
    };
  },
  key: 'slateToLexical'
});
//# sourceMappingURL=feature.server.js.map