import * as migration_20250917_134138_initial from './20250917_134138_initial'

export const migrations = [
  {
    up: migration_20250917_134138_initial.up,
    down: migration_20250917_134138_initial.down,
    name: '20250917_134138_initial',
  },
]
