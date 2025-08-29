import * as migration_20250828_135828_initial from './20250828_135828_initial'

export const migrations = [
  {
    up: migration_20250828_135828_initial.up,
    down: migration_20250828_135828_initial.down,
    name: '20250828_135828_initial',
  },
]
