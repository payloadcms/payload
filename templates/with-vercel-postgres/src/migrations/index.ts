import * as migration_20250513_141003_initial from './20250513_141003_initial'

export const migrations = [
  {
    up: migration_20250513_141003_initial.up,
    down: migration_20250513_141003_initial.down,
    name: '20250513_141003_initial',
  },
]
