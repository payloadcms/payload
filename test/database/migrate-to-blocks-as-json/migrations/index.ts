import * as migration_20260810_182044 from './20260810_182044'
import * as migration_20260810_182046_blocks_as_json from './20260810_182046_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_182044.up,
    down: migration_20260810_182044.down,
    name: '20260810_182044',
  },
  {
    up: migration_20260810_182046_blocks_as_json.up,
    down: migration_20260810_182046_blocks_as_json.down,
    name: '20260810_182046_blocks_as_json',
  },
]
