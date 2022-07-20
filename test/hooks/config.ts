import { buildConfig } from '../buildConfig';
import TransformHooks from './collections/Transform';
import Hooks, { hooksSlug } from './collections/Hook';
import NestedGroupRelationship from './collections/NestedGroupRelationship';

export default buildConfig({
  collections: [
    TransformHooks,
    Hooks,
    NestedGroupRelationship,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: hooksSlug,
      data: {
        check: 'update',
        fieldBeforeValidate: false,
        collectionBeforeValidate: false,
        fieldBeforeChange: false,
        collectionBeforeChange: false,
        fieldAfterChange: false,
        collectionAfterChange: false,
        collectionBeforeRead: false,
        fieldAfterRead: false,
        collectionAfterRead: false,
      },
    });
  },
});
