import * as migration_20250909_161006_initial from './20250909_161006_initial'

export const migrations = [
  {
    up: migration_20250909_161006_initial.up,
    down: migration_20250909_161006_initial.down,
    name: '20250909_161006_initial',
  },
]
