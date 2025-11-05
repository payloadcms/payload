import * as migration_20251103_163323_initial from './20251103_163323_initial'

export const migrations = [
  {
    up: migration_20251103_163323_initial.up,
    down: migration_20251103_163323_initial.down,
    name: '20251103_163323_initial',
  },
]
