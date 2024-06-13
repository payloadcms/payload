import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { ErrorFieldsCollection } from './collections/ErrorFields'
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
