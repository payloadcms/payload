import * as migration_20260810_165244 from './20260810_165244'
import * as migration_20260810_165246_blocks_as_json from './20260810_165246_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_165244.up,
    down: migration_20260810_165244.down,
    name: '20260810_165244',
  },
  {
    up: migration_20260810_165246_blocks_as_json.up,
    down: migration_20260810_165246_blocks_as_json.down,
    name: '20260810_165246_blocks_as_json',
  },
]
