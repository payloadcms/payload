import * as migration_20251105_063810_initial from './20251105_063810_initial'

export const migrations = [
  {
    up: migration_20251105_063810_initial.up,
    down: migration_20251105_063810_initial.down,
    name: '20251105_063810_initial',
  },
]
