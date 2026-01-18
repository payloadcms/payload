import { getPayloadPopulateFn } from '../../../utilities/payloadPopulateFn.js';
import { convertLexicalToHTMLAsync } from '../index.js';
/**
 *
 * Field that converts a sibling lexical field to HTML
 *
 * @todo will be renamed to lexicalHTML in 4.0, replacing the deprecated `lexicalHTML` converter
 */
export const lexicalHTMLField = args => {
  const {
    converters,
    hidden = true,
    htmlFieldName,
    lexicalFieldName,
    storeInDB = false
  } = args;
  const field = {
    name: htmlFieldName,
    type: 'code',
    admin: {
      editorOptions: {
        language: 'html'
      },
      hidden
    },
    hooks: {
      afterRead: [async ({
        currentDepth,
        depth,
        draft,
        overrideAccess,
        req,
        showHiddenFields,
        siblingData
      }) => {
        const lexicalFieldData = siblingData[lexicalFieldName];
        if (!lexicalFieldData) {
          return '';
        }
        const htmlPopulateFn = await getPayloadPopulateFn({
          currentDepth: currentDepth ?? 0,
          depth: depth ?? req.payload.config.defaultDepth,
          draft: draft ?? false,
          overrideAccess: overrideAccess ?? false,
          req,
          showHiddenFields: showHiddenFields ?? false
        });
        return await convertLexicalToHTMLAsync({
          converters,
          data: lexicalFieldData,
          populate: htmlPopulateFn
        });
      }]
    }
  };
  if (!storeInDB) {
    field.hooks = field.hooks ?? {};
    field.hooks.beforeChange = [({
      siblingData
    }) => {
      delete siblingData[htmlFieldName];
      return null;
    }];
  }
  return field;
};
//# sourceMappingURL=index.js.map