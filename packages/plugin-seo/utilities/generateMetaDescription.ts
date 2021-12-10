import getDataByPath from 'payload/dist/admin/components/forms/Form/getDataByPath';
import { Fields } from 'payload/dist/admin/components/forms/Form/types';
import { stringifyRichText } from './stringifyRichText';

export const generateMetaDescription = (fields: Fields): string => {
  const {
    excerpt: {
      value: excerpt,
    },
  } = fields;

  let description = excerpt as string || '';

  if (!excerpt) {
    const firstBlock = getDataByPath(fields, 'layout.0');

    if (firstBlock) {
      // instead of writing a custom block for every type, we'll just iterate threw some generic keys and write a block each of those
      const commonKeys = [
        'introContent',
        'richText',
        'columns',
      ];

      const blockKeys = Object.keys(firstBlock);
      const matchingKeys = commonKeys.filter((commonKey) => blockKeys.includes(commonKey));

      if (matchingKeys.length > -1) {
        const keyToUse = matchingKeys[0];
        const field = firstBlock?.[keyToUse];

        if (field) {
          if (keyToUse === 'introContent') {
            const introContent = stringifyRichText(field);
            if (!description && introContent) description = introContent;
          }

          if (keyToUse === 'richText') {
            const richText = stringifyRichText(field);
            if (!description && richText) description = richText;
          }

          if (keyToUse === 'columns') {
            const firstColumn = field[0];
            if (firstColumn) {
              const {
                richText,
              } = firstColumn;

              let richTextToUse = richText;
              if (typeof richText === 'string') {
                richTextToUse = JSON.parse(richText);
              }

              const columnText = stringifyRichText(richTextToUse);
              if (!description && columnText) description = columnText;
            }
          }
        }
      }
    }
  }

  return description;
};
