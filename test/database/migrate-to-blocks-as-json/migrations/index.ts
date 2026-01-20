import * as migration_20260120_001531 from './20260120_001531.js'
import * as migration_20260120_001531_blocks_as_json from './20260120_001531_blocks_as_json.js'

export const migrations = [
  {
    up: migration_20260120_001531.up,
    down: migration_20260120_001531.down,
    name: '20260120_001531',
  },
  {
    up: migration_20260120_001531_blocks_as_json.up,
    down: migration_20260120_001531_blocks_as_json.down,
    name: '20260120_001531_blocks_as_json',
  },
]
