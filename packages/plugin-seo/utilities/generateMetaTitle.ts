import { Fields } from 'payload/dist/admin/components/forms/Form/types';

const base = 'Hope Network';

export const generateMetaTitle = async (fields: Fields): Promise<string> => {
  const {
    title: {
      value: docTitle,
    },
    subsite,
  } = fields;

  if (subsite) {
    const {
      value: subsiteID
    } = subsite;

    const req = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/subsites/${subsiteID}`);
    const doc = await req.json();
    if (doc) {
      const {
        title: subsiteTitle
      } = doc;

      return `${base} | ${subsiteTitle} - ${docTitle}`;
    }
  }

  return `${base} | ${docTitle}`
};
