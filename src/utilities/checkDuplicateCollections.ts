import { DuplicateCollection } from '../errors';
import { PayloadCollectionConfig } from '../collections/config/types';

const getDuplicates = (arr: string[]) => arr.filter((item, index) => arr.indexOf(item) !== index);

const checkDuplicateCollections = (collections: PayloadCollectionConfig[]): void => {
  const duplicateSlugs = getDuplicates(collections.map((c) => c.slug));
  if (duplicateSlugs.length > 0) {
    throw new DuplicateCollection('slug', duplicateSlugs);
  }
  const duplicateLabels = getDuplicates(collections.map((c) => c.labels.singular));
  if (duplicateLabels.length > 0) {
    throw new DuplicateCollection('label', duplicateLabels);
  }
};

export default checkDuplicateCollections;
