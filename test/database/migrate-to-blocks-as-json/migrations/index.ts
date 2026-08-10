import * as migration_20260810_161137 from './20260810_161137'
import * as migration_20260810_161138_blocks_as_json from './20260810_161138_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_161137.up,
    down: migration_20260810_161137.down,
    name: '20260810_161137',
  },
  {
    up: migration_20260810_161138_blocks_as_json.up,
    down: migration_20260810_161138_blocks_as_json.down,
    name: '20260810_161138_blocks_as_json',
  },
]
