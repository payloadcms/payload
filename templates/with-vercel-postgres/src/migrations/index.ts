import * as migration_20260322_233106_initial from './20260322_233106_initial'

export const migrations = [
  {
    up: migration_20260322_233106_initial.up,
    down: migration_20260322_233106_initial.down,
    name: '20260322_233106_initial',
  },
]
