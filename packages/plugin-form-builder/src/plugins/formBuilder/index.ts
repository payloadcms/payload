import { Config } from 'payload/config';
import getFormsCollection from './getFormsCollection';
import getFormSubmissionsCollection from './getFormSubmissionsCollection';
import { IncomingOptions, SanitizedOptions } from './types';

const FormBuilder = (incomingOptions?: IncomingOptions) => (config: Config): Config => {
  const sanitizedOptions: SanitizedOptions = {
    fields: incomingOptions?.fields || [
      'text',
      'select',
      'email',
      'state',
      'country',
      'checkbox',
      'message',
      'payment'
    ],
    beforeEmail: incomingOptions?.beforeEmail,
  };

  return {
    ...config,
    collections: [
      ...config?.collections || [],
      getFormsCollection(sanitizedOptions),
      getFormSubmissionsCollection(sanitizedOptions),
    ],
  };
};

export default FormBuilder;
