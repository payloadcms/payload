import * as migration_20250326_181527_initial from './20250326_181527_initial'

export const migrations = [
  {
    up: migration_20250326_181527_initial.up,
    down: migration_20250326_181527_initial.down,
    name: '20250326_181527_initial',
  },
]
