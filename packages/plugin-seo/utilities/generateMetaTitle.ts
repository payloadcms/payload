import { Fields } from 'payload/dist/admin/components/forms/Form/types';

export const generateMetaTitle = (fields: Fields): string => {
  const {
    title: {
      value: docTitle,
    },
  } = fields;

  const title = `Hope Network – ${docTitle}`;

  return title;
};
