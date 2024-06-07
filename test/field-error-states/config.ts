import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ErrorFieldsCollection } from './collections/ErrorFields/index.js'
import Uploads from './collections/Upload/index.js'
import { ValidateDraftsOff } from './collections/ValidateDraftsOff/index.js'
import { ValidateDraftsOn } from './collections/ValidateDraftsOn/index.js'
import { ValidateDraftsOnAndAutosave } from './collections/ValidateDraftsOnAutosave/index.js'

export default buildConfigWithDefaults({
  collections: [
    ErrorFieldsCollection,
    Uploads,
    ValidateDraftsOn,
    ValidateDraftsOff,
    ValidateDraftsOnAndAutosave,
  ],
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
