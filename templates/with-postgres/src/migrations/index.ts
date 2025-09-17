import * as migration_20250917_134158_initial from './20250917_134158_initial'

export const migrations = [
  {
    up: migration_20250917_134158_initial.up,
    down: migration_20250917_134158_initial.down,
    name: '20250917_134158_initial',
  },
]
