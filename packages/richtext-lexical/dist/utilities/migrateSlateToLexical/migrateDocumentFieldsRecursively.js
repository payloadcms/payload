import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType, tabHasName } from 'payload/shared';
import { convertSlateToLexical } from '../../features/migrations/slateToLexical/converter/index.js';
export const migrateDocumentFieldsRecursively = ({
  data,
  fields,
  found,
  payload
}) => {
  for (const field of fields) {
    if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        found += migrateDocumentFieldsRecursively({
          data: data[field.name],
          fields: field.fields,
          found,
          payload
        });
      } else {
        found += migrateDocumentFieldsRecursively({
          data,
          fields: field.fields,
          found,
          payload
        });
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach(tab => {
        found += migrateDocumentFieldsRecursively({
          data: tabHasName(tab) ? data[tab.name] : data,
          fields: tab.fields,
          found,
          payload
        });
      });
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        data[field.name].forEach(row => {
          const blockTypeToMatch = row?.blockType;
          const block = payload?.blocks[blockTypeToMatch] ?? (field.blockReferences ?? field.blocks).find(block => typeof block !== 'string' && block.slug === blockTypeToMatch);
          if (block) {
            found += migrateDocumentFieldsRecursively({
              data: row,
              fields: block.fields,
              found,
              payload
            });
          }
        });
      }
      if (field.type === 'array') {
        data[field.name].forEach(row => {
          found += migrateDocumentFieldsRecursively({
            data: row,
            fields: field.fields,
            found,
            payload
          });
        });
      }
    }
    if (field.type === 'richText' && Array.isArray(data[field.name])) {
      // Slate richText
      const editor = field.editor;
      if (editor && typeof editor === 'object') {
        if ('features' in editor && editor.features?.length) {
          // find slatetolexical feature
          const slateToLexicalFeature = editor.editorConfig.resolvedFeatureMap.get('slateToLexical');
          if (slateToLexicalFeature) {
            // DO CONVERSION
            const {
              converters
            } = slateToLexicalFeature.sanitizedServerFeatureProps;
            data[field.name] = convertSlateToLexical({
              converters: converters,
              slateData: data[field.name]
            });
            found++;
          }
        }
      }
    }
  }
  return found;
};
//# sourceMappingURL=migrateDocumentFieldsRecursively.js.map