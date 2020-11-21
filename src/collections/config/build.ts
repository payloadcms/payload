import { Collection } from './types';
import sanitize from './sanitize';

const buildCollection = (collection: Collection) => {
  const sanitized = sanitize(collection);

  return sanitized;
};

module.exports = buildCollection;
