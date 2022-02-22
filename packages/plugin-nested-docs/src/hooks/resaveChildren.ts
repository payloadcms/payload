import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';
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

    try {
      children.docs.forEach((child) => {
        payload.update({
          id: child.id,
          collection: collection.slug,
          data: {
            ...child,
            breadcrumbs: populateBreadcrumbs(req, options, collection, child),
          },
          depth: 0,
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Non-blocking
  resaveChildrenAsync();

  return undefined;
};

export default resaveChildren;
