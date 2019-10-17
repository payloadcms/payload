import { DuplicateCollectionLabelError, MissingCollectionLabelError } from '../errors';

export default function validateCollection(config, collections) {
  if (!config.labels.singular) {
    throw new MissingCollectionLabelError(config);
  }
  if (collections[config.labels.singular]) {
    throw new DuplicateCollectionLabelError(config);
  }
  // TODO: Come up with a lot more things to check for and throw errors about
}
