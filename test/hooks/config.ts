import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import TransformHooks from './collections/Transform';
import Hooks, { hooksSlug } from './collections/Hook';

export default buildConfig({
  collections: [
    TransformHooks,
    Hooks,
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
