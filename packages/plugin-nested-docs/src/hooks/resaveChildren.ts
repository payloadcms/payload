import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';
import populateBreadcrumbs from '../utilities/populateBreadcrumbs';
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
      children.docs.forEach((child: any) => {
        const updateAsDraft = typeof collection.versions === 'object' && collection.versions.drafts && child._status !== 'published';

        payload.update({
          id: child.id,
          collection: collection.slug,
          draft: updateAsDraft,
          data: {
            ...child,
            breadcrumbs: populateBreadcrumbs(req, options, collection, child),
          },
          depth: 0,
        });
      });
    } catch (err) {
      payload.logger.error(`Nested Docs plugin has had an error while resaving a child document.`)
      payload.logger.error(err);
    }
  };

  // Non-blocking
  resaveChildrenAsync();

  return undefined;
};

export default resaveChildren;
