import { SanitizedCollectionConfig } from '../collections/config/types';

export const getCollectionRevisionsName = (collection: SanitizedCollectionConfig): string => `_${collection.slug}_revisions`;
