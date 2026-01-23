import * as migration_20260123_205803_initial from './20260123_205803_initial'

export const migrations = [
  {
    up: migration_20260123_205803_initial.up,
    down: migration_20260123_205803_initial.down,
    name: '20260123_205803_initial',
  },
]
