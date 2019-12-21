import { DuplicateCollection, MissingCollectionLabel, DuplicateUserModel } from '../errors';

export default function validateCollection(collection, collections, userModel) {
  if (collection.auth && userModel) {
    throw new DuplicateUserModel();
  }

  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }
}
