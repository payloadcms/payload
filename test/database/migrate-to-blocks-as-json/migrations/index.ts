import * as migration_20260810_173207 from './20260810_173207'
import * as migration_20260810_173208_blocks_as_json from './20260810_173208_blocks_as_json'

export const migrations = [
  {
    up: migration_20260810_173207.up,
    down: migration_20260810_173207.down,
    name: '20260810_173207',
  },
  {
    up: migration_20260810_173208_blocks_as_json.up,
    down: migration_20260810_173208_blocks_as_json.down,
    name: '20260810_173208_blocks_as_json',
  },
]
