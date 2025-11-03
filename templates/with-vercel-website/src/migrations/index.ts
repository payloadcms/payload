import * as migration_20251103_163343_initial from './20251103_163343_initial'

export const migrations = [
  {
    up: migration_20251103_163343_initial.up,
    down: migration_20251103_163343_initial.down,
    name: '20251103_163343_initial',
  },
]
