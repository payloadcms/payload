import * as migration_20260810_161507 from './20260810_161507'
import * as migration_20260810_161509_blocks_as_json from './20260810_161509_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_161507.up,
    down: migration_20260810_161507.down,
    name: '20260810_161507',
  },
  {
    up: migration_20260810_161509_blocks_as_json.up,
    down: migration_20260810_161509_blocks_as_json.down,
    name: '20260810_161509_blocks_as_json',
  },
]
