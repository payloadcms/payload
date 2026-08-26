import * as migration_20260810_194913 from './20260810_194913'
import * as migration_20260810_194915_blocks_as_json from './20260810_194915_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_194913.up,
    down: migration_20260810_194913.down,
    name: '20260810_194913',
  },
  {
    up: migration_20260810_194915_blocks_as_json.up,
    down: migration_20260810_194915_blocks_as_json.down,
    name: '20260810_194915_blocks_as_json',
  },
]
