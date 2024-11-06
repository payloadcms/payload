import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { ErrorFieldsCollection } from './collections/ErrorFields'
import { PrevValue } from './collections/PrevValue'
import { PrevValueRelation } from './collections/PrevValueRelation'
import Uploads from './collections/Upload'
import { ValidateDraftsOff } from './collections/ValidateDraftsOff'
import { ValidateDraftsOn } from './collections/ValidateDraftsOn'
import { ValidateDraftsOnAndAutosave } from './collections/ValidateDraftsOnAutosave'

export default buildConfigWithDefaults({
  collections: [
    ErrorFieldsCollection,
    Uploads,
    ValidateDraftsOn,
    ValidateDraftsOff,
    ValidateDraftsOnAndAutosave,
    PrevValue,
    PrevValueRelation,
  ],
  graphQL: {
    schemaOutputFile: './test/field-error-states/schema.graphql',
  },

  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
