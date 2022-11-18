import { CollectionConfig } from '../collections/config/types';
import { extractTranslations } from '../translations/extractTranslations';

const labels = extractTranslations(['general:user', 'general:users']);

const defaultUser: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: labels['general:user'],
    plural: labels['general:users'],
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
  },
  fields: [],
};

export default defaultUser;
