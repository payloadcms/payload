import payload from '../../../../../src';
import { AfterDeleteHook } from '../../../../../src/collections/config/types';

export interface BackpopulateCleanupHookArgs {
  source_field: string;
  target_slug: string;
  target_field: string;
}

const backpopulateCleanupHookFactory = ({
  source_field,
  target_field,
  target_slug,
}: BackpopulateCleanupHookArgs): AfterDeleteHook => {
  const cleanupHook = async ({
    req,
    id,
    doc
  }) => {
    // query all documents which have a relationship to this document
    console.log('backpopulateCleanupHookFactory hook');

    for (let targetId of doc[source_field]) {
      const targetDocument = await payload.findByID({
        collection: target_slug,
        id: targetId,
      });
      console.log('Found target document: ', targetDocument);

      // get the current backrefs
      const prevReferences = targetDocument[target_field].map((ref) => ref.id);

      // remove self from backrefs
      await payload.update({
        collection: target_slug,
        id: targetId,
        overrideAccess: true,
        data: {
          [target_field]: prevReferences.filter((id) => id && id !== doc.id),
        },
      });
    }
  };

  return cleanupHook;
};

export default backpopulateCleanupHookFactory;
