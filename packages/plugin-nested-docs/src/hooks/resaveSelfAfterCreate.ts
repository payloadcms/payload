import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';

const resaveSelfAfterCreate = (collection: CollectionConfig): CollectionAfterChangeHook => async ({ req: { payload }, req, doc, operation }) => {
  if (operation === 'create') {
    const originalDocWithDepth0 = await payload.findByID({
      collection: collection.slug,
      depth: 0,
      id: doc.id,
    });

    payload.update({
      collection: collection.slug,
      id: doc.id,
      depth: 0,
      data: {
        ...originalDocWithDepth0,
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
