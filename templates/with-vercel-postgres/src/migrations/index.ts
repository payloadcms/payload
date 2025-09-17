import * as migration_20250917_134117_initial from './20250917_134117_initial'

export const migrations = [
  {
    up: migration_20250917_134117_initial.up,
    down: migration_20250917_134117_initial.down,
    name: '20250917_134117_initial',
  },
]
