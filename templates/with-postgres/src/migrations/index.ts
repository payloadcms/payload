import * as migration_20250324_203114_initial from './20250324_203114_initial'

export const migrations = [
  {
    up: migration_20250324_203114_initial.up,
    down: migration_20250324_203114_initial.down,
    name: '20250324_203114_initial',
  },
]
