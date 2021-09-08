import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';
import { generateFullTitle } from '../../../utilities/generateFullTitle';
import populateBreadcrumbs from '../populateBreadcrumbs';
import { Options } from '../types';

const resaveChildren = (options: Options, collection: CollectionConfig): CollectionAfterChangeHook => ({ req: { payload }, req, doc }) => {
  const resaveChildrenAsync = async () => {
    const children = await payload.find({
      collection: collection.slug,
      where: {
        parent: {
          equals: doc.id,
        },
      },
      depth: 0,
    });

    children.docs.forEach((child) => {
      const newFullTitle = generateFullTitle(child);

      if (child.fullTitle !== newFullTitle) {
        payload.update({
          id: child.id,
          collection: collection.slug,
          data: {
            breadcrumbs: populateBreadcrumbs(req, options, collection, child),
          },
          depth: 0,
        });
      }
    });
  };

  // Non-blocking
  resaveChildrenAsync();

  return undefined;
};

export default resaveChildren;
