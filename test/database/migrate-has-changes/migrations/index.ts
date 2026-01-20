import * as migration_20260120_183134__initial from './20260120_183134__initial.js'
import * as migration_20260120_183135__added_comments from './20260120_183135__added_comments.js'
import * as migration_20260120_183136__added_others_and_comments_deleted_comments from './20260120_183136__added_others_and_comments_deleted_comments.js'

export const migrations = [
  {
    up: migration_20260120_183134__initial.up,
    down: migration_20260120_183134__initial.down,
    name: '20260120_183134__initial',
  },
  {
    up: migration_20260120_183135__added_comments.up,
    down: migration_20260120_183135__added_comments.down,
    name: '20260120_183135__added_comments',
  },
  {
    up: migration_20260120_183136__added_others_and_comments_deleted_comments.up,
    down: migration_20260120_183136__added_others_and_comments_deleted_comments.down,
    name: '20260120_183136__added_others_and_comments_deleted_comments',
  },
]
