import * as migration_20260206_195134 from './20260206_195134.js'
import * as migration_20260206_195135_blocks_as_json from './20260206_195135_blocks_as_json.js'

export const migrations = [
  {
    up: migration_20260206_195134.up,
    down: migration_20260206_195134.down,
    name: '20260206_195134',
  },
  {
    up: migration_20260206_195135_blocks_as_json.up,
    down: migration_20260206_195135_blocks_as_json.down,
    name: '20260206_195135_blocks_as_json',
  },
]
