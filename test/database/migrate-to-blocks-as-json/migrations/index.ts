import * as migration_20260810_162404 from './20260810_162404'
import * as migration_20260810_162405_blocks_as_json from './20260810_162405_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_162404.up,
    down: migration_20260810_162404.down,
    name: '20260810_162404',
  },
  {
    up: migration_20260810_162405_blocks_as_json.up,
    down: migration_20260810_162405_blocks_as_json.down,
    name: '20260810_162405_blocks_as_json',
  },
]
