import { CollectionConfig } from 'payload/types';
import { Options } from './types';

const getParents = async (
  req: any,
  options: Options,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Record<string, unknown>[] = [],
): Promise<Record<string, unknown>[]> => {
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
      if (retrievedParent.parent) {
        return getParents(
          req,
          options,
          collection,
          retrievedParent,
          [
            retrievedParent,
            ...docs,
          ],
        );
      }

      return [
        retrievedParent,
        ...docs,
      ];
    }
  }

  return docs;
};

export default getParents;
