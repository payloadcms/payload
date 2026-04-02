import * as migration_20260322_233115_initial from './20260322_233115_initial'

export const migrations = [
  {
    up: migration_20260322_233115_initial.up,
    down: migration_20260322_233115_initial.down,
    name: '20260322_233115_initial',
  },
]
