import { createServerFeature } from '../../../utilities/createServerFeature.js';
import { defaultConverters } from './converter/defaultConverters.js';
import { convertLexicalPluginToLexical } from './converter/index.js';
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js';
export const LexicalPluginToLexicalFeature = createServerFeature({
  feature: ({
    props
  }) => {
    if (!props) {
      props = {};
    }
    let converters = [];
    if (props?.converters && typeof props?.converters === 'function') {
      converters = props.converters({
        defaultConverters
      });
    } else if (props.converters && typeof props?.converters !== 'function') {
      converters = props.converters;
    } else {
      converters = defaultConverters;
    }
    props.converters = converters;
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#LexicalPluginToLexicalFeatureClient',
      hooks: props.disableHooks ? undefined : {
        afterRead: [({
          value
        }) => {
          if (!value || !('jsonContent' in value)) {
            // incomingEditorState null or not from Lexical Plugin
            return value;
          }
          // Lexical Plugin => convert to lexical
          return convertLexicalPluginToLexical({
            converters: props.converters,
            lexicalPluginData: value,
            quiet: props?.quiet
          });
        }]
      },
      nodes: [{
        node: UnknownConvertedNode
      }],
      sanitizedServerFeatureProps: props
    };
  },
  key: 'lexicalPluginToLexical'
});
//# sourceMappingURL=feature.server.js.map