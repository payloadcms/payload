import * as migration_20250513_141034_initial from './20250513_141034_initial'

export const migrations = [
  {
    up: migration_20250513_141034_initial.up,
    down: migration_20250513_141034_initial.down,
    name: '20250513_141034_initial',
  },
]
