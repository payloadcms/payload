import * as migration_20260810_171544 from './20260810_171544'
import * as migration_20260810_171546_blocks_as_json from './20260810_171546_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_171544.up,
    down: migration_20260810_171544.down,
    name: '20260810_171544',
  },
  {
    up: migration_20260810_171546_blocks_as_json.up,
    down: migration_20260810_171546_blocks_as_json.down,
    name: '20260810_171546_blocks_as_json',
  },
]
