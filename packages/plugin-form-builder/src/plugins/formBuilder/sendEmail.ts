import { CollectionBeforeChangeHook } from 'payload/types';
import { SanitizedOptions } from './types';

const sendEmail = (options: SanitizedOptions): CollectionBeforeChangeHook => async ({ data, req: { payload } }) => {
  try {
    const form = await payload.findByID({
      id: data.id,
      collection: options?.formsOverrides?.slug || 'formSubmissions',
    });
  } catch (err) {
    return data;
  }

  return data;
};

export default sendEmail;
