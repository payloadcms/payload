import { CollectionBeforeChangeHook } from '../../../../payload/types';
import { SanitizedOptions } from './types';

const sendEmail = (options: SanitizedOptions): CollectionBeforeChangeHook => async ({ data, req: { payload } }) => {
  const form = await payload.findByID({
    id: data.id,
    collection: 'formSubmissions',
  });

  return data;
};

export default sendEmail;
