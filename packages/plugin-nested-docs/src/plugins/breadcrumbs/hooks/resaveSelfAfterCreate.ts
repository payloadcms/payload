import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';

const resaveSelfAfterCreate = (collection: CollectionConfig): CollectionAfterChangeHook => ({ req: { payload }, req, doc, operation }) => {
  if (operation === 'create') {
    payload.update({
      collection: collection.slug,
      id: doc.id,
      depth: 0,
      data: {
        ...doc,
        breadcrumbs: doc.breadcrumbs.map((crumb, i) => ({
          ...crumb,
          doc: doc?.breadcrumbs?.length === i + 1 ? doc.id : crumb.doc,
        })),
      },
    });
  }

  return undefined;
};

export default resaveSelfAfterCreate;
