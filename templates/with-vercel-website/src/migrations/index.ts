import * as migration_20250828_135848_initial from './20250828_135848_initial'

export const migrations = [
  {
    up: migration_20250828_135848_initial.up,
    down: migration_20250828_135848_initial.down,
    name: '20250828_135848_initial',
  },
]
