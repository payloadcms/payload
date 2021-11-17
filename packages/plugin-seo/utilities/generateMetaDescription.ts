import getDataByPath from 'payload/dist/admin/components/forms/Form/getDataByPath';
import { Fields } from 'payload/dist/admin/components/forms/Form/types';
import { stringifyRichText } from './stringifyRichText';

export const generateMetaDescription = (fields: Fields): string => {
  let description = '';

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
        let newDescription = '';

        if (keyToUse === 'introContent') {
          newDescription = stringifyRichText(field);
        }

        if (keyToUse === 'richText') {
          newDescription = stringifyRichText(field);
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

            newDescription = stringifyRichText(richTextToUse);
          }
        }

        description = newDescription;
      }
    }
  }

  return description;
};
