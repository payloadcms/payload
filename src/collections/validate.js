import { DuplicateCollection, MissingCollectionLabel, ExistingUser } from '../errors';

export default function validateCollection(collection, collections, userModel) {
  if (collection.auth && userModel) {
    throw new ExistingUser();
  }

  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }
}
