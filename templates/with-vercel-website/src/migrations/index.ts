import * as migration_20250108_203010_initial from './20250108_203010_initial'

export const migrations = [
  {
    up: migration_20250108_203010_initial.up,
    down: migration_20250108_203010_initial.down,
    name: '20250108_203010_initial',
  },
]
