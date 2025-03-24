import * as migration_20250324_203108_initial from './20250324_203108_initial'

export const migrations = [
  {
    up: migration_20250324_203108_initial.up,
    down: migration_20250324_203108_initial.down,
    name: '20250324_203108_initial',
  },
]
