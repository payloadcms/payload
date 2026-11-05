import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { ErrorFieldsCollection } from './collections/ErrorFields/index.js'
import { PrevValue } from './collections/PrevValue/index.js'
import { PrevValueRelation } from './collections/PrevValueRelation/index.js'
import { TabErrorReset } from './collections/TabErrorReset/index.js'
import Uploads from './collections/Upload/index.js'
import { ValidateDraftsOff } from './collections/ValidateDraftsOff/index.js'
import { ValidateDraftsOn } from './collections/ValidateDraftsOn/index.js'
import { ValidateDraftsOnAndAutosave } from './collections/ValidateDraftsOnAutosave/index.js'
import { GlobalValidateDraftsOn } from './globals/ValidateDraftsOn/index.js'
import { seed } from './seed.js'

export default buildConfigWithDefaults({
  suite: 'field-error-states',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      ErrorFieldsCollection,
      Uploads,
      ValidateDraftsOn,
      ValidateDraftsOff,
      ValidateDraftsOnAndAutosave,
      PrevValue,
      PrevValueRelation,
      TabErrorReset,
    ],
    globals: [GlobalValidateDraftsOn],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
