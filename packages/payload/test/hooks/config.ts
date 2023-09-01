import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import AfterOperation from './collections/AfterOperation'
import ChainingHooks from './collections/ChainingHooks'
import ContextHooks from './collections/ContextHooks'
import Hooks, { hooksSlug } from './collections/Hook'
import NestedAfterReadHooks from './collections/NestedAfterReadHooks'
import Relations from './collections/Relations'
import TransformHooks from './collections/Transform'
import Users, { seedHooksUsers } from './collections/Users'

export default buildConfigWithDefaults({
  collections: [
    AfterOperation,
    ContextHooks,
    TransformHooks,
    Hooks,
    NestedAfterReadHooks,
    ChainingHooks,
    Relations,
    Users,
  ],
  onInit: async (payload) => {
    await seedHooksUsers(payload)
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
    })
  },
})
