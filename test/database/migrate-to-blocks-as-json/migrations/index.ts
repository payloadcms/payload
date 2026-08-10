import * as migration_20260810_163505 from './20260810_163505'
import * as migration_20260810_163506_blocks_as_json from './20260810_163506_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_163505.up,
    down: migration_20260810_163505.down,
    name: '20260810_163505',
  },
  {
    up: migration_20260810_163506_blocks_as_json.up,
    down: migration_20260810_163506_blocks_as_json.down,
    name: '20260810_163506_blocks_as_json',
  },
]
