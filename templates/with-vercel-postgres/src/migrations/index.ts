import * as migration_20250114_010454_initial from './20250114_010454_initial'

export const migrations = [
  {
    up: migration_20250114_010454_initial.up,
    down: migration_20250114_010454_initial.down,
    name: '20250114_010454_initial',
  },
]
