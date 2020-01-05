import { DuplicateCollection, MissingCollectionLabel } from '../errors';

export default function validateCollection(collection, collections) {
  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }
}
