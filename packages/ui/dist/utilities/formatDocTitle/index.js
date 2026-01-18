import { getTranslation } from '@payloadcms/translations';
import { formatDate } from './formatDateTitle.js';
import { formatLexicalDocTitle, isSerializedLexicalEditor } from './formatLexicalDocTitle.js';
import { formatRelationshipTitle } from './formatRelationshipTitle.js';
export const formatDocTitle = ({
  collectionConfig,
  data,
  dateFormat: dateFormatFromConfig,
  fallback,
  globalConfig,
  i18n
}) => {
  let title;
  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle;
    if (useAsTitle) {
      title = data?.[useAsTitle];
      if (title) {
        const fieldConfig = collectionConfig.fields.find(f => 'name' in f && f.name === useAsTitle);
        const isDate = fieldConfig?.type === 'date';
        const isRelationship = fieldConfig?.type === 'relationship';
        if (isDate) {
          const dateFormat = 'date' in fieldConfig.admin && fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig;
          title = formatDate({
            date: title,
            i18n,
            pattern: dateFormat
          }) || title;
        }
        if (isRelationship) {
          const formattedRelationshipTitle = formatRelationshipTitle(data[useAsTitle]);
          title = formattedRelationshipTitle;
        }
      }
    }
  }
  if (globalConfig) {
    title = getTranslation(globalConfig?.label, i18n) || globalConfig?.slug;
  }
  // richtext lexical case. We convert the first child of root to plain text
  if (title && isSerializedLexicalEditor(title)) {
    title = formatLexicalDocTitle(title.root.children?.[0]?.children || [], '');
  }
  if (!title && isSerializedLexicalEditor(fallback)) {
    title = formatLexicalDocTitle(fallback.root.children?.[0]?.children || [], '');
  }
  if (!title) {
    title = typeof fallback === 'string' ? fallback : `[${i18n.t('general:untitled')}]`;
  }
  return title;
};
//# sourceMappingURL=index.js.map