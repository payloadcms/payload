import { CollectionConfig, CollectionAfterChangeHook } from 'payload/types';
import { Breadcrumb } from '../types';

type DocWithBreadcrumbs = {
  breadcrumbs: Breadcrumb[]
}

const resaveSelfAfterCreate = (collection: CollectionConfig): CollectionAfterChangeHook => async ({ req: { payload }, req, doc, operation }) => {
  const { breadcrumbs = [] } = doc as DocWithBreadcrumbs;

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
        breadcrumbs: breadcrumbs.map((crumb, i) => ({
          ...crumb,
          doc: breadcrumbs?.length === i + 1 ? doc.id : crumb.doc,
        })),
      },
    });
  }

  return undefined;
};

export default resaveSelfAfterCreate;
