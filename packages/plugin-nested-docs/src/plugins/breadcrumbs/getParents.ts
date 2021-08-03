import { Payload } from 'payload';
import { CollectionConfig } from 'payload/types';
import { Options, Breadcrumb } from './types';
import formatBreadcrumb from './formatBreadcrumb';

const getParents = async (
  payload: Payload,
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
      retrievedParent = await payload.findByID({
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
      const parentBreadcrumb = formatBreadcrumb(
        options,
        collection,
        retrievedParent,
        breadcrumbs,
      );

      if (retrievedParent.parent) {
        return getParents(
          payload,
          options,
          collection,
          retrievedParent.parent,
          [
            parentBreadcrumb,
            ...breadcrumbs,
          ],
        );
      }

      return [
        parentBreadcrumb,
        ...breadcrumbs,
      ];
    }
  }

  return breadcrumbs;
};

export default getParents;
