import * as migration_20251103_163403_initial from './20251103_163403_initial'

export const migrations = [
  {
    up: migration_20251103_163403_initial.up,
    down: migration_20251103_163403_initial.down,
    name: '20251103_163403_initial',
  },
]
