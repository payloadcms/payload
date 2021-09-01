import { CollectionConfig } from 'payload/types';
import { Options, Breadcrumb } from './types';

const getParents = async (
  req: any,
  options: Options,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  breadcrumbs: Breadcrumb[] = [],
): Promise<Breadcrumb[]> => {
  const parent = doc[options?.parentFieldSlug || 'parent'];
  let retrievedParent;

  if (parent) {
    // If not auto-populated, and we have an ID
    if (typeof parent === 'string') {
      retrievedParent = await req.payload.findByID({
        req,
        id: parent,
        collection: collection.slug,
        depth: 0,
      });
    }

    // If auto-populated
    if (typeof parent === 'object') {
      retrievedParent = parent;
    }

    if (retrievedParent) {
      return retrievedParent.breadcrumbs;
    }
  }

  return breadcrumbs;
};

export default getParents;
