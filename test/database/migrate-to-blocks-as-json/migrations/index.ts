import * as migration_20260810_160154 from './20260810_160154'
import * as migration_20260810_160156_blocks_as_json from './20260810_160156_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_160154.up,
    down: migration_20260810_160154.down,
    name: '20260810_160154',
  },
  {
    up: migration_20260810_160156_blocks_as_json.up,
    down: migration_20260810_160156_blocks_as_json.down,
    name: '20260810_160156_blocks_as_json',
  },
]
