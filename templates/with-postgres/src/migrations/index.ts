import * as migration_20250828_135907_initial from './20250828_135907_initial'

export const migrations = [
  {
    up: migration_20250828_135907_initial.up,
    down: migration_20250828_135907_initial.down,
    name: '20250828_135907_initial',
  },
]
