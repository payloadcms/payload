import * as migration_20260328_094138 from './20260328_094138.js'
import * as migration_20260328_094140_blocks_as_json from './20260328_094140_blocks_as_json.js'

export const migrations = [
  {
    up: migration_20260328_094138.up,
    down: migration_20260328_094138.down,
    name: '20260328_094138',
  },
  {
    up: migration_20260328_094140_blocks_as_json.up,
    down: migration_20260328_094140_blocks_as_json.down,
    name: '20260328_094140_blocks_as_json',
  },
]
