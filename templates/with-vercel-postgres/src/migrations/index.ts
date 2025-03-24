import * as migration_20250324_203100_initial from './20250324_203100_initial'

export const migrations = [
  {
    up: migration_20250324_203100_initial.up,
    down: migration_20250324_203100_initial.down,
    name: '20250324_203100_initial',
  },
]
