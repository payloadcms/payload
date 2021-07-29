import { Config } from 'payload/config';
import getFormsCollection from './getFormsCollection';
import getFormSubmissionsCollection from './getFormSubmissionsCollection';
import { IncomingOptions } from './types';

const FormBuilder = (incomingOptions?: IncomingOptions) => (config: Config): Config => {
  const options = {
    fields: incomingOptions?.fields || ['text', 'select', 'email', 'state', 'country', 'checkbox'],
  };

  return {
    ...config,
    collections: [
      ...config?.collections || [],
      getFormsCollection(options),
      getFormSubmissionsCollection(options),
    ],
  };
};

export default FormBuilder;
