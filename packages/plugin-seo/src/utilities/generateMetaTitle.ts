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

    if (typeof subsiteID === 'string') {
      try {
        const req = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/subsites/${subsiteID}`);
        const doc = await req.json();

        if (req.status === 200) {
          const {
            title: subsiteTitle
          } = doc;

          return `${base} ${subsiteTitle} - ${docTitle}`;
        }
      } catch (e) {
        console.error(`error while generating meta title, cannot find subsite with id: ${subsiteID}`);
      }
    }
  }

  return `${base} - ${docTitle}`
};
