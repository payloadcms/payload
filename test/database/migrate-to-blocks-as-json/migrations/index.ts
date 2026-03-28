import * as migration_20260328_084236 from './20260328_084236.js'
import * as migration_20260328_084238_blocks_as_json from './20260328_084238_blocks_as_json.js'

export const migrations = [
  {
    up: migration_20260328_084236.up,
    down: migration_20260328_084236.down,
    name: '20260328_084236',
  },
  {
    up: migration_20260328_084238_blocks_as_json.up,
    down: migration_20260328_084238_blocks_as_json.down,
    name: '20260328_084238_blocks_as_json',
  },
]
