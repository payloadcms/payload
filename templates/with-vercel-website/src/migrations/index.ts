import * as migration_20250205_192442_initial from './20250205_192442_initial'

export const migrations = [
  {
    up: migration_20250205_192442_initial.up,
    down: migration_20250205_192442_initial.down,
    name: '20250205_192442_initial',
  },
]
