import * as migration_20260120_212317 from './20260120_212317.js'
import * as migration_20260120_212318_blocks_as_json from './20260120_212318_blocks_as_json.js'

export const migrations = [
  {
    up: migration_20260120_212317.up,
    down: migration_20260120_212317.down,
    name: '20260120_212317',
  },
  {
    up: migration_20260120_212318_blocks_as_json.up,
    down: migration_20260120_212318_blocks_as_json.down,
    name: '20260120_212318_blocks_as_json',
  },
]
